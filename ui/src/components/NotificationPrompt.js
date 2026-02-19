import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  isPushSupported,
  isIOSSafari,
  isStandalone,
  getSubscriptionStatus,
  subscribeToPush,
} from "../lib/pushNotifications";

const DISMISS_KEY = "notif_prompt_dismissed";

/**
 * One-time banner prompting users to enable push notifications.
 * Shows on the Play page for logged-in users who haven't subscribed yet.
 * Dismissed permanently when user clicks Enable or Dismiss.
 */
export default function NotificationPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!isPushSupported()) return;
    if (isIOSSafari() && !isStandalone()) return;

    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch { return; }

    getSubscriptionStatus().then((s) => {
      if (!s.subscribed && s.permission !== "denied") {
        setShow(true);
      }
    });
  }, [user]);

  if (!show || done) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      await subscribeToPush(user.userId);
      setDone(true);
      try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    } catch {
      // If permission denied or error, just dismiss
      setDone(true);
      try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDone(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  };

  return (
    <div className="relative rounded-xl border p-4 sm:p-5 mb-6 animate-slide-up bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border-blue-800/40">
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
          <h3 className="font-bold text-sm sm:text-base mb-1 text-blue-300">
            Never miss a match bet!
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm">
            Get reminders <span className="text-gray-200 font-medium">30 and 10 minutes</span> before each match starts, plus leaderboard updates after scoring.
          </p>
        </div>

        <button
          onClick={handleEnable}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 shrink-0"
        >
          {loading ? "Enabling..." : "Enable Notifications"}
        </button>
      </div>
    </div>
  );
}
