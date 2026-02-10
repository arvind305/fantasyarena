import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetMatch, apiGetBettingQuestions, apiSubmitBets, apiGetUserBets, apiGetPlayers, apiSubmitBetV2 } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";
import { useMatchConfig } from "../hooks/useMatchConfig";
import { useBet } from "../hooks/useBet";
import MatchWinnerBet from "../components/betting/MatchWinnerBet";
import TotalRunsBet from "../components/betting/TotalRunsBet";
import PlayerPicksSection from "../components/betting/PlayerPicksSection";
import SideBetsSection from "../components/betting/SideBetsSection";
import RunnerPicksSection from "../components/betting/RunnerPicksSection";
import BetSummary from "../components/betting/BetSummary";

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) + " IST";
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
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // V2: Fetch match_config, player_slots, side_bets
  const { config, slots, sideBets, loading: configLoading } = useMatchConfig(matchId);

  // V2: Bet form state
  const bet = useBet(config, slots, sideBets);

  // V1 (legacy) state
  const [questions, setQuestions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [answers, setAnswers] = useState({});
  const [numericInputs, setNumericInputs] = useState({});

  // Determine if this match uses V2 (match_config exists) or V1 (legacy questions)
  const useV2 = config !== null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, bets] = await Promise.all([
          apiGetMatch(matchId),
          user ? apiGetUserBets(matchId, identity.userId) : Promise.resolve(null),
        ]);
        setMatch(m);

        if (bets) {
          setExisting(bets);
          // V2 initialization happens via the config-dependent useEffect below
          // Also set legacy answers
          setAnswers(bets.answers || {});
        }

        // Only fetch legacy questions if no V2 config
        // We fetch them regardless as a fallback, but only display them if no config
        const [q, p] = await Promise.all([
          apiGetBettingQuestions(matchId),
          apiGetPlayers(),
        ]);
        setQuestions(q);
        setPlayers(p || []);

        if (bets && q) {
          const numericQ = q.filter((qu) => qu.type === "NUMERIC_INPUT");
          const restored = {};
          for (const qu of numericQ) {
            if (bets.answers?.[qu.questionId]) {
              restored[qu.questionId] = bets.answers[qu.questionId];
            }
          }
          setNumericInputs(restored);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [matchId]);

  // Re-initialize bet form when config loads and existing bet is available
  useEffect(() => {
    if (config && existing) {
      bet.initializeFromConfig(config, existing);
    }
  }, [config]);

  // V2: Lock check based on match_config.lock_time
  const lockTime = config?.lockTime;
  const isLockedByTime = lockTime && new Date(lockTime) <= new Date();
  const isLockedV2 = isLockedByTime || config?.status === "LOCKED" || config?.status === "SCORED" || config?.status === "DRAFT" || existing?.is_locked;
  const isEditableV2 = !isLockedV2 && config?.status === "OPEN";

  // V1 (legacy): Lock check
  const allQuestionsOpen = questions.length > 0 && questions.every((q) => q.status === "OPEN");
  const isLockedV1 = !allQuestionsOpen || existing?.isLocked;
  const isEditableV1 = allQuestionsOpen && !existing?.isLocked;

  // Choose correct lock state based on mode
  const isLocked = useV2 ? isLockedV2 : isLockedV1;
  const isEditable = useV2 ? isEditableV2 : isEditableV1;

  // V2 Submit
  async function handleSubmitV2() {
    if (!user) return toast.error("Sign in to submit your predictions");

    const errors = bet.validate();
    if (errors.length > 0) {
      return toast.error(errors[0]);
    }

    setSubmitting(true);
    try {
      const result = await apiSubmitBetV2(matchId, identity.userId, bet.betData);
      setExisting(result);
      toast.success(existing ? "Predictions updated!" : "Predictions submitted!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // V1 (legacy) Submit
  async function handleSubmitV1() {
    if (!user) return toast.error("Sign in to submit your predictions");

    const errors = validateLegacySubmission();
    if (errors.length > 0) {
      return toast.error(errors[0]);
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

  // Legacy validation
  function validateLegacySubmission() {
    const errors = [];
    const standardQuestions = questions.filter((q) => q.section === "STANDARD");
    const sideQuestions = questions.filter((q) => q.section === "SIDE");
    const legacyQuestions = questions.filter((q) => !q.section);

    const requiredKinds = ["WINNER", "TOTAL_RUNS", "PLAYER_PICK"];
    const requiredStandard = standardQuestions.filter((q) => requiredKinds.includes(q.kind));
    for (const q of requiredStandard) {
      if (q.type === "NUMERIC_INPUT") {
        const val = numericInputs[q.questionId];
        if (!val || val.trim() === "") errors.push(`Please answer: ${q.text}`);
        else if (!/^\d+$/.test(val.trim())) errors.push(`Invalid number for: ${q.text}`);
      } else if (!answers[q.questionId]) {
        errors.push(`Please answer: ${q.text}`);
      }
    }
    for (const q of sideQuestions) {
      if (!answers[q.questionId]) errors.push(`Please answer side bet: ${q.text}`);
    }
    for (const q of legacyQuestions) {
      if (!answers[q.questionId]) errors.push(`Please answer: ${q.text}`);
    }
    return errors;
  }

  function handleNumericChange(questionId, value) {
    const cleaned = value.replace(/[^\d]/g, "");
    setNumericInputs((prev) => ({ ...prev, [questionId]: cleaned }));
    if (cleaned) setAnswers((prev) => ({ ...prev, [questionId]: cleaned }));
  }

  if (loading || configLoading) {
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Match Header */}
      <MatchHeader match={match} existing={existing} />

      {/* Guest CTA */}
      {!user && (
        <div className="card mb-6 text-center py-6 bg-brand-950/40 border-brand-800/40">
          <p className="text-brand-300 mb-2">Sign in to submit your predictions</p>
          <p className="text-gray-500 text-sm">You can browse below, but need to be logged in to play.</p>
        </div>
      )}

      {/* Lock banner */}
      {isLocked && user && (
        <div className="card mb-6 bg-amber-950/30 border-amber-800/40">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-amber-400 font-semibold">Betting is locked</p>
              <p className="text-gray-500 text-sm">
                {existing ? "Your predictions are locked. Results will be revealed after the match." : "The deadline for this match has passed."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* V2: New match_config-based betting */}
      {useV2 ? (
        <V2BettingForm
          config={config}
          slots={slots}
          sideBets={sideBets}
          match={match}
          bet={bet}
          user={user}
          isEditable={isEditable}
          submitting={submitting}
          existing={existing}
          lockTime={lockTime}
          identity={identity}
          handleSubmit={handleSubmitV2}
        />
      ) : (
        <V1LegacyForm
          questions={questions}
          players={players}
          answers={answers}
          setAnswers={setAnswers}
          numericInputs={numericInputs}
          handleNumericChange={handleNumericChange}
          user={user}
          isEditable={isEditable}
          submitting={submitting}
          existing={existing}
          isLocked={isLocked}
          handleSubmit={handleSubmitV1}
        />
      )}
    </div>
  );
}

// ── Match Header ──────────────────────────────────────────────────────────

function MatchHeader({ match, existing }) {
  return (
    <div className="card mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: (match.teamA?.color || "#3b82f6") + "30", color: match.teamA?.color || "#3b82f6" }}>
              {match.teamA?.shortName}
            </div>
          </div>
          <span className="text-gray-500 text-sm font-semibold">vs</span>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: (match.teamB?.color || "#ef4444") + "30", color: match.teamB?.color || "#ef4444" }}>
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
            Submitted {new Date(existing.submittedAt || existing.submitted_at).toLocaleTimeString()}
          </span>
        )}
        {match.result && <span className="text-sm text-gray-400 ml-auto">{match.result}</span>}
      </div>
    </div>
  );
}

// ── V2 Betting Form (match_config-based) ──────────────────────────────────

function V2BettingForm({ config, slots, sideBets, match, bet, user, isEditable, submitting, existing, lockTime, identity, handleSubmit }) {
  const disabled = !isEditable || !user;

  return (
    <>
      {/* Lock time display */}
      {lockTime && !isEditable && (
        <div className="mb-4 text-center text-xs text-gray-500">
          Locked at {formatDate(lockTime)}
        </div>
      )}
      {lockTime && isEditable && (
        <div className="card mb-6 p-3 bg-gray-800/50 border-gray-700/50 text-center">
          <p className="text-xs text-gray-400">
            Betting closes: <span className="text-brand-300 font-medium">{formatDate(lockTime)}</span>
            <span className="ml-2">(<Countdown target={lockTime} />)</span>
          </p>
        </div>
      )}

      {/* Core Bets Section Header */}
      <div className="mb-6">
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
        </div>

        <div className="space-y-4">
          <MatchWinnerBet
            config={config}
            match={match}
            winner={bet.winner}
            setWinner={bet.setWinner}
            disabled={disabled}
          />
          <TotalRunsBet
            config={config}
            totalRuns={bet.totalRuns}
            setTotalRuns={bet.setTotalRuns}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Player Picks */}
      {config?.playerSlotsEnabled && slots.length > 0 && (
        <div className="mb-8">
          <PlayerPicksSection
            config={config}
            slots={slots}
            match={match}
            playerPicks={bet.playerPicks}
            setPlayerPick={bet.setPlayerPick}
            disabled={disabled}
            selectedPlayerIds={bet.selectedPlayerIds}
          />
        </div>
      )}

      {/* Side Bets */}
      {sideBets.length > 0 && (
        <div className="mb-8">
          <SideBetsSection
            sideBets={sideBets}
            sideBetAnswers={bet.sideBetAnswers}
            setSideBetAnswer={bet.setSideBetAnswer}
            disabled={disabled}
          />
        </div>
      )}

      {/* Runners */}
      {config?.runnersEnabled && (
        <div className="mb-8">
          <RunnerPicksSection
            config={config}
            runnerPicks={bet.runnerPicks}
            addRunnerPick={bet.addRunnerPick}
            removeRunnerPick={bet.removeRunnerPick}
            disabled={disabled}
            currentUserId={identity?.userId}
          />
        </div>
      )}

      {/* Bet Summary */}
      {user && (
        <div className="mb-6">
          <BetSummary
            config={config}
            slots={slots}
            sideBets={sideBets}
            winner={bet.winner}
            totalRuns={bet.totalRuns}
            playerPicks={bet.playerPicks}
            sideBetAnswers={bet.sideBetAnswers}
            runnerPicks={bet.runnerPicks}
          />
        </div>
      )}

      {/* Submit Button */}
      {user && isEditable && (
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting || !bet.isComplete}
            className="btn-primary text-lg px-10 py-4 w-full sm:w-auto sm:min-w-[200px]"
          >
            {submitting ? <Spinner size="sm" className="text-white inline mr-2" /> : null}
            {existing ? "Update Predictions" : "Submit Predictions"}
          </button>
          {!bet.isComplete && (
            <p className="text-xs text-gray-500 mt-2">Complete all required fields to submit</p>
          )}
        </div>
      )}
    </>
  );
}

