import React, { useState, useEffect } from "react";
import UserBetCard from "./UserBetCard";
import Spinner from "./Spinner";
import { apiGetUserMatchBet } from "../api";

/**
 * BetViewModal — modal for viewing a user's bet from the leaderboard.
 * Props: { open, onClose, matchId, userId, userName }
 */
export default function BetViewModal({ open, onClose, matchId, userId, userName }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !matchId || !userId) return;

    setLoading(true);
    setError(null);
    setData(null);

    apiGetUserMatchBet(matchId, userId)
      .then(result => {
        if (!result) {
          setError("No bet found or match is not locked yet.");
        } else {
          setData(result);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, matchId, userId]);

  if (!open) return null;

  const isScored = data?.config?.status === "SCORED";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-pop mb-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading && (
          <div className="card text-center py-12">
            <Spinner size="lg" />
            <p className="text-gray-500 text-sm mt-3">Loading bet details...</p>
          </div>
        )}

        {error && (
          <div className="card text-center py-8">
            <p className="text-gray-400">{error}</p>
            <button onClick={onClose} className="btn-secondary text-sm mt-4">Close</button>
          </div>
        )}

        {data && (
          <UserBetCard
            userName={userName}
            bet={data.bet}
            config={data.config}
            matchResults={data.results}
            playerStats={data.playerStats}
            sideBets={data.sideBets}
            slots={data.slots}
            isScored={isScored}
          />
        )}
      </div>
    </div>
  );
}
