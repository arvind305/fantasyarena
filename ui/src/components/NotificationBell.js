import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  isPushSupported,
  isIOSSafari,
  isStandalone,
  getSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "../lib/pushNotifications";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({ supported: false, subscribed: false, permission: "default" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);

  // Check subscription status on mount and when panel opens
  useEffect(() => {
    if (user) {
      getSubscriptionStatus().then(setStatus);
    }
  }, [user]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const showBadge = status.supported && !status.subscribed && status.permission !== "denied";
  const iosNeedsPWA = isIOSSafari() && !isStandalone();

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      await subscribeToPush(user.userId);
      const newStatus = await getSubscriptionStatus();
      setStatus(newStatus);
    } catch (err) {
      setError(err.message || "Failed to enable notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      await unsubscribeFromPush(user.userId);
      const newStatus = await getSubscriptionStatus();
      setStatus(newStatus);
    } catch (err) {
      setError(err.message || "Failed to disable notifications.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-800"
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {/* Red dot badge */}
        {showBadge && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-200">Match Reminders</h3>
            <p className="text-xs text-gray-500 mt-0.5">Get notified before matches lock</p>
          </div>

          <div className="px-4 py-3">
            {!isPushSupported() ? (
              <p className="text-sm text-gray-400">
                Push notifications are not supported on this browser.
              </p>
            ) : iosNeedsPWA ? (
              <div className="space-y-2">
                <p className="text-sm text-amber-400 font-medium">Add to Home Screen required</p>
                <p className="text-xs text-gray-400">
                  iOS Safari requires the app to be installed. Follow these steps:
                </p>
                <ol className="text-xs text-gray-400 list-decimal list-inside space-y-1">
                  <li>Tap the <span className="text-gray-200 font-medium">Share</span> button (bottom bar)</li>
                  <li>Scroll down and tap <span className="text-gray-200 font-medium">Add to Home Screen</span></li>
                  <li>Open Super Selector from your home screen</li>
                  <li>Come back here to enable notifications</li>
                </ol>
              </div>
            ) : status.permission === "denied" ? (
              <div className="space-y-2">
                <p className="text-sm text-red-400 font-medium">Notifications blocked</p>
                <p className="text-xs text-gray-400">
                  You've blocked notifications for this site. To unblock, go to your browser's site settings and allow notifications.
                </p>
              </div>
            ) : status.subscribed ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="text-sm text-emerald-400 font-medium">Notifications enabled</span>
                </div>
                <p className="text-xs text-gray-500">
                  You'll receive reminders 30 and 10 minutes before each match.
                </p>
                <button
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="w-full text-xs py-2 px-3 rounded-lg bg-gray-800 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-all disabled:opacity-50"
                >
                  {loading ? "Disabling..." : "Disable notifications"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-300">
                  Get reminders before matches lock so you never miss a bet.
                </p>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full text-sm py-2 px-3 rounded-lg bg-brand-600/20 border border-brand-700/50 text-brand-300 hover:bg-brand-600/30 transition-all font-medium disabled:opacity-50"
                >
                  {loading ? "Enabling..." : "Enable Match Reminders"}
                </button>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 mt-2">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
