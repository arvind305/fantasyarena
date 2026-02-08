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
          <h2 className="text-xl font-bold mb-4 text-gray-200">
            <span className="text-brand-400">A.</span> Standard Bets
          </h2>
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
          <h2 className="text-xl font-bold mb-4 text-gray-200">
            <span className="text-purple-400">B.</span> Side Bets
          </h2>
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

      {/* Submit */}
      {user && isEditable && canSubmit && (
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary text-lg px-10 py-4"
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
  const pointsText = hasPenalty
    ? `+${q.points}/${q.pointsWrong}`
    : (q.points > 0 ? `+${q.points}` : String(q.points));
  const pointsColorClass = hasPenalty
    ? "text-amber-400"
    : (q.points >= 0 ? "text-emerald-400" : "text-red-400");

  return (
    <div
      className="card animate-slide-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-100 text-sm flex-1">
          <span className={`text-${accentColor}-400 mr-2`}>Q{index + 1}.</span>
          {q.text}
        </h3>
        <div className="flex items-center gap-2 ml-3">
          {q.slot && (
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {q.slot.multiplier}x
            </span>
          )}
          <span className={`text-xs ${pointsColorClass} whitespace-nowrap`}>
            {pointsText} pts
          </span>
          {q.status === "LOCKED" && (
            <span className="text-xs text-amber-500 whitespace-nowrap">Locked</span>
          )}
        </div>
      </div>

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
        <div className="flex flex-wrap gap-2">
          {q.options.map((opt) => (
            <label
              key={opt.optionId}
              className={`px-4 py-2 rounded-lg text-sm cursor-pointer border transition-all ${
                answers[q.questionId] === opt.optionId
                  ? isSideBet
                    ? "bg-purple-600/30 border-purple-600 text-purple-200"
                    : "bg-brand-600/30 border-brand-600 text-brand-200"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
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
                <span className="ml-1 text-xs text-amber-400">({opt.weight}x)</span>
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
