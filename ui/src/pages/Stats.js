import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { apiGetMatches } from "../api";
import Tabs, { useTabsWithUrl, useUrlSync } from "../components/Tabs";
import { formatMatchDate } from "../utils/date";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const STATS_TABS = [
  { key: "overview", label: "Overview" },
  { key: "history", label: "Bet History" },
  { key: "breakdowns", label: "Breakdowns" },
];

const VALID_TABS = STATS_TABS.map((t) => t.key);

export default function Stats() {
  const { user } = useAuth();
  const identity = resolveIdentity(user);

  // URL-synced tab state
  useUrlSync();
  const [activeTab, setActiveTab] = useTabsWithUrl("tab", VALID_TABS, "overview");

  // Bet history state
  const [betHistory, setBetHistory] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState("all"); // "all" | "scored" | "pending"

  // Scored bets for breakdowns (derived from betHistory)
  const scoredBets = useMemo(
    () => betHistory.filter((b) => b.score !== null && b.score !== undefined),
    [betHistory]
  );

  // Load matches on mount
  useEffect(() => {
    apiGetMatches()
      .then((m) => setMatches(m))
      .catch((err) => console.warn("[Stats] Error loading matches:", err));
  }, []);

  // Load user bets from Supabase
  useEffect(() => {
    if (!identity.userId || !isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from("bets")
          .select("match_id, answers, player_picks, side_bet_answers, runner_picks, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points, submitted_at, is_locked")
          .eq("user_id", identity.userId)
          .order("submitted_at", { ascending: false });

        if (error) {
          console.warn("[Stats] Supabase error:", error.message);
          setBetHistory([]);
        } else {
          setBetHistory(data || []);
        }
      } catch (err) {
        console.warn("[Stats] Error loading bets:", err);
        setBetHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [identity.userId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-cyan-300 via-brand-400 to-blue-400 bg-clip-text text-transparent">
            Stats
          </span>
        </h1>
        <p className="text-gray-500">Your betting performance and history.</p>
      </div>

      {/* Tabs */}
      <Tabs tabs={STATS_TABS} activeKey={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Guest Banner */}
      {!user && (
        <div className="card mb-6 text-center py-4 bg-amber-950/20 border-amber-800/30">
          <p className="text-amber-300/80 text-sm">Sign in to view your personal stats</p>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <OverviewTab betHistory={betHistory} loading={loading} />
      )}

      {/* Bet History Tab */}
      {activeTab === "history" && (
        <BetHistoryTab
          betHistory={betHistory}
          matches={matches}
          loading={loading}
          historyFilter={historyFilter}
          setHistoryFilter={setHistoryFilter}
        />
      )}

      {/* Breakdowns Tab */}
      {activeTab === "breakdowns" && (
        <BreakdownsTab scoredBets={scoredBets} matches={matches} />
      )}
    </div>
  );
}

function BreakdownsTab({ scoredBets, matches }) {
  const hasData = scoredBets.length > 0;

  // Compute breakdowns from scored bets
  const breakdown = useMemo(() => {
    if (!hasData) return null;

    let totalWinner = 0;
    let totalRuns = 0;
    let totalPlayerPick = 0;
    let totalSideBet = 0;
    let totalRunner = 0;
    let totalScore = 0;

    const byMatch = [];

    scoredBets.forEach((b) => {
      const w = b.winner_points || 0;
      const r = b.total_runs_points || 0;
      const p = b.player_pick_points || 0;
      const s = b.side_bet_points || 0;
      const rn = b.runner_points || 0;
      const sc = b.score || 0;

      totalWinner += w;
      totalRuns += r;
      totalPlayerPick += p;
      totalSideBet += s;
      totalRunner += rn;
      totalScore += sc;

      const match = matches.find((m) => m.matchId === b.match_id);
      byMatch.push({
        matchId: b.match_id,
        label: match ? `${match.teamA} vs ${match.teamB}` : b.match_id,
        score: sc,
        winner: w,
        totalRuns: r,
        playerPick: p,
        sideBet: s,
        runner: rn,
      });
    });

    // Standard = winner + total_runs, Side = side_bet
    const standardTotal = totalWinner + totalRuns;
    const standardPct = totalScore > 0 ? Math.round((standardTotal / totalScore) * 100) : 0;
    const sidePct = totalScore > 0 ? Math.round((totalSideBet / totalScore) * 100) : 0;
    const playerPct = totalScore > 0 ? Math.round((totalPlayerPick / totalScore) * 100) : 0;
    const runnerPct = totalScore > 0 ? Math.round((totalRunner / totalScore) * 100) : 0;

    return {
      totalScore,
      categories: [
        { label: "Winner Picks", points: totalWinner, color: "bg-blue-500" },
        { label: "Total Runs", points: totalRuns, color: "bg-emerald-500" },
        { label: "Player Picks", points: totalPlayerPick, color: "bg-purple-500" },
        { label: "Side Bets", points: totalSideBet, color: "bg-amber-500" },
        { label: "Runner Bonus", points: totalRunner, color: "bg-pink-500" },
      ],
      split: {
        standard: { points: standardTotal, pct: standardPct },
        side: { points: totalSideBet, pct: sidePct },
        player: { points: totalPlayerPick, pct: playerPct },
        runner: { points: totalRunner, pct: runnerPct },
      },
      byMatch: byMatch.sort((a, b) => b.score - a.score),
    };
  }, [scoredBets, matches, hasData]);

  if (!hasData) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-200 mb-1">Breakdowns</h2>
          <p className="text-gray-500 text-sm">See how your points are distributed across bet types.</p>
        </div>
        <div className="card text-center py-16 bg-gray-900/30">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg mb-2">No scored bets yet</p>
          <p className="text-gray-600 text-sm">Breakdowns will appear once your bets are scored.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-1">Breakdowns</h2>
        <p className="text-gray-500 text-sm">See how your points are distributed across bet types.</p>
      </div>

      <div className="space-y-6">
        {/* Points by Category */}
        <div className="card">
          <h3 className="font-semibold text-gray-200 mb-4">Points by Category</h3>
          <div className="space-y-3">
            {breakdown.categories.map((cat) => {
              const pct = breakdown.totalScore > 0 ? Math.round((cat.points / breakdown.totalScore) * 100) : 0;
              return (
                <div key={cat.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">{cat.label}</span>
                    <span className="text-gray-200 font-medium">{cat.points} pts <span className="text-gray-600">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between">
            <span className="text-gray-500 text-sm">Total</span>
            <span className="text-gray-100 font-bold">{breakdown.totalScore} pts</span>
          </div>
        </div>

        {/* Standard vs Side vs Player */}
        <div className="card">
          <h3 className="font-semibold text-gray-200 mb-4">Standard vs Side Bets</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{breakdown.split.standard.pct}%</p>
              <p className="text-xs text-gray-500 mt-1">Standard Bets</p>
              <p className="text-sm text-gray-400">{breakdown.split.standard.points} pts</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{breakdown.split.side.pct}%</p>
              <p className="text-xs text-gray-500 mt-1">Side Bets</p>
              <p className="text-sm text-gray-400">{breakdown.split.side.points} pts</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{breakdown.split.player.pct}%</p>
              <p className="text-xs text-gray-500 mt-1">Player Picks</p>
              <p className="text-sm text-gray-400">{breakdown.split.player.points} pts</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-pink-400">{breakdown.split.runner.pct}%</p>
              <p className="text-xs text-gray-500 mt-1">Runner Bonus</p>
              <p className="text-sm text-gray-400">{breakdown.split.runner.points} pts</p>
            </div>
          </div>
        </div>

        {/* Points by Match */}
        <div className="card">
          <h3 className="font-semibold text-gray-200 mb-4">Points by Match</h3>
          <div className="space-y-2">
            {breakdown.byMatch.map((m, i) => {
              const pct = breakdown.totalScore > 0 ? Math.round((m.score / breakdown.totalScore) * 100) : 0;
              return (
                <div key={m.matchId} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
                  <span className="text-gray-600 text-xs w-6 text-right">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{m.label}</p>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-semibold whitespace-nowrap ${m.score > 0 ? "text-emerald-400" : "text-gray-500"}`}>
                    {m.score > 0 ? "+" : ""}{m.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ betHistory, loading }) {
  // Compute metrics from bet history
  const matchesPlayed = new Set(betHistory.map((b) => b.match_id)).size;
  const betsSubmitted = betHistory.length;
  const pendingCount = betHistory.filter((b) => b.score === null || b.score === undefined).length;
  const scoredCount = betHistory.filter((b) => b.score !== null && b.score !== undefined).length;

  // Total score across all scored bets
  const totalScore = betHistory.reduce((sum, b) => sum + (b.score || 0), 0);

  // Last activity: most recent submitted_at
  const lastActivity = betHistory.length > 0 && betHistory[0].submitted_at
    ? new Date(betHistory[0].submitted_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Loading state
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading stats...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (betHistory.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card text-center py-16 bg-gray-900/30">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg mb-2">No betting activity yet</p>
          <p className="text-gray-600 text-sm mb-6">Place bets on matches to see your stats here.</p>
          <Link to="/play" className="btn-primary px-6 py-2">
            Start Playing
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <Link
            to="/leaderboard"
            className="card hover:border-brand-600 transition-colors text-center py-4"
          >
            <p className="text-brand-400 font-medium">View Leaderboard</p>
            <p className="text-gray-600 text-xs mt-1">See where you rank</p>
          </Link>
          <Link
            to="/play"
            className="card hover:border-brand-600 transition-colors text-center py-4"
          >
            <p className="text-brand-400 font-medium">Browse Matches</p>
            <p className="text-gray-600 text-xs mt-1">Find upcoming games</p>
          </Link>
        </div>
      </div>
    );
  }

  // Stats with data
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-1">Overview</h2>
        <p className="text-gray-500 text-sm">Your betting activity at a glance.</p>
      </div>

      {/* Total Score Highlight */}
      {scoredCount > 0 && (
        <div className="card mb-6 bg-gradient-to-r from-brand-950/50 to-cyan-950/30 border-brand-800/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Score</p>
              <p className={`text-3xl font-bold ${totalScore >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {totalScore > 0 ? "+" : ""}{totalScore} pts
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Avg per match</p>
              <p className="text-xl font-semibold text-gray-200">
                {scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0} pts
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          label="Matches Played"
          value={matchesPlayed}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          label="Bets Submitted"
          value={betsSubmitted}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Pending Scoring"
          value={pendingCount}
          valueColor="text-amber-400"
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Scored Bets"
          value={scoredCount}
          valueColor="text-emerald-400"
        />
      </div>

      {/* Last Activity */}
      {lastActivity && (
        <div className="card bg-gray-900/50 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-gray-500 text-sm">Last Activity</p>
              <p className="font-medium text-gray-200">{lastActivity}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/leaderboard"
          className="card hover:border-brand-600 transition-colors text-center py-4"
        >
          <p className="text-brand-400 font-medium">View Leaderboard</p>
          <p className="text-gray-600 text-xs mt-1">See where you rank</p>
        </Link>
        <Link
          to="/play"
          className="card hover:border-brand-600 transition-colors text-center py-4"
        >
          <p className="text-brand-400 font-medium">Browse Matches</p>
          <p className="text-gray-600 text-xs mt-1">Find upcoming games</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, valueColor = "text-gray-100" }) {
  return (
    <div className="card bg-gray-900/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-gray-500 text-sm">{label}</p>
          <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "scored", label: "Scored" },
  { key: "pending", label: "Pending" },
];

const STATUS_BADGE_STYLES = {
  UPCOMING: "bg-blue-900/50 text-blue-400 border-blue-800",
  LIVE: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
  COMPLETED: "bg-gray-800/80 text-gray-400 border-gray-700",
  ABANDONED: "bg-red-900/50 text-red-400 border-red-800",
  NO_RESULT: "bg-gray-800/80 text-gray-400 border-gray-700",
};

function BetHistoryTab({ betHistory, matches, loading, historyFilter, setHistoryFilter }) {
  // Filter bets based on selected filter
  const filteredBets = betHistory.filter((bet) => {
    if (historyFilter === "all") return true;
    if (historyFilter === "scored") return bet.score !== null && bet.score !== undefined;
    if (historyFilter === "pending") return bet.score === null || bet.score === undefined;
    return true;
  });

  // Count for filter badges
  const scoredCount = betHistory.filter((b) => b.score !== null && b.score !== undefined).length;
  const pendingCount = betHistory.filter((b) => b.score === null || b.score === undefined).length;

  const getFilterCount = (key) => {
    if (key === "all") return betHistory.length;
    if (key === "scored") return scoredCount;
    if (key === "pending") return pendingCount;
    return 0;
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-1">Bet History</h2>
        <p className="text-gray-500 text-sm">Review your bets by match and see what scored.</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading bet history...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && betHistory.length === 0 && (
        <div className="card text-center py-16 bg-gray-900/30">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg mb-2">You haven't placed any match bets yet</p>
          <p className="text-gray-600 text-sm mb-6">Place bets on matches to see your history here.</p>
          <Link to="/play" className="btn-primary px-6 py-2">
            Start Playing
          </Link>
        </div>
      )}

      {/* Filter Chips + Bet History List */}
      {!loading && betHistory.length > 0 && (
        <>
          {/* Filter Chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {FILTER_OPTIONS.map((opt) => {
              const count = getFilterCount(opt.key);
              const isActive = historyFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setHistoryFilter(opt.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-600/30 text-brand-300 border border-brand-600"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-gray-300"
                  }`}
                >
                  {opt.label}
                  {count > 0 && (
                    <span className={`ml-1.5 text-xs ${isActive ? "text-brand-400" : "text-gray-500"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filtered List */}
          {filteredBets.length > 0 ? (
            <div className="space-y-4">
              {filteredBets.map((bet, index) => (
                <BetHistoryCard key={bet.match_id} bet={bet} matches={matches} index={index} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-8 bg-gray-900/30">
              <p className="text-gray-500 text-sm">
                No {historyFilter === "scored" ? "scored" : "pending"} bets found.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Extract readable bet details from Supabase bet data.
 * Answers JSONB has keys like "q_wc_m1_winner" and "q_wc_m1_total_runs".
 */
function extractBetDetails(bet, match) {
  const details = [];
  const answers = bet.answers || {};

  // Extract winner pick from answers
  const winnerKey = Object.keys(answers).find((k) => k.includes("winner"));
  if (winnerKey) {
    let displayValue = answers[winnerKey];
    // Convert V1 option IDs (e.g. "opt_wc_m13_winner_teamA") to team codes
    const optMatch = displayValue.match(/^opt_[^_]+_[^_]+_winner_(.+)$/);
    if (optMatch) {
      if (optMatch[1] === "teamA" && match?.teamA) displayValue = match.teamA;
      else if (optMatch[1] === "teamB" && match?.teamB) displayValue = match.teamB;
      else if (optMatch[1] === "super_over") displayValue = "Super Over";
    }
    details.push({ label: "Winner Pick", value: displayValue });
  }

  // Extract total runs from answers
  const runsKey = Object.keys(answers).find((k) => k.includes("total_runs"));
  if (runsKey) {
    details.push({ label: "Total Runs", value: answers[runsKey] });
  }

  // Player picks
  if (bet.player_picks && bet.player_picks.length > 0) {
    bet.player_picks.forEach((pp) => {
      details.push({
        label: `Player Pick (Slot ${pp.slot || "?"})`,
        value: pp.player_name || pp.player_id,
      });
    });
  }

  // Side bet answers
  if (bet.side_bet_answers && Object.keys(bet.side_bet_answers).length > 0) {
    Object.entries(bet.side_bet_answers).forEach(([, answer]) => {
      details.push({ label: "Side Bet", value: String(answer) });
    });
  }

  // Runner picks
  if (bet.runner_picks && bet.runner_picks.length > 0) {
    bet.runner_picks.forEach((rp) => {
      details.push({ label: "Runner", value: rp.display_name || rp.user_id });
    });
  }

  return details;
}

function BetHistoryCard({ bet, matches, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { score, submitted_at } = bet;

  // Find match info
  const match = matches.find((m) => m.matchId === bet.match_id);
  const matchTitle = match
    ? `${match.teamA} vs ${match.teamB}`
    : bet.match_id;
  const matchDate = match?.scheduledTime
    ? formatMatchDate(match.scheduledTime)
    : "";
  const matchStatus = match?.status || "UPCOMING";
  const statusLabel = matchStatus.charAt(0) + matchStatus.slice(1).toLowerCase();

  const isScored = score !== null && score !== undefined;
  const betDetails = extractBetDetails(bet, match);

  // Score badge display
  const renderScoreBadge = () => {
    if (!isScored) {
      return <span className="text-sm text-gray-500 bg-gray-800/50 px-2 py-1 rounded">Pending</span>;
    }
    const colorClass = score > 0 ? "text-emerald-400" : score < 0 ? "text-red-400" : "text-gray-400";
    const prefix = score > 0 ? "+" : "";
    return (
      <span className={`text-lg font-bold ${colorClass}`}>
        {prefix}{score} pts
      </span>
    );
  };

  return (
    <div
      className="card animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Match Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-100">{matchTitle}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE_STYLES[matchStatus] || STATUS_BADGE_STYLES.UPCOMING}`}>
              {matchStatus === "LIVE" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1 align-middle" />
              )}
              {statusLabel}
            </span>
          </div>
          {matchDate && (
            <p className="text-gray-500 text-sm mt-0.5">{matchDate}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {renderScoreBadge()}
        </div>
      </div>

      {/* Point breakdown (for scored bets) — only show categories the user actually bet on */}
      {isScored && (() => {
        const answers = bet.answers || {};
        const hasWinner = Object.keys(answers).some(k => k.includes("winner"));
        const hasRuns = Object.keys(answers).some(k => k.includes("total_runs"));
        const hasPlayers = bet.player_picks && bet.player_picks.length > 0;
        const hasSideBet = bet.side_bet_answers && Object.keys(bet.side_bet_answers).length > 0;
        const hasRunner = bet.runner_picks && bet.runner_picks.length > 0;
        const pointBadge = (show, pts, label, colors) => {
          if (!show || pts == null) return null;
          const style = pts > 0 ? colors[0] : pts < 0 ? colors[1] : "bg-gray-800/60 text-gray-500";
          return <span key={label} className={`text-xs px-2 py-0.5 rounded ${style}`}>{label} {pts > 0 ? "+" : ""}{pts}</span>;
        };
        return (
          <div className="mt-3 flex flex-wrap gap-2">
            {pointBadge(hasWinner, bet.winner_points, "Winner", ["bg-blue-900/40 text-blue-400", "bg-red-900/40 text-red-400"])}
            {pointBadge(hasRuns, bet.total_runs_points, "Runs", ["bg-emerald-900/40 text-emerald-400", "bg-red-900/40 text-red-400"])}
            {pointBadge(hasPlayers, bet.player_pick_points, "Players", ["bg-purple-900/40 text-purple-400", "bg-red-900/40 text-red-400"])}
            {pointBadge(hasSideBet, bet.side_bet_points, "Side Bet", ["bg-amber-900/40 text-amber-400", "bg-red-900/40 text-red-400"])}
            {pointBadge(hasRunner, bet.runner_points, "Runner", ["bg-pink-900/40 text-pink-400", "bg-red-900/40 text-red-400"])}
          </div>
        );
      })()}

      {/* Expand/Collapse Toggle */}
      {betDetails.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-300 flex items-center justify-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Hide details</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              <span>Show details ({betDetails.length})</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}

      {/* Details List (collapsible) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-800/50 space-y-2">
          {betDetails.map((detail, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-4 py-2 border-b border-gray-800/50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400">{detail.label}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-gray-200">{detail.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between">
        <p className="text-xs text-gray-600">
          {submitted_at && (
            <>Submitted {new Date(submitted_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</>
          )}
        </p>
        <Link
          to={`/match/${bet.match_id}`}
          className="text-xs text-brand-400 hover:text-brand-300"
        >
          View Match &rarr;
        </Link>
      </div>
    </div>
  );
}
