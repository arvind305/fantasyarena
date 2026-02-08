import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetMatch, apiGetBettingQuestions, apiSubmitBets, apiGetUserBets, apiGetPlayers } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Countdown({ target }) {
  const [diff, setDiff] = useState(new Date(target) - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(new Date(target) - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (diff <= 0) return <span className="text-red-400 font-semibold">Started</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return <span className="font-mono text-brand-300">{h}h {m}m {s}s</span>;
}

export default function MatchBetting() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const identity = resolveIdentity(user);
  const toast = useToast();

  const [match, setMatch] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [answers, setAnswers] = useState({});
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Track numeric inputs separately for validation
  const [numericInputs, setNumericInputs] = useState({});

  useEffect(() => {
    Promise.all([
      apiGetMatch(matchId),
      apiGetBettingQuestions(matchId),
      apiGetPlayers(),
      user ? apiGetUserBets(matchId, identity.userId) : Promise.resolve(null),
    ])
      .then(([m, q, p, bets]) => {
        setMatch(m);
        setQuestions(q);
        setPlayers(p || []);
        if (bets) {
          setExisting(bets);
          setAnswers(bets.answers || {});
          // Restore numeric inputs from answers
          const numericQ = q.filter((qu) => qu.type === "NUMERIC_INPUT");
          const restored = {};
          for (const qu of numericQ) {
            if (bets.answers?.[qu.questionId]) {
              restored[qu.questionId] = bets.answers[qu.questionId];
            }
          }
          setNumericInputs(restored);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [matchId]);

  // Split questions by section - show all questions (admin controls what appears)
  const standardQuestions = questions.filter((q) => q.section === "STANDARD");
  const sideQuestions = questions.filter((q) => q.section === "SIDE");
  // Legacy questions (no section) for backwards compatibility
  const legacyQuestions = questions.filter((q) => !q.section);

  // Check if we have required sections
  const hasStandard = standardQuestions.length > 0 || legacyQuestions.length > 0;
  // Side bets are optional - admin controls whether they're included
  const hasSide = sideQuestions.length > 0 || true; // Always allow submission if standard exists

  // Lock and editability are derived from SERVER-PROVIDED status.
  const allQuestionsOpen = questions.length > 0 && questions.every((q) => q.status === "OPEN");
  const isLocked = !allQuestionsOpen || existing?.isLocked;
  const isEditable = allQuestionsOpen && !existing?.isLocked;

  // Validation: check all required questions answered
  function validateSubmission() {
    const errors = [];

    // WINNER, TOTAL_RUNS, and PLAYER_PICK are always required if present
    const requiredKinds = ["WINNER", "TOTAL_RUNS", "PLAYER_PICK"];

    const requiredStandard = standardQuestions.filter((q) =>
      requiredKinds.includes(q.kind)
    );
    for (const q of requiredStandard) {
      if (q.type === "NUMERIC_INPUT") {
        const val = numericInputs[q.questionId];
        if (!val || val.trim() === "") {
          errors.push(`Please answer: ${q.text}`);
        } else if (!/^\d+$/.test(val.trim())) {
          errors.push(`Invalid number for: ${q.text}`);
        }
      } else if (!answers[q.questionId]) {
        errors.push(`Please answer: ${q.text}`);
      }
    }

    // Runner question (required only if exists and runnersEnabled)
    // Runner is optional - user can skip if they don't want to pick runners

    // Side bets (all required if present)
    for (const q of sideQuestions) {
      if (!answers[q.questionId]) {
        errors.push(`Please answer side bet: ${q.text}`);
      }
    }

    // Legacy questions (all required if present)
    for (const q of legacyQuestions) {
      if (!answers[q.questionId]) {
        errors.push(`Please answer: ${q.text}`);
      }
    }

    return errors;
  }

  function handleNumericChange(questionId, value) {
    // Only allow digits (no commas, no decimals)
    const cleaned = value.replace(/[^\d]/g, "");
    setNumericInputs((prev) => ({ ...prev, [questionId]: cleaned }));
    // Also store in answers for submission
    if (cleaned) {
      setAnswers((prev) => ({ ...prev, [questionId]: cleaned }));
    }
  }

  async function handleSubmit() {
    if (!user) return toast.error("Sign in to submit your predictions");

    // Validate all required fields
    const errors = validateSubmission();
    if (errors.length > 0) {
      return toast.error(errors[0]); // Show first error
    }

    setSubmitting(true);
    try {
      const result = await apiSubmitBets(matchId, identity.userId, answers);
      setExisting(result);
      toast.success("Predictions submitted!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">Match not found</p>
          <Link to="/" className="text-brand-400 text-sm mt-2 inline-block">Back to Home</Link>
        </div>
      </div>
    );
  }

  // Check if we can submit (must have standard pack and at least 1 side bet)
  const canSubmit = hasStandard && (hasSide || legacyQuestions.length > 0);

  // Calculate bet summary stats
  const allQuestions = [...standardQuestions, ...sideQuestions, ...legacyQuestions];
  const answeredCount = allQuestions.filter((q) => answers[q.questionId]).length;
  const totalQuestions = allQuestions.length;

  const totalPotentialWin = allQuestions.reduce((sum, q) => {
    const multiplier = q.chaosMultiplier || q.slot?.multiplier || 1;
    return sum + (q.points || 0) * multiplier;
  }, 0);

  const totalPotentialLoss = allQuestions.reduce((sum, q) => {
    const multiplier = q.chaosMultiplier || q.slot?.multiplier || 1;
    const lossPoints = q.pointsWrong !== undefined ? q.pointsWrong : 0;
    return sum + lossPoints * multiplier;
  }, 0);

  // Determine risk profile based on potential loss
  const getRiskProfile = () => {
    if (totalPotentialLoss >= -5) return { label: "Conservative", color: "emerald", icon: "shield" };
    if (totalPotentialLoss >= -15) return { label: "Moderate", color: "amber", icon: "scale" };
    return { label: "Aggressive", color: "red", icon: "fire" };
  };
  const riskProfile = getRiskProfile();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Match Header */}
      <div className="card mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: match.teamA?.color + "30", color: match.teamA?.color }}>
                {match.teamA?.shortName}
              </div>
            </div>
            <span className="text-gray-500 text-sm font-semibold">vs</span>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: match.teamB?.color + "30", color: match.teamB?.color }}>
                {match.teamB?.shortName}
              </div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-gray-400">{formatDate(match.scheduledTime)}</div>
            <div className="text-gray-500 text-xs">{match.venue}</div>
            {match.status === "UPCOMING" && (
              <div className="mt-1">
                <span className="text-gray-500 text-xs">Starts in </span>
                <Countdown target={match.scheduledTime} />
              </div>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3">
          {match.status === "LIVE" && (
            <span className="px-2.5 py-1 rounded-full text-xs border bg-emerald-900/50 text-emerald-400 border-emerald-800">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 align-middle" />
              LIVE
            </span>
          )}
          {match.status === "COMPLETED" && (
            <span className="px-2.5 py-1 rounded-full text-xs border bg-gray-800/80 text-gray-400 border-gray-700">Completed</span>
          )}
          {match.status === "UPCOMING" && (
            <span className="px-2.5 py-1 rounded-full text-xs border bg-blue-900/50 text-blue-400 border-blue-800">Upcoming</span>
          )}
          {match.status === "ABANDONED" && (
            <span className="px-2.5 py-1 rounded-full text-xs border bg-red-900/50 text-red-400 border-red-800">Abandoned</span>
          )}
          {existing && (
            <span className="px-2.5 py-1 rounded-full text-xs border bg-brand-900/50 text-brand-300 border-brand-800">
              Submitted {new Date(existing.submittedAt).toLocaleTimeString()}
            </span>
          )}
          {match.result && <span className="text-sm text-gray-400 ml-auto">{match.result}</span>}
        </div>
      </div>

      {/* Guest CTA */}
      {!user && (
        <div className="card mb-6 text-center py-6 bg-brand-950/40 border-brand-800/40">
          <p className="text-brand-300 mb-2">Sign in to submit your predictions</p>
          <p className="text-gray-500 text-sm">You can browse the questions below, but need to be logged in to play.</p>
        </div>
      )}

      {/* No questions at all */}
      {questions.length === 0 && (
        <div className="card text-center py-12 bg-gray-900/50 border-gray-700">
          <p className="text-gray-400 text-lg mb-2">Betting questions not yet created for this match</p>
          <p className="text-gray-600 text-sm">Check back later when an admin has set up the questions.</p>
        </div>
      )}

      {/* Standard pack not published */}
      {questions.length > 0 && !hasStandard && (
        <div className="card mb-6 text-center py-8 bg-amber-950/30 border-amber-800/40">
          <p className="text-amber-400 font-semibold">Standard pack not published yet</p>
          <p className="text-gray-500 text-sm mt-1">Submission is blocked until standard bets are available.</p>
        </div>
      )}

      {/* Side bets not published (if using new schema) */}
      {questions.length > 0 && hasStandard && !hasSide && legacyQuestions.length === 0 && (
        <div className="card mb-6 text-center py-8 bg-purple-950/30 border-purple-800/40">
          <p className="text-purple-400 font-semibold">Side bets not published yet</p>
          <p className="text-gray-500 text-sm mt-1">At least 1 side bet is required. Submission is blocked.</p>
        </div>
      )}

      {/* Section A: Standard Bets */}
      {(standardQuestions.length > 0 || legacyQuestions.length > 0) && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Core Bets</h2>
              <p className="text-xs text-gray-500">Required predictions for this match</p>
            </div>
            <span className="ml-auto px-2.5 py-1 rounded-full text-xs bg-brand-900/50 text-brand-300 border border-brand-800">
              {standardQuestions.length + legacyQuestions.length} questions
            </span>
          </div>
          <div className="space-y-4">
            {standardQuestions.map((q, i) => (
              <QuestionCard
                key={q.questionId}
                question={q}
                index={i}
                players={players}
                answers={answers}
                setAnswers={setAnswers}
                numericInputs={numericInputs}
                handleNumericChange={handleNumericChange}
                disabled={q.status !== "OPEN" || !user}
              />
            ))}
            {/* Legacy questions in standard section */}
            {legacyQuestions.map((q, i) => (
              <QuestionCard
                key={q.questionId}
                question={q}
                index={standardQuestions.length + i}
                players={players}
                answers={answers}
                setAnswers={setAnswers}
                numericInputs={numericInputs}
                handleNumericChange={handleNumericChange}
                disabled={q.status !== "OPEN" || !user}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section B: Side Bets */}
      {sideQuestions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-purple-800/50">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Side Bets</h2>
              <p className="text-xs text-gray-500">High risk, high reward predictions</p>
            </div>
            <span className="ml-auto px-2.5 py-1 rounded-full text-xs bg-purple-900/50 text-purple-300 border border-purple-800">
              {sideQuestions.length} questions
            </span>
          </div>
          <div className="space-y-4">
            {sideQuestions.map((q, i) => (
              <QuestionCard
                key={q.questionId}
                question={q}
                index={i}
                players={players}
                answers={answers}
                setAnswers={setAnswers}
                numericInputs={numericInputs}
                handleNumericChange={handleNumericChange}
                disabled={q.status !== "OPEN" || !user}
                isSideBet
              />
            ))}
          </div>
        </div>
      )}

      {/* Bet Summary Card */}
      {allQuestions.length > 0 && user && (
        <div className="card mb-6 bg-gray-900/70 border-gray-700">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="font-semibold text-gray-200">Bet Summary</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Progress */}
            <div className="text-center p-3 rounded-lg bg-gray-800/50">
              <div className="text-2xl font-bold text-gray-200">
                {answeredCount}<span className="text-gray-500 text-lg">/{totalQuestions}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Questions Answered</div>
              <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Potential Win */}
            <div className="text-center p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/30">
              <div className="text-2xl font-bold text-emerald-400">+{totalPotentialWin}</div>
              <div className="text-xs text-emerald-600 mt-1">Max Points</div>
              <div className="text-xs text-gray-600 mt-1">if all correct</div>
            </div>

            {/* Potential Loss */}
            <div className="text-center p-3 rounded-lg bg-red-950/30 border border-red-900/30">
              <div className="text-2xl font-bold text-red-400">{totalPotentialLoss}</div>
              <div className="text-xs text-red-600 mt-1">Risk Points</div>
              <div className="text-xs text-gray-600 mt-1">if all wrong</div>
            </div>

            {/* Risk Profile */}
            <div className={`text-center p-3 rounded-lg ${
              riskProfile.color === "emerald" ? "bg-emerald-950/20 border border-emerald-900/30" :
              riskProfile.color === "amber" ? "bg-amber-950/20 border border-amber-900/30" :
              "bg-red-950/20 border border-red-900/30"
            }`}>
              <div className="flex justify-center mb-1">
                {riskProfile.icon === "shield" && (
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
                {riskProfile.icon === "scale" && (
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                )}
                {riskProfile.icon === "fire" && (
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                )}
              </div>
              <div className={`text-sm font-bold ${
                riskProfile.color === "emerald" ? "text-emerald-400" :
                riskProfile.color === "amber" ? "text-amber-400" :
                "text-red-400"
              }`}>{riskProfile.label}</div>
              <div className="text-xs text-gray-600 mt-1">Risk Profile</div>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      {user && isEditable && canSubmit && (
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary text-lg px-10 py-4 min-w-[200px]"
          >
            {submitting ? <Spinner size="sm" className="text-white inline mr-2" /> : null}
            {existing ? "Update Predictions" : "Submit Predictions"}
          </button>
        </div>
      )}

      {/* Cannot submit message */}
      {user && isEditable && !canSubmit && questions.length > 0 && (
        <div className="mt-8 card text-center bg-gray-900/50 border-gray-700">
          <p className="text-gray-400">Cannot submit yet</p>
          <p className="text-gray-600 text-sm mt-1">
            Waiting for all question sections to be published.
          </p>
        </div>
      )}

      {isLocked && existing && (
        <div className="mt-8 card text-center bg-emerald-950/20 border-emerald-800/30">
          <p className="text-emerald-400 font-semibold">Your predictions are locked!</p>
          <p className="text-gray-500 text-sm mt-1">Results will be revealed after the match.</p>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  players,
  answers,
  setAnswers,
  numericInputs,
  handleNumericChange,
  disabled,
  isSideBet,
}) {
  const q = question;
  const accentColor = isSideBet ? "purple" : "brand";

  // Build a lookup map for player names
  const playerNameMap = new Map(players.map((p) => [p.playerId, p.name]));

  // For PLAYER_PICK, use q.options as source of truth but enhance labels with player names
  const playerOptions = q.type === "PLAYER_PICK"
    ? (q.options || []).map((opt) => ({
        optionId: opt.optionId,
        label: playerNameMap.get(opt.referenceId) || opt.label || opt.referenceId || opt.optionId,
      }))
    : q.options || [];

  // Points display - handle side bets with +/- display
  const hasPenalty = q.pointsWrong !== undefined && q.pointsWrong < 0;
  const hasMultiplier = (q.slot?.multiplier && q.slot.multiplier > 1) || q.chaosMultiplier;
  const effectiveMultiplier = q.chaosMultiplier || q.slot?.multiplier || 1;
  const isHighRisk = hasPenalty && q.pointsWrong <= -5;

  // Determine card border/background based on risk
  const cardClasses = [
    "card animate-slide-up relative overflow-hidden",
    isHighRisk ? "border-red-800/50 bg-red-950/10" : "",
    hasMultiplier && effectiveMultiplier >= 2 ? "border-amber-700/40" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={cardClasses}
      style={{ animationDelay: `${index * 40}ms` }}
      title={isHighRisk ? "High risk question - significant point penalty if wrong" : hasMultiplier && effectiveMultiplier >= 2 ? "Boosted multiplier active" : ""}
    >
      {/* Multiplier accent stripe */}
      {hasMultiplier && effectiveMultiplier >= 2 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
      )}

      {/* Question header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-100 text-sm flex-1 leading-relaxed">
          <span className={`text-${accentColor}-400 mr-2`}>Q{index + 1}.</span>
          {q.text}
        </h3>

        {/* Points and multiplier display */}
        <div className="flex flex-wrap items-center gap-2 sm:ml-3">
          {/* Multiplier badge */}
          {hasMultiplier && effectiveMultiplier > 1 && (
            <span
              className="px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm"
              title={`${effectiveMultiplier}x multiplier applied to points`}
            >
              {effectiveMultiplier}x
            </span>
          )}

          {/* Points display */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-800/80 border border-gray-700">
            {hasPenalty ? (
              <>
                <span className="text-xs font-semibold text-emerald-400" title="Points if correct">
                  Win +{q.points}
                </span>
                <span className="text-gray-600">/</span>
                <span className="text-xs font-semibold text-red-400" title="Points if wrong">
                  Lose {q.pointsWrong}
                </span>
              </>
            ) : (
              <span className={`text-xs font-semibold ${q.points >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {q.points > 0 ? `+${q.points}` : q.points} pts
              </span>
            )}
          </div>

          {q.status === "LOCKED" && (
            <span className="px-2 py-0.5 rounded text-xs bg-amber-900/50 text-amber-400 border border-amber-800">
              Locked
            </span>
          )}
        </div>
      </div>

      {/* Risk indicator for high-risk questions */}
      {isHighRisk && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-red-400/80">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>High risk - significant penalty if wrong</span>
        </div>
      )}

      {/* Numeric Input (for TOTAL_RUNS) */}
      {q.type === "NUMERIC_INPUT" && (
        <div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={numericInputs[q.questionId] || ""}
            onChange={(e) => handleNumericChange(q.questionId, e.target.value)}
            disabled={disabled}
            placeholder="Enter a number (e.g., 350)"
            className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-lg text-gray-200
              ${disabled ? "opacity-70 cursor-not-allowed" : "focus:border-brand-600 focus:outline-none"}`}
          />
          <p className="text-xs text-gray-600 mt-1">
            Enter digits only (no commas or decimals)
          </p>
        </div>
      )}

      {/* Runner Pick placeholder */}
      {q.type === "RUNNER_PICK" && (
        <div className="text-center py-4 bg-gray-800/50 rounded-lg">
          <p className="text-gray-400 text-sm">
            Runner selection: Up to {q.runnerConfig?.maxRunners || 2} runners ({q.runnerConfig?.percent || 10}% pool)
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Runner options will be loaded from your group membership.
          </p>
        </div>
      )}

      {/* Radio/Checkbox options (YES_NO, TEAM_PICK, MULTI_CHOICE) */}
      {(q.type === "YES_NO" || q.type === "MULTI_CHOICE" || q.type === "TEAM_PICK") && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {q.options.map((opt) => (
            <label
              key={opt.optionId}
              className={`px-5 py-3 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-sm cursor-pointer border-2 transition-all min-w-[80px] text-center select-none active:scale-95 ${
                answers[q.questionId] === opt.optionId
                  ? isSideBet
                    ? "bg-purple-600/30 border-purple-500 text-purple-200 shadow-lg shadow-purple-900/30"
                    : "bg-brand-600/30 border-brand-500 text-brand-200 shadow-lg shadow-brand-900/30"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-750"
              } ${disabled ? "pointer-events-none opacity-70" : ""}`}
            >
              <input
                type="radio"
                name={q.questionId}
                value={opt.optionId}
                checked={answers[q.questionId] === opt.optionId}
                onChange={() => setAnswers((prev) => ({ ...prev, [q.questionId]: opt.optionId }))}
                disabled={disabled}
                className="sr-only"
              />
              {opt.label}
              {opt.weight && opt.weight > 1 && q.kind === "WINNER" && (
                <span className="ml-1 text-xs text-amber-400 font-semibold">({opt.weight}x)</span>
              )}
            </label>
          ))}
        </div>
      )}

      {/* Player Pick dropdown */}
      {q.type === "PLAYER_PICK" && (
        <select
          value={answers[q.questionId] || ""}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
          disabled={disabled}
          className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200
            ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          <option value="">Select a player...</option>
          {playerOptions.map((opt) => (
            <option key={opt.optionId} value={opt.optionId}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
