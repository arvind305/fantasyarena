import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiGetLongTermConfig } from "../api";

const DISMISS_KEY = "lt_banner_dismissed";

function getTimeLeft(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline) - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return { d, h, m, total: diff };
}

export default function LongTermBetsBanner() {
  const [deadline, setDeadline] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    apiGetLongTermConfig().then((cfg) => {
      if (cfg?.lockTime) {
        setDeadline(cfg.lockTime);
        setTimeLeft(getTimeLeft(cfg.lockTime));
      }
    });
  }, []);

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setTimeLeft(getTimeLeft(deadline)), 60000);
    return () => clearInterval(id);
  }, [deadline]);

  // Don't render if deadline not loaded, passed, or user dismissed
  if (!timeLeft || dismissed) return null;

  const isUrgent = timeLeft.total < 24 * 3600000; // under 24h

  const countdownStr = timeLeft.d > 0
    ? `${timeLeft.d}d ${timeLeft.h}h ${timeLeft.m}m`
    : `${timeLeft.h}h ${timeLeft.m}m`;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  };

  return (
    <div className={`relative rounded-xl border p-4 sm:p-5 mb-8 animate-slide-up ${
      isUrgent
        ? "bg-gradient-to-r from-red-950/40 to-amber-950/30 border-red-800/50"
        : "bg-gradient-to-r from-purple-950/40 to-amber-950/30 border-purple-800/40"
    }`}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-6">
        <div className="flex-1">
          <h3 className={`font-bold text-sm sm:text-base mb-1 ${isUrgent ? "text-amber-300" : "text-purple-300"}`}>
            Have you made your Tournament Predictions yet?
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm">
            Pick the <span className="text-gray-200 font-medium">Winner</span>,{" "}
            <span className="text-gray-200 font-medium">Finalists</span>,{" "}
            <span className="text-gray-200 font-medium">Final Four</span>,{" "}
            <span className="text-gray-200 font-medium">Highest Run Scorer</span> &{" "}
            <span className="text-gray-200 font-medium">Most Wickets</span> before it's too late!
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Countdown chip */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border ${
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

          {/* CTA */}
          <Link
            to="/long-term-bets"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              isUrgent
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-purple-600 hover:bg-purple-500 text-white"
            }`}
          >
            Make Predictions →
          </Link>
        </div>
      </div>
    </div>
  );
}
