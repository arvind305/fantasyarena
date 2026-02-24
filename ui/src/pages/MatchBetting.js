import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetMatch, apiGetUserBets, apiSubmitBetV2, apiGetMatchConfig } from "../api";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, bets] = await Promise.all([
          apiGetMatch(matchId),
          user ? apiGetUserBets(matchId, identity.userId) : Promise.resolve(null),
        ]);
        setMatch(m);
        if (bets) setExisting(bets);
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
  }, [config, existing]);

  // Lock check based on match_config.lock_time
  const lockTime = config?.lockTime;
  const isLockedByTime = lockTime && new Date(lockTime) <= new Date();
  const isLocked = isLockedByTime || config?.status === "LOCKED" || config?.status === "SCORED" || config?.status === "DRAFT" || existing?.is_locked;
  const isEditable = !isLocked && config?.status === "OPEN";

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

      {/* Match betting form */}
      {config ? (
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
        <div className="card text-center py-12 bg-gray-900/50 border-gray-700">
          <p className="text-gray-400 text-lg mb-2">Betting questions not yet created for this match</p>
          <p className="text-gray-600 text-sm">Check back later when an admin has set up the questions.</p>
        </div>
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
            disabled={submitting}
            className="btn-primary text-lg px-10 py-4 w-full sm:w-auto sm:min-w-[200px]"
          >
            {submitting ? <Spinner size="sm" className="text-white inline mr-2" /> : null}
            {existing ? "Update Predictions" : "Submit Predictions"}
          </button>
        </div>
      )}
    </>
  );
}

