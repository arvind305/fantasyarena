import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiGetMatches, apiGetEvents, apiGetLongTermConfig } from "../api";
import { useAuth } from "../auth/AuthProvider";
import Spinner, { SkeletonCard } from "../components/Spinner";
import LongTermBetsBanner from "../components/LongTermBetsBanner";
import NotificationPrompt from "../components/NotificationPrompt";
import { formatDateRange, formatMatchDate, formatMatchTime, isToday, getRelativeDayLabel } from "../utils/date";
import { supabase, isSupabaseConfigured } from "../lib/supabase"; // still needed for user bets query
import { CURRENT_TOURNAMENT } from "../config/tournament";

const STATUS_BADGE = {
  UPCOMING: "bg-blue-900/50 text-blue-400 border-blue-800",
  LIVE: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
  COMPLETED: "bg-gray-800/80 text-gray-400 border-gray-700",
  ABANDONED: "bg-red-900/50 text-red-400 border-red-800",
  NO_RESULT: "bg-gray-800/80 text-gray-400 border-gray-700",
};

const MATCH_DURATION_MS = 4.5 * 60 * 60 * 1000; // 4.5 hours from match start

const TABS = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "tournament", label: "Tournament Bets" },
];

export default function Play() {
  const [matches, setMatches] = useState([]);
  const [event, setEvent] = useState(null);
  const [tournamentQuestionCount, setTournamentQuestionCount] = useState(null); // null = not loaded yet
  const [userBetMatchIds, setUserBetMatchIds] = useState(new Set()); // match IDs where user has placed bets
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced tab state
  const validTabs = ["today", "upcoming", "tournament"];
  const tabParam = searchParams.get("tab");
  const activeTab = validTabs.includes(tabParam) ? tabParam : "today";

  const setActiveTab = (tab) => {
    setSearchParams({ tab }, { replace: true });
  };

  // Auto-lock is handled by the daily cron (/api/cron/update-matches).
  // Client-side override in the rendering below covers the gap:
  // OPEN matches past their lock_time are displayed as LIVE.

  useEffect(() => {
    Promise.all([apiGetMatches(), apiGetEvents(), apiGetLongTermConfig()])
      .then(([m, events, ltConfig]) => {
        setMatches(m);
        if (events?.length) {
          setEvent(events[0]);
        }
        // Count non-null point fields as "questions available"
        const count = ltConfig ? [ltConfig.winnerPoints, ltConfig.finalistPoints, ltConfig.finalFourPoints, ltConfig.orangeCapPoints, ltConfig.purpleCapPoints].filter(Boolean).length : 0;
        setTournamentQuestionCount(count);
      })
      .catch(() => {
        // If config fails, leave count as null (will show generic text)
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch user's placed bets (just match IDs)
  useEffect(() => {
    if (!user?.userId || !supabase || !isSupabaseConfigured()) {
      setUserBetMatchIds(new Set());
      return;
    }
    supabase
      .from("bets")
      .select("match_id")
      .eq("user_id", user.userId)
      .then(({ data }) => {
        if (data) {
          setUserBetMatchIds(new Set(data.map((r) => r.match_id)));
        }
      });
  }, [user?.userId]);

  // Derive effective UI status from lock_time + estimated end:
  //   - lock_time passed + within 4.5 hours → LIVE
  //   - lock_time passed + over 4.5 hours → COMPLETED (results pending if not scored)
  //   - Already SCORED → COMPLETED (with result)
  // lockTime and dbStatus come from apiGetMatches (no separate query needed)
  const effectiveMatches = useMemo(() => {
    const now = new Date();
    return matches.map((m) => {
      if (m.status === "COMPLETED") return m; // Already scored

      const lockPassed = m.lockTime && new Date(m.lockTime) <= now;
      if (lockPassed) {
        const lockMs = new Date(m.lockTime).getTime();
        const estimatedEnd = lockMs + MATCH_DURATION_MS;
        if (now.getTime() < estimatedEnd) {
          return { ...m, status: "LIVE" };
        }
        return { ...m, status: "COMPLETED" };
      }
      return m;
    });
  }, [matches]);

  // Re-opened matches: DB status is OPEN, match date is in the past, AND lock_time is still in the future
  // (deliberately re-opened matches have far-future lock_times)
  const reopenedMatches = useMemo(() => {
    const now = new Date();
    return effectiveMatches
      .filter((m) => {
        return m.dbStatus === "OPEN" && new Date(m.scheduledTime) < now && m.lockTime && new Date(m.lockTime) > now;
      })
      .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
  }, [effectiveMatches]);

  // Filter matches
  const liveMatches = effectiveMatches.filter((m) => m.status === "LIVE");
  const todayMatches = effectiveMatches.filter(
    (m) => isToday(m.scheduledTime) && m.status !== "COMPLETED" && m.status !== "LIVE" && !reopenedMatches.includes(m)
  );

  // Upcoming matches: next 2 calendar days (excluding today), grouped by date
  const upcomingMatchesByDate = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate the window: tomorrow and day after (next 2 days excluding today)
    const day1 = new Date(todayStart);
    day1.setDate(day1.getDate() + 1);
    const day2 = new Date(todayStart);
    day2.setDate(day2.getDate() + 2);
    const windowEnd = new Date(todayStart);
    windowEnd.setDate(windowEnd.getDate() + 3); // Start of day 3 (exclusive)

    const upcoming = effectiveMatches
      .filter((m) => {
        const matchTime = new Date(m.scheduledTime);
        // Match must be >= tomorrow AND < day after tomorrow + 1 day (i.e., within next 2 days)
        return matchTime >= day1 && matchTime < windowEnd && m.status === "UPCOMING";
      })
      .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

    // Group by date
    const groups = [];
    let currentDate = null;
    let currentGroup = null;

    for (const match of upcoming) {
      const matchDate = new Date(match.scheduledTime).toDateString();
      if (matchDate !== currentDate) {
        currentDate = matchDate;
        currentGroup = { date: match.scheduledTime, matches: [] };
        groups.push(currentGroup);
      }
      currentGroup.matches.push(match);
    }
    return groups;
  }, [effectiveMatches]);

  const tournamentDateRange = event
    ? formatDateRange(event.startDate, event.endDate)
    : CURRENT_TOURNAMENT.fallbackDateRange;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-emerald-400 bg-clip-text text-transparent">
            Play
          </span>
        </h1>
        <p className="text-gray-500">
          {event?.name || CURRENT_TOURNAMENT.name} <span className="text-gray-600">•</span>{" "}
          <span className="text-gray-500">{tournamentDateRange}</span>
        </p>
      </div>

      <LongTermBetsBanner />
      <NotificationPrompt />

      {/* How to Play */}
      <div className="card mb-6 bg-gradient-to-br from-brand-950/50 to-gray-900 border-brand-800/40 animate-slide-up">
        <h2 className="text-sm font-semibold text-brand-300 mb-3 uppercase tracking-wide">How to Play</h2>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">•</span>
            Choose bets for each match (Standard + Side)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">•</span>
            Standard bets are always present
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">•</span>
            Side bets change every match
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">•</span>
            Place Tournament Bets any time before lock
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">•</span>
            Points add up across the tournament
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">•</span>
            Top the leaderboard to win
          </li>
        </ul>
      </div>

      {/* Login prompt */}
      {!user && (
        <div className="card mb-6 text-center py-4 bg-amber-950/20 border-amber-800/30 animate-slide-up">
          <p className="text-amber-300/80 text-sm">Sign in from the navbar to start placing bets</p>
        </div>
      )}

      {/* Live Matches Banner */}
      {liveMatches.length > 0 && (
        <div className="mb-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-emerald-400">Live Now</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {liveMatches.map((m) => (
              <MatchCard key={m.matchId} match={m} lockTime={m.lockTime} userHasBet={userBetMatchIds.has(m.matchId)} />
            ))}
          </div>
        </div>
      )}

      {/* Re-opened Matches Banner */}
      {reopenedMatches.length > 0 && (
        <div className="mb-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-lg font-bold text-amber-400">Open for Editing</h2>
            <span className="text-xs text-gray-500">({reopenedMatches.length} matches)</span>
          </div>
          <p className="text-gray-500 text-sm mb-3">These past matches have been re-opened — update your bets before they lock again</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {reopenedMatches.map((m, i) => (
              <MatchCard key={m.matchId} match={m} lockTime={m.lockTime} delay={i * 50} reopened userHasBet={userBetMatchIds.has(m.matchId)} />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900/50 p-1 rounded-lg border border-gray-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-brand-600/30 text-brand-300 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            {tab.label}
            {tab.id === "today" && todayMatches.length > 0 && (
              <span className="ml-2 text-xs bg-brand-600/30 px-1.5 py-0.5 rounded">{todayMatches.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Today Tab */}
          {activeTab === "today" && (
            <div className="animate-fade-in">
              {todayMatches.length > 0 ? (
                <>
                  <p className="text-gray-500 text-sm mb-4">Click a match to place your bets</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {todayMatches.map((m, i) => (
                      <MatchCard key={m.matchId} match={m} lockTime={m.lockTime} delay={i * 50} userHasBet={userBetMatchIds.has(m.matchId)} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="card text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg mb-2">No matches today</p>
                  <p className="text-gray-600 text-sm mb-4">Check the Upcoming tab for future fixtures</p>
                  <button
                    onClick={() => setActiveTab("upcoming")}
                    className="btn-secondary text-sm px-6 py-2"
                  >
                    View Upcoming Matches
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Tab */}
          {activeTab === "upcoming" && (
            <div className="animate-fade-in">
              {upcomingMatchesByDate.length > 0 ? (
                <>
                  <p className="text-gray-500 text-sm mb-4">Click a match to place your bets</p>
                  <div className="space-y-6">
                    {upcomingMatchesByDate.map((group, gi) => (
                      <div key={group.date}>
                        <h3 className="text-sm font-medium text-gray-400 mb-3 border-b border-gray-800 pb-2">
                          {formatMatchDate(group.date)}
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {group.matches.map((m, i) => (
                            <MatchCard key={m.matchId} match={m} lockTime={m.lockTime} delay={(gi * 3 + i) * 50} userHasBet={userBetMatchIds.has(m.matchId)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="card text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg mb-2">No upcoming matches in the next 2 days</p>
                  <p className="text-gray-600 text-sm">Check the Schedule for later fixtures</p>
                </div>
              )}
            </div>
          )}

          {/* Tournament Bets Tab */}
          {activeTab === "tournament" && (
            <div className="animate-fade-in">
              <div className="card bg-gradient-to-br from-purple-950/30 to-gray-900 border-purple-800/40">
                <h3 className="text-xl font-bold text-purple-300 mb-3">Tournament Predictions</h3>
                <p className="text-gray-400 mb-2">
                  Long-term bets let you predict tournament-wide outcomes before the action begins.
                  Unlike match bets, these stay locked throughout the event.
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Pick winners, top performers, and bracket outcomes for big points.
                </p>
                <p className="text-purple-400/80 text-sm mb-4">
                  {tournamentQuestionCount !== null && tournamentQuestionCount > 0
                    ? `${tournamentQuestionCount} tournament questions available`
                    : "Tournament questions available"}
                </p>
                <Link
                  to="/long-term-bets"
                  className="btn-primary inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500"
                >
                  Make Tournament Predictions
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function useLockCountdown(lockTime) {
  const [diff, setDiff] = useState(() => lockTime ? new Date(lockTime) - Date.now() : null);
  useEffect(() => {
    if (!lockTime) return;
    setDiff(new Date(lockTime) - Date.now());
    const id = setInterval(() => setDiff(new Date(lockTime) - Date.now()), 60000);
    return () => clearInterval(id);
  }, [lockTime]);
  return diff;
}

function LockIndicator({ lockTime }) {
  const diff = useLockCountdown(lockTime);
  if (diff === null) return null;

  if (diff <= 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400/90 mt-2">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Betting closed
      </div>
    );
  }

  const totalMins = Math.floor(diff / 60000);
  const h = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const timeStr = h > 0 ? `${h}h ${mins}m` : `${mins}m`;
  const isUrgent = totalMins <= 30;

  return (
    <div className={`flex items-center gap-1.5 text-xs mt-2 ${isUrgent ? "text-amber-400" : "text-gray-400"}`}>
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Closes in {timeStr}
      {isUrgent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
    </div>
  );
}

const STATUS_LABELS = {
  UPCOMING: "Upcoming",
  LIVE: "Live",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
  NO_RESULT: "No Result",
};

function MatchCard({ match: m, lockTime, delay = 0, reopened = false, userHasBet = false }) {
  const navigate = useNavigate();
  const statusLabel = reopened ? "Open" : (STATUS_LABELS[m.status] || m.status);
  const isLive = m.status === "LIVE";
  const isUpcoming = m.status === "UPCOMING";
  const isCompleted = m.status === "COMPLETED";
  const dayLabel = getRelativeDayLabel(m.scheduledTime);
  const isClosed = lockTime && new Date(lockTime) <= Date.now();

  // Determine CTA label and style based on bet status
  let ctaLabel, ctaClass;
  if (isClosed) {
    if (userHasBet) {
      ctaLabel = "Bets Placed";
      ctaClass = "bg-emerald-900/30 border border-emerald-800/50 text-emerald-400/80 cursor-default";
    } else {
      ctaLabel = "No Bets Placed";
      ctaClass = "bg-gray-800/50 border border-gray-700 text-gray-500 cursor-default";
    }
  } else {
    if (userHasBet) {
      ctaLabel = "Update Bets →";
      ctaClass = "bg-emerald-900/20 border border-emerald-800/50 text-emerald-400 group-hover:bg-emerald-900/30 group-hover:border-emerald-700";
    } else {
      ctaLabel = "Place Bets →";
      ctaClass = "bg-brand-600/20 border border-brand-700/50 text-brand-300 group-hover:bg-brand-600/30 group-hover:border-brand-600";
    }
  }

  return (
    <div
      onClick={() => navigate(`/match/${m.matchId}`)}
      className={`card hover:border-brand-600 hover:shadow-lg hover:shadow-brand-900/20 transition-all duration-300 cursor-pointer group animate-slide-up ${
        reopened ? "border-amber-800/40" : ""
      } ${userHasBet && !isCompleted ? "border-l-2 border-l-emerald-600" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{m.teamA}</span>
          <span className="text-gray-600 text-xs">vs</span>
          <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{m.teamB}</span>
        </div>
        <div className="flex items-center gap-2">
          {userHasBet && (isUpcoming || isLive) && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Bet placed
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full border ${
            reopened ? "bg-amber-900/50 text-amber-400 border-amber-800" : STATUS_BADGE[m.status] || ""
          }`}>
            {isLive && !reopened && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 align-middle" />
            )}
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Match details */}
      <div className="text-xs text-gray-500 mb-3">
        <div>{m.venue}</div>
        <div className="mt-1">
          <span className="text-gray-400">{dayLabel}</span> at {formatMatchTime(m.scheduledTime)}
        </div>
      </div>

      {/* Lock countdown / closed indicator — skip for reopened (lock is far future) */}
      {!reopened && isUpcoming && <LockIndicator lockTime={lockTime} />}

      {/* Result or CTA */}
      {reopened ? (
        <button className="w-full mt-3 py-2 px-3 rounded-lg text-sm font-medium transition-all bg-amber-600/20 border border-amber-700/50 text-amber-300 group-hover:bg-amber-600/30 group-hover:border-amber-600">
          Edit Bets →
        </button>
      ) : m.result ? (
        <div className="text-xs text-emerald-400">{m.result}</div>
      ) : isCompleted ? (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-500 italic">Results pending</span>
          {userHasBet ? (
            <span className="text-xs text-emerald-400/70">Bets Placed</span>
          ) : (
            <span className="text-xs text-gray-600">No Bets Placed</span>
          )}
        </div>
      ) : isUpcoming || isLive ? (
        <button className={`w-full mt-3 py-2 px-3 rounded-lg text-sm font-medium transition-all ${ctaClass}`}>
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}
