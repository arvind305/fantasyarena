import React, { useState, useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useToast } from "../../components/Toast";
import Spinner from "../../components/Spinner";
import AdminNav from "../../components/admin/AdminNav";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { CURRENT_TOURNAMENT } from "../../config/tournament";

export default function AdminDashboardV2() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [configs, setConfigs] = useState({});
  const [results, setResults] = useState({});
  const [betsCount, setBetsCount] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(CURRENT_TOURNAMENT.dataFile);
        const tournament = await res.json();
        setMatches(tournament?.matches || []);

        if (supabase && isSupabaseConfigured()) {
          const [cfgRes, resRes, betsRes] = await Promise.all([
            supabase.from("match_config").select("match_id, status"),
            supabase.from("match_results").select("match_id, winner"),
            supabase.from("bets").select("match_id").not("score", "is", null),
          ]);

          if (cfgRes.data) {
            const map = {};
            cfgRes.data.forEach((c) => { map[c.match_id] = c; });
            setConfigs(map);
          }
          if (resRes.data) {
            const map = {};
            resRes.data.forEach((r) => { map[r.match_id] = r; });
            setResults(map);
          }
          if (betsRes.data) {
            const map = {};
            betsRes.data.forEach((b) => { map[b.match_id] = (map[b.match_id] || 0) + 1; });
            setBetsCount(map);
          }
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const configuredCount = Object.values(configs).filter(c => c.status !== "DRAFT").length;
    const resultsCount = Object.keys(results).length;
    const scoredCount = Object.values(configs).filter(c => c.status === "SCORED").length;
    const now = new Date();
    const upcoming = matches.filter(m => new Date(`${m.date}T${m.time_gmt}:00Z`) > now);

    return {
      total: matches.length,
      configured: configuredCount,
      results: resultsCount,
      scored: scoredCount,
      upcoming: upcoming.length,
      needAttention: upcoming.filter(m => !configs[String(m.match_id)] || configs[String(m.match_id)]?.status === "DRAFT").length,
    };
  }, [matches, configs, results]);

  // Next 5 upcoming matches that need attention
  const upcomingMatches = useMemo(() => {
    const now = new Date();
    return matches
      .filter(m => new Date(`${m.date}T${m.time_gmt}:00Z`) > now)
      .sort((a, b) => new Date(`${a.date}T${a.time_gmt}:00Z`) - new Date(`${b.date}T${b.time_gmt}:00Z`))
      .slice(0, 5);
  }, [matches]);

  // Recent past matches that may need scoring
  const recentPast = useMemo(() => {
    const now = new Date();
    return matches
      .filter(m => {
        const t = new Date(`${m.date}T${m.time_gmt}:00Z`);
        return t <= now && t > new Date(now - 7 * 86400000);
      })
      .sort((a, b) => new Date(`${b.date}T${b.time_gmt}:00Z`) - new Date(`${a.date}T${a.time_gmt}:00Z`))
      .slice(0, 5);
  }, [matches]);

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="card text-center py-12"><p className="text-red-400">Access Denied</p></div></div>;

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <AdminNav />
      <h1 className="text-2xl font-bold text-gray-200 mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-gray-200">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Matches</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-green-400">{stats.configured}</div>
          <div className="text-sm text-gray-500">Configured</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-blue-400">{stats.results}</div>
          <div className="text-sm text-gray-500">Results Entered</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-purple-400">{stats.scored}</div>
          <div className="text-sm text-gray-500">Scored</div>
        </div>
      </div>

      {/* Need Attention */}
      {stats.needAttention > 0 && (
        <div className="card mb-6 bg-amber-950/20 border-amber-800/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-amber-400 font-medium">{stats.needAttention} upcoming match(es) need configuration</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Matches */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Upcoming Matches</h2>
            <Link to="/admin/matches" className="text-sm text-brand-400 hover:text-brand-300">View All</Link>
          </div>
          <div className="space-y-2">
            {upcomingMatches.map((m) => {
              const mid = String(m.match_id);
              const cfg = configs[mid];
              const status = cfg?.status || "DRAFT";
              return (
                <Link key={mid} to={`/admin/match/${mid}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    status === "OPEN" ? "bg-green-500" : status === "DRAFT" ? "bg-yellow-500" : "bg-gray-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-200">{m.teams[0]} vs {m.teams[1]}</span>
                    <div className="text-xs text-gray-500">
                      {new Date(`${m.date}T${m.time_gmt}:00Z`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    status === "OPEN" ? "bg-green-900/50 text-green-300" : "bg-gray-800 text-gray-400"
                  }`}>{status}</span>
                </Link>
              );
            })}
            {upcomingMatches.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No upcoming matches</p>}
          </div>
        </div>

        {/* Recent Past (may need scoring) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Recent (May Need Scoring)</h2>
          </div>
          <div className="space-y-2">
            {recentPast.map((m) => {
              const mid = String(m.match_id);
              const hasResults = !!results[mid];
              const status = configs[mid]?.status || "DRAFT";
              const scoredBetsCount = betsCount[mid] || 0;
              return (
                <Link key={mid} to={`/admin/score/${mid}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    status === "SCORED" ? "bg-purple-500" : hasResults ? "bg-blue-500" : "bg-red-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-200">{m.teams[0]} vs {m.teams[1]}</span>
                    <div className="text-xs text-gray-500">
                      {hasResults ? `Results entered` : "No results yet"}
                      {scoredBetsCount > 0 && ` - ${scoredBetsCount} bets scored`}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    status === "SCORED" ? "bg-purple-900/50 text-purple-300" :
                    hasResults ? "bg-blue-900/50 text-blue-300" :
                    "bg-red-900/50 text-red-300"
                  }`}>{status === "SCORED" ? "Scored" : hasResults ? "Results" : "Pending"}</span>
                </Link>
              );
            })}
            {recentPast.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No recent matches</p>}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/matches" className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors">All Matches</Link>
          <Link to="/admin/long-term" className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">Long-Term Config</Link>
          <Link to="/leaderboard" className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors">Leaderboard</Link>
        </div>
      </div>
    </div>
  );
}
