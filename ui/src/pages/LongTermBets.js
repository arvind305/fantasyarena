import React, { useState, useEffect } from "react";
import {
  apiGetLongTermConfig,
  apiGetSquads,
  apiGetAllPlayers,
  apiGetUserLongTermBet,
  apiSubmitLongTermBet,
} from "../api";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";
import { useLongTermBets } from "../hooks/useLongTermBets";
import TournamentWinner from "../components/long-term/TournamentWinner";
import Finalists from "../components/long-term/Finalists";
import FinalFour from "../components/long-term/FinalFour";
import OrangeCap from "../components/long-term/OrangeCap";
import PurpleCap from "../components/long-term/PurpleCap";
import LongTermSummary from "../components/long-term/LongTermSummary";

// Same deadline as LongTermBetsBanner: Feb 20, 2026 00:00 IST = Feb 19, 2026 18:30 UTC
const PREDICTIONS_DEADLINE = new Date("2026-02-19T18:30:00Z");

function getTimeLeft() {
  const diff = PREDICTIONS_DEADLINE - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return { d, h, m, total: diff };
}

function LockStatusBanner({ isLocked, isReopened, editCost }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 60000);
    return () => clearInterval(id);
  }, []);

  if (isReopened) {
    return (
      <div className="card mb-6 bg-amber-950/30 border-amber-800/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-400 font-semibold">Editing Reopened (Paid)</p>
            <p className="text-gray-500 text-sm mt-1">
              Each save costs <span className="text-amber-300">{editCost}% of your points</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="card mb-6 bg-red-950/30 border-red-800/40">
        <p className="text-red-400 font-semibold">Submissions Locked</p>
        <p className="text-gray-500 text-sm mt-1">Predictions are locked for this tournament.</p>
      </div>
    );
  }

  // Open state — show countdown matching LongTermBetsBanner style
  const isUrgent = timeLeft && timeLeft.total < 24 * 3600000;
  const countdownStr = timeLeft
    ? (timeLeft.d > 0 ? `${timeLeft.d}d ${timeLeft.h}h ${timeLeft.m}m` : `${timeLeft.h}h ${timeLeft.m}m`)
    : null;

  return (
    <div className={`rounded-xl border p-4 sm:p-5 mb-6 ${
      isUrgent
        ? "bg-gradient-to-r from-red-950/40 to-amber-950/30 border-red-800/50"
        : "bg-gradient-to-r from-purple-950/40 to-amber-950/30 border-purple-800/40"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className={`font-bold ${isUrgent ? "text-amber-300" : "text-purple-300"}`}>
            Submissions Open
          </p>
          <p className="text-gray-400 text-sm mt-0.5">
            Pick the Winner, Finalists, Final Four, Highest Run Scorer & Most Wickets
          </p>
        </div>
        {countdownStr && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border shrink-0 ${
            isUrgent
              ? "bg-red-900/40 text-red-300 border-red-700/60"
              : "bg-amber-900/30 text-amber-300 border-amber-700/50"
          }`}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {countdownStr}
            {isUrgent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LongTermBets() {
  const { user } = useAuth();
  const identity = resolveIdentity(user);
  const toast = useToast();

  const [config, setConfig] = useState(null);
  const [squads, setSquads] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const bets = useLongTermBets();

  // Derived lock state
  const isLocked = config?.isLocked === true;
  const canEdit = !isLocked || config?.allowChanges;
  const isReopened = isLocked && config?.allowChanges;
  const editCost = isReopened && config?.changeCostPercent
    ? Math.round(config.changeCostPercent)
    : 0;

  useEffect(() => {
    async function load() {
      try {
        const [cfg, sq, pl] = await Promise.all([
          apiGetLongTermConfig(),
          apiGetSquads(),
          apiGetAllPlayers(),
        ]);

        setConfig(cfg);
        setSquads(sq || []);
        setAllPlayers(pl || []);

        if (user) {
          const userBet = await apiGetUserLongTermBet('t20wc_2026', identity.userId);
          if (userBet) {
            setExisting(userBet);
            bets.initializeFromExisting({
              winnerTeam: userBet.winnerTeam,
              finalistTeams: userBet.finalistTeams,
              finalFourTeams: userBet.finalFourTeams,
              orangeCapPlayers: userBet.orangeCapPlayers,
              purpleCapPlayers: userBet.purpleCapPlayers,
            });
          }
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]); // eslint-disable-line

  const disabled = (!canEdit && !isReopened) || !user;
  const isEdit = !!existing && isReopened;

  async function handleSubmit() {
    if (!user) return toast.error("Sign in to submit");

    const errors = bets.validate();
    if (errors.length > 0) {
      return toast.error(errors[0]);
    }

    setSubmitting(true);
    try {
      const result = await apiSubmitLongTermBet(
        't20wc_2026',
        identity.userId,
        bets.predictions
      );

      setExisting({
        ...bets.predictions,
        updatedAt: result.submittedAt,
      });

      if (isEdit && editCost > 0) {
        toast.success(`Predictions updated! ${editCost} points deducted.`);
      } else {
        toast.success("Long-term predictions submitted!");
      }
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

  if (!config) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card text-center py-10">
          <p className="text-gray-400">Long-term predictions are not available yet.</p>
          <p className="text-gray-600 text-sm mt-2">Check back when the admin has configured the tournament predictions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-purple-300 via-brand-400 to-pink-400 bg-clip-text text-transparent">
            Tournament Predictions
          </span>
        </h1>
        <p className="text-gray-500">Make your season-long predictions for the T20 World Cup 2026.</p>
      </div>

      {/* Lock Status Banner */}
      <LockStatusBanner isLocked={isLocked} isReopened={isReopened} editCost={editCost} />

      {/* Guest CTA */}
      {!user && (
        <div className="card mb-6 text-center py-6 bg-brand-950/40 border-brand-800/40">
          <p className="text-brand-300">Sign in to submit your tournament predictions</p>
        </div>
      )}

      {/* Existing Submission Banner */}
      {existing && (
        <div className="card mb-6 bg-emerald-950/20 border-emerald-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-400 font-semibold">Predictions Submitted</p>
              {existing.updatedAt && (
                <p className="text-gray-500 text-sm mt-1">
                  Last updated: {new Date(existing.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
            {isReopened && (
              <span className="px-3 py-1 bg-amber-900/50 text-amber-300 rounded-full text-sm">
                Edit available ({editCost}% pts)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Prediction Cards */}
      <div className="space-y-6">
        <TournamentWinner
          squads={squads}
          selected={bets.winnerTeam}
          onSelect={bets.setWinnerTeam}
          points={config.winnerPoints}
          disabled={disabled}
        />

        <Finalists
          squads={squads}
          selected={bets.finalistTeams}
          onToggle={bets.toggleFinalist}
          points={config.finalistPoints}
          disabled={disabled}
        />

        <FinalFour
          squads={squads}
          selected={bets.finalFourTeams}
          onToggle={bets.toggleFinalFour}
          points={config.finalFourPoints}
          disabled={disabled}
        />

        <OrangeCap
          allPlayers={allPlayers}
          selected={bets.orangeCapPlayers}
          onToggle={bets.toggleOrangeCap}
          points={config.orangeCapPoints}
          disabled={disabled}
        />

        <PurpleCap
          allPlayers={allPlayers}
          selected={bets.purpleCapPlayers}
          onToggle={bets.togglePurpleCap}
          points={config.purpleCapPoints}
          disabled={disabled}
        />

        <LongTermSummary
          predictions={bets.predictions}
          config={config}
          squads={squads}
          allPlayers={allPlayers}
          isComplete={bets.isComplete}
          onSubmit={handleSubmit}
          submitting={submitting}
          disabled={disabled}
          existing={existing}
          isEdit={isEdit}
          editCost={editCost}
        />
      </div>

      {/* Cannot Edit */}
      {user && !canEdit && !isReopened && !existing && (
        <div className="mt-8 card text-center bg-gray-900/50 border-gray-700">
          <p className="text-gray-400">Submissions are closed</p>
          <p className="text-gray-600 text-sm mt-1">You missed the deadline to submit predictions.</p>
        </div>
      )}
    </div>
  );
}