// ── V1 Legacy Form (question-based) ──────────────────────────────────────

function V1LegacyForm({ questions, players, answers, setAnswers, numericInputs, handleNumericChange, user, isEditable, submitting, existing, isLocked, handleSubmit }) {
  const standardQuestions = questions.filter((q) => q.section === "STANDARD");
  const sideQuestions = questions.filter((q) => q.section === "SIDE");
  const legacyQuestions = questions.filter((q) => !q.section);

  const hasStandard = standardQuestions.length > 0 || legacyQuestions.length > 0;
  const hasSide = sideQuestions.length > 0 || true;
  const canSubmit = hasStandard && (hasSide || legacyQuestions.length > 0);

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

  if (questions.length === 0) {
    return (
      <div className="card text-center py-12 bg-gray-900/50 border-gray-700">
        <p className="text-gray-400 text-lg mb-2">Betting questions not yet created for this match</p>
        <p className="text-gray-600 text-sm">Check back later when an admin has set up the questions.</p>
      </div>
    );
  }

  return (
    <>
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
              <QuestionCard key={q.questionId} question={q} index={i} players={players} answers={answers} setAnswers={setAnswers} numericInputs={numericInputs} handleNumericChange={handleNumericChange} disabled={q.status !== "OPEN" || !user} />
            ))}
            {legacyQuestions.map((q, i) => (
              <QuestionCard key={q.questionId} question={q} index={standardQuestions.length + i} players={players} answers={answers} setAnswers={setAnswers} numericInputs={numericInputs} handleNumericChange={handleNumericChange} disabled={q.status !== "OPEN" || !user} />
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
              <QuestionCard key={q.questionId} question={q} index={i} players={players} answers={answers} setAnswers={setAnswers} numericInputs={numericInputs} handleNumericChange={handleNumericChange} disabled={q.status !== "OPEN" || !user} isSideBet />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-gray-800/50">
              <div className="text-2xl font-bold text-gray-200">{answeredCount}<span className="text-gray-500 text-lg">/{totalQuestions}</span></div>
              <div className="text-xs text-gray-500 mt-1">Answered</div>
              <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/30">
              <div className="text-2xl font-bold text-emerald-400">+{totalPotentialWin}</div>
              <div className="text-xs text-emerald-600 mt-1">Max Points</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-950/30 border border-red-900/30">
              <div className="text-2xl font-bold text-red-400">{totalPotentialLoss}</div>
              <div className="text-xs text-red-600 mt-1">Risk</div>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      {user && isEditable && canSubmit && (
        <div className="mt-8 text-center">
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-lg px-10 py-4 min-w-[200px]">
            {submitting ? <Spinner size="sm" className="text-white inline mr-2" /> : null}
            {existing ? "Update Predictions" : "Submit Predictions"}
          </button>
        </div>
      )}

      {isLocked && existing && (
        <div className="mt-8 card text-center bg-emerald-950/20 border-emerald-800/30">
          <p className="text-emerald-400 font-semibold">Your predictions are locked!</p>
          <p className="text-gray-500 text-sm mt-1">Results will be revealed after the match.</p>
        </div>
      )}
    </>
  );
}

// ── Legacy QuestionCard ──────────────────────────────────────────────────

function QuestionCard({ question, index, players, answers, setAnswers, numericInputs, handleNumericChange, disabled, isSideBet }) {
  const q = question;
  const accentColor = isSideBet ? "purple" : "brand";
  const playerNameMap = new Map(players.map((p) => [p.playerId, p.name]));

  const playerOptions = q.type === "PLAYER_PICK"
    ? (q.options || []).map((opt) => ({
        optionId: opt.optionId,
        label: playerNameMap.get(opt.referenceId) || opt.label || opt.referenceId || opt.optionId,
      }))
    : q.options || [];

  const hasPenalty = q.pointsWrong !== undefined && q.pointsWrong < 0;
  const hasMultiplier = (q.slot?.multiplier && q.slot.multiplier > 1) || q.chaosMultiplier;
  const effectiveMultiplier = q.chaosMultiplier || q.slot?.multiplier || 1;
  const isHighRisk = hasPenalty && q.pointsWrong <= -5;

  const cardClasses = [
    "card animate-slide-up relative overflow-hidden",
    isHighRisk ? "border-red-800/50 bg-red-950/10" : "",
    hasMultiplier && effectiveMultiplier >= 2 ? "border-amber-700/40" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cardClasses} style={{ animationDelay: `${index * 40}ms` }}>
      {hasMultiplier && effectiveMultiplier >= 2 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-100 text-sm flex-1 leading-relaxed">
          <span className={`text-${accentColor}-400 mr-2`}>Q{index + 1}.</span>
          {q.text}
        </h3>
        <div className="flex flex-wrap items-center gap-2 sm:ml-3">
          {hasMultiplier && effectiveMultiplier > 1 && (
            <span className="px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm">
              {effectiveMultiplier}x
            </span>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-800/80 border border-gray-700">
            {hasPenalty ? (
              <>
                <span className="text-xs font-semibold text-emerald-400">Win +{q.points}</span>
                <span className="text-gray-600">/</span>
                <span className="text-xs font-semibold text-red-400">Lose {q.pointsWrong}</span>
              </>
            ) : (
              <span className={`text-xs font-semibold ${q.points >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {q.points > 0 ? `+${q.points}` : q.points} pts
              </span>
            )}
          </div>
          {q.status === "LOCKED" && (
            <span className="px-2 py-0.5 rounded text-xs bg-amber-900/50 text-amber-400 border border-amber-800">Locked</span>
          )}
        </div>
      </div>

      {isHighRisk && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-red-400/80">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>High risk - significant penalty if wrong</span>
        </div>
      )}

      {q.type === "NUMERIC_INPUT" && (
        <div>
          <input
            type="text" inputMode="numeric" pattern="[0-9]*"
            value={numericInputs[q.questionId] || ""}
            onChange={(e) => handleNumericChange(q.questionId, e.target.value)}
            disabled={disabled}
            placeholder="Enter a number (e.g., 350)"
            className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-lg text-gray-200 ${disabled ? "opacity-70 cursor-not-allowed" : "focus:border-brand-600 focus:outline-none"}`}
          />
          <p className="text-xs text-gray-600 mt-1">Enter digits only (no commas or decimals)</p>
        </div>
      )}

      {q.type === "RUNNER_PICK" && (
        <div className="text-center py-4 bg-gray-800/50 rounded-lg">
          <p className="text-gray-400 text-sm">Runner selection is available in the new betting format</p>
        </div>
      )}

      {(q.type === "YES_NO" || q.type === "MULTI_CHOICE" || q.type === "TEAM_PICK") && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {q.options.map((opt) => (
            <label
              key={opt.optionId}
              className={`px-3 py-2.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm cursor-pointer border-2 transition-all sm:min-w-[80px] text-center select-none active:scale-95 ${
                answers[q.questionId] === opt.optionId
                  ? isSideBet
                    ? "bg-purple-600/30 border-purple-500 text-purple-200 shadow-lg shadow-purple-900/30"
                    : "bg-brand-600/30 border-brand-500 text-brand-200 shadow-lg shadow-brand-900/30"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-750"
              } ${disabled ? "pointer-events-none opacity-70" : ""}`}
            >
              <input type="radio" name={q.questionId} value={opt.optionId} checked={answers[q.questionId] === opt.optionId} onChange={() => setAnswers((prev) => ({ ...prev, [q.questionId]: opt.optionId }))} disabled={disabled} className="sr-only" />
              {opt.label}
              {opt.weight && opt.weight > 1 && q.kind === "WINNER" && (
                <span className="ml-1 text-xs text-amber-400 font-semibold">({opt.weight}x)</span>
              )}
            </label>
          ))}
        </div>
      )}

      {q.type === "PLAYER_PICK" && (
        <select
          value={answers[q.questionId] || ""}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
          disabled={disabled}
          className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          <option value="">Select a player...</option>
          {playerOptions.map((opt) => (
            <option key={opt.optionId} value={opt.optionId}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
