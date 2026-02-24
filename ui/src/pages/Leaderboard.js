import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetLeaderboard, apiGetMatches } from "../api";
import { CURRENT_TOURNAMENT } from "../config/tournament";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { useToast } from "../components/Toast";
import { SkeletonCard } from "../components/Spinner";
import Tabs, { useTabsWithUrl, useUrlSync } from "../components/Tabs";
import { formatMatchDate, formatMatchTime, isToday } from "../utils/date";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import BetViewModal from "../components/BetViewModal";

const RANK_STYLE = {
  1: { badge: "bg-gradient-to-br from-yellow-400 to-amber-600 text-gray-900", ring: "ring-2 ring-yellow-500/40", label: "\u{1F947}" },
  2: { badge: "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900", ring: "ring-2 ring-gray-400/30", label: "\u{1F948}" },
  3: { badge: "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100", ring: "ring-2 ring-amber-600/30", label: "\u{1F949}" },
};

const MAIN_TABS = [
  { key: "overall", label: "Overall" },
  { key: "today", label: "Today" },
  { key: "match", label: "By Match" },
];

const VALID_TABS = MAIN_TABS.map((t) => t.key);

export default function Leaderboard() {
  const { user } = useAuth();
  const identity = resolveIdentity(user);
  const toast = useToast();
  const navigate = useNavigate();

  // URL-synced tab state
  useUrlSync();
  const [activeTab, setActiveTab] = useTabsWithUrl("tab", VALID_TABS, "overall");

  // Data states
  const [data, setData] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastScoredMatch, setLastScoredMatch] = useState(null);

  // Load matches for "By Match" and "Today" tabs
  useEffect(() => {
    apiGetMatches()
      .then((m) => {
        const sorted = [...m].sort((a, b) =>
          new Date(a.scheduledTime) - new Date(b.scheduledTime)
        );
        setMatches(sorted);

        // Find the last scored match (COMPLETED = SCORED in DB)
        const scored = sorted.filter((match) => match.status === "COMPLETED");
        if (scored.length > 0) {
          setLastScoredMatch(scored[scored.length - 1]);
        }
      })
      .catch(() => {});
  }, []);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  // Load leaderboard data for Overall tab
  const loadLeaderboard = useCallback((pageNum = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    apiGetLeaderboard("global", null, { page: pageNum, pageSize: PAGE_SIZE })
      .then((result) => {
        if (append) {
          setData(prev => [...prev, ...result.data]);
        } else {
          setData(result.data);
        }
        setTotalCount(result.total);
        setPage(pageNum);
      })
      .catch((err) => {
        toast.error(err.message);
        if (!append) setData([]);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [toast]);

  useEffect(() => {
    if (activeTab !== "overall") return;
    loadLeaderboard();
  }, [activeTab, loadLeaderboard]);

  // Subscribe to realtime leaderboard updates (debounced to avoid hammering during scoring)
  const realtimeTimerRef = useRef(null);
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || activeTab !== "overall") return;

    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard'
        },
        () => {
          // Debounce: wait 2s after last change before refreshing
          // (scoring updates every user row in sequence)
          clearTimeout(realtimeTimerRef.current);
          realtimeTimerRef.current = setTimeout(() => loadLeaderboard(), 2000);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(realtimeTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [activeTab, loadLeaderboard]);

  // Reset loading for other tabs
  useEffect(() => {
    if (activeTab !== "overall") {
      setLoading(false);
    }
  }, [activeTab]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((e) =>
      e.displayName?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // Get today's matches
  const todayMatches = useMemo(() => {
    return matches.filter((m) => isToday(m.scheduledTime));
  }, [matches]);

  // Get selected match details
  const selectedMatchDetails = useMemo(() => {
    if (!selectedMatch) return null;
    return matches.find((m) => m.matchId === selectedMatch);
  }, [matches, selectedMatch]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            Leaderboard
          </span>
        </h1>
        <p className="text-gray-500">
          {lastScoredMatch
            ? <>Scores updated through <span className="text-gray-400 font-medium">{lastScoredMatch.teamA} vs {lastScoredMatch.teamB}</span> (Match {lastScoredMatch.matchId?.replace(CURRENT_TOURNAMENT.matchIdPrefix, "")})</>
            : "Overall tournament standings"}
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs tabs={MAIN_TABS} activeKey={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Overall Tab */}
      {activeTab === "overall" && (
        <div className="animate-fade-in">
          {/* Search Input */}
          {!loading && data.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by player name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input w-full pl-10 text-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="card text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg mb-2">No leaderboard data yet.</p>
              <p className="text-gray-600 text-sm">Start making predictions to see scores here.</p>
            </div>
          )}

          {!loading && filteredData.length === 0 && data.length > 0 && (
            <div className="card text-center py-8">
              <p className="text-gray-400">No players match "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-blue-400 hover:text-blue-300 text-sm mt-2"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Top 3 Podium */}
          {!loading && filteredData.length >= 3 && !searchQuery && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
              {[filteredData[1], filteredData[0], filteredData[2]].map((e, i) => {
                const rank = [2, 1, 3][i];
                const style = RANK_STYLE[rank];
                const isFirst = rank === 1;
                const isCurrentUser = e.userId === identity.userId;
                return (
                  <div
                    key={e.userId}
                    className={`card text-center animate-slide-up px-2 sm:px-4 ${style.ring} ${isFirst ? "sm:-mt-4" : ""} ${isCurrentUser ? "border-blue-500/50" : ""}`}
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    <div className="text-xl sm:text-3xl mb-2">{style.label}</div>
                    <div className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-bold mb-2 ${style.badge}`}>#{rank}</div>
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className={`font-bold truncate ${isFirst ? "text-sm sm:text-lg text-yellow-300" : "text-xs sm:text-sm text-gray-200"}`}>{e.displayName}</h3>
                      {isCurrentUser && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded">You</span>
                      )}
                    </div>
                    <p className={`font-extrabold mt-1 ${isFirst ? "text-2xl sm:text-3xl text-yellow-400" : "text-lg sm:text-xl text-gray-300"}`}>{e.totalScore ?? e.score}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">points</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          {!loading && filteredData.length > 0 && (
            <LeaderboardTable data={filteredData} currentUserId={identity.userId} />
          )}

          {/* Load More */}
          {!loading && !searchQuery && data.length < totalCount && (
            <div className="text-center mt-6">
              <button
                onClick={() => loadLeaderboard(page + 1, true)}
                disabled={loadingMore}
                className="btn-secondary text-sm px-6"
              >
                {loadingMore ? "Loading..." : `Load More (${data.length} of ${totalCount})`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Today Tab */}
      {activeTab === "today" && (
        <div className="animate-fade-in">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-100 mb-1">Today</h2>
            <p className="text-gray-500 text-sm">Today's matches and scores.</p>
          </div>

          {todayMatches.length === 0 ? (
            <div className="card text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg mb-2">No matches today.</p>
              <p className="text-gray-600 text-sm">Check Upcoming in Play.</p>
              <button
                onClick={() => navigate("/play")}
                className="btn-secondary text-sm mt-4"
              >
                Go to Play
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayMatches.map((match) => (
                <button
                  key={match.matchId}
                  onClick={() => navigate(`/match/${match.matchId}`)}
                  className="card w-full text-left hover:border-brand-600 hover:shadow-lg hover:shadow-brand-900/20 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-100">{match.teamA}</span>
                        <span className="text-gray-500 text-sm">vs</span>
                        <span className="font-semibold text-gray-100">{match.teamB}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{formatMatchTime(match.scheduledTime)}</span>
                        {match.venue && (
                          <>
                            <span className="text-gray-700">|</span>
                            <span className="truncate">{match.venue}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {match.status === "LIVE" && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-600 text-white rounded animate-pulse">LIVE</span>
                      )}
                      <svg
                        className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* By Match Tab */}
      {activeTab === "match" && (
        <div className="animate-fade-in">
          <div className="card mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Select a Match</label>
            <select
              value={selectedMatch}
              onChange={(e) => setSelectedMatch(e.target.value)}
              className="input text-sm w-full"
              disabled={matches.length === 0}
            >
              <option value="">
                {matches.length === 0 ? "No matches in schedule" : "Choose a match..."}
              </option>
              {matches.map((m) => (
                <option key={m.matchId} value={m.matchId}>
                  {m.teamA} vs {m.teamB} — {formatMatchDate(m.scheduledTime)}
                </option>
              ))}
            </select>
          </div>

          {selectedMatchDetails ? (
            <div className="space-y-4">
              {/* Match Summary Card */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-gray-100">{selectedMatchDetails.teamA}</span>
                      <span className="text-gray-500">vs</span>
                      <span className="font-bold text-lg text-gray-100">{selectedMatchDetails.teamB}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                      <span>{formatMatchDate(selectedMatchDetails.scheduledTime)} at {formatMatchTime(selectedMatchDetails.scheduledTime)}</span>
                      {selectedMatchDetails.venue && (
                        <>
                          <span className="text-gray-700">|</span>
                          <span>{selectedMatchDetails.venue}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      selectedMatchDetails.status === "LIVE" ? "bg-red-600 text-white" :
                      selectedMatchDetails.status === "COMPLETED" ? "bg-green-600/20 text-green-400" :
                      selectedMatchDetails.status === "UPCOMING" ? "bg-blue-600/20 text-blue-400" :
                      "bg-gray-600/20 text-gray-400"
                    }`}>
                      {selectedMatchDetails.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/match/${selectedMatchDetails.matchId}`)}
                  className="btn-primary w-full text-sm"
                >
                  Open Match Bets
                </button>
              </div>

              {/* Match Leaderboard */}
              <MatchLeaderboard matchId={selectedMatch} />
            </div>
          ) : (
            <div className="card text-center py-8 bg-gray-900/30">
              <p className="text-gray-500 text-sm">
                Select a match above to view details and place bets.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Select a match to see who scored the most.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchLeaderboard({ matchId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchStatus, setMatchStatus] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  useEffect(() => {
    if (!matchId || !isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        // Fetch match config status + bets in parallel
        const [configRes, betsRes] = await Promise.all([
          supabase.from('match_config').select('status').eq('match_id', matchId).maybeSingle(),
          supabase.from('bets')
            .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points')
            .eq('match_id', matchId)
            .order('score', { ascending: false }),
        ]);

        if (configRes.data) {
          setMatchStatus(configRes.data.status);
        }

        const bets = betsRes.data;
        if (betsRes.error) throw betsRes.error;
        if (!bets || bets.length === 0) { setEntries([]); return; }

        // Get display names from leaderboard table
        const userIds = bets.map(b => b.user_id);
        const { data: profiles } = await supabase
          .from('leaderboard')
          .select('user_id, display_name')
          .eq('event_id', CURRENT_TOURNAMENT.id)
          .in('user_id', userIds);

        const nameMap = {};
        (profiles || []).forEach(p => { nameMap[p.user_id] = p.display_name; });

        setEntries(bets.map((b, i) => ({
          rank: i + 1,
          userId: b.user_id,
          displayName: nameMap[b.user_id] || b.user_id.slice(0, 8) + '...',
          score: b.score || 0,
          winnerPts: b.winner_points || 0,
          totalRunsPts: b.total_runs_points || 0,
          playerPickPts: b.player_pick_points || 0,
          sideBetPts: b.side_bet_points || 0,
          runnerPts: b.runner_points || 0,
        })));
      } catch (err) {
        console.warn('[Leaderboard] Error fetching match scores:', err);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [matchId]);

  const canViewBets = matchStatus === 'LOCKED' || matchStatus === 'SCORED';

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="card text-center py-8 bg-gray-900/30">
        <p className="text-gray-500 text-sm">No scored bets for this match yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Player</th>
              <th className="text-right px-4 py-3">Score</th>
              {canViewBets && <th className="text-right px-3 py-3 w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const style = RANK_STYLE[e.rank];
              return (
                <tr key={e.userId} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20">
                  <td className="px-4 py-3">
                    {style ? (
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${style.badge}`}>{e.rank}</span>
                    ) : (
                      <span className="text-gray-500 text-sm pl-1.5">{e.rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-200">{e.displayName}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold text-lg ${e.rank <= 3 ? "text-amber-400" : "text-gray-300"}`}>{e.score}</span>
                  </td>
                  {canViewBets && (
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => setViewingUser(e)}
                        className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-colors"
                        title={`View ${e.displayName}'s bet`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewingUser && (
        <BetViewModal
          open={!!viewingUser}
          onClose={() => setViewingUser(null)}
          matchId={matchId}
          userId={viewingUser.userId}
          userName={viewingUser.displayName}
        />
      )}
    </>
  );
}

function LeaderboardTable({ data, currentUserId }) {
  return (
    <div className="card p-0 overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-gray-900">
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-3 sm:px-5 py-3">Rank</th>
              <th className="text-left px-3 sm:px-5 py-3">Player</th>
              <th className="text-center px-3 py-3 hidden sm:table-cell">Matches</th>
              <th className="text-right px-3 sm:px-5 py-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {data.map((e, i) => {
              const rank = e.rank ?? i + 1;
              const style = RANK_STYLE[rank];
              const isCurrentUser = e.userId === currentUserId;
              // Calculate rank change (positive = moved up)
              const hasPrevRank = e.previous_rank && e.previous_rank > 0;
              const rankChange = hasPrevRank ? e.previous_rank - rank : 0;
              const isNew = !hasPrevRank && (e.matches_played ?? e.matchesPlayed ?? 0) <= 1;
              return (
                <tr
                  key={e.userId}
                  className={`border-b border-gray-800/50 last:border-0 ${
                    isCurrentUser
                      ? "bg-blue-900/20 hover:bg-blue-900/30"
                      : rank <= 3
                      ? "bg-gray-800/30"
                      : "hover:bg-gray-800/20"
                  }`}
                >
                  <td className="px-3 sm:px-5 py-3.5">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {style ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${style.badge}`}>{rank}</span>
                      ) : (
                        <span className="text-gray-500 font-medium text-sm pl-1.5">{rank}</span>
                      )}
                      {/* Rank change indicator */}
                      {rankChange > 0 && (
                        <span className="text-xs text-green-400 flex items-center">
                          <span className="mr-0.5">▲</span>{rankChange}
                        </span>
                      )}
                      {rankChange < 0 && (
                        <span className="text-xs text-red-400 flex items-center">
                          <span className="mr-0.5">▼</span>{Math.abs(rankChange)}
                        </span>
                      )}
                      {rankChange === 0 && hasPrevRank && (
                        <span className="text-xs text-gray-500 flex items-center">&lt;&gt;</span>
                      )}
                      {isNew && (
                        <span className="px-1 py-0.5 text-[9px] font-semibold bg-purple-600/50 text-purple-300 rounded">NEW</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold truncate ${isCurrentUser ? "text-blue-300" : rank <= 3 ? "text-gray-100" : "text-gray-300"}`}>
                        {e.displayName}
                      </span>
                      {isCurrentUser && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded shrink-0">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center hidden sm:table-cell">
                    <span className="text-xs text-gray-500">{e.matches_played ?? e.matchesPlayed ?? 0}</span>
                  </td>
                  <td className="px-3 sm:px-5 py-3.5 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-bold text-lg ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-amber-500" : "text-gray-400"}`}>
                        {e.totalScore ?? e.total_score ?? e.score}
                      </span>
                      {e.last_match_score !== undefined && e.last_match_score !== null && e.last_match_score !== 0 && (
                        <span className="text-[10px] text-gray-500">
                          Last: {e.last_match_score > 0 ? '+' : ''}{e.last_match_score}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
