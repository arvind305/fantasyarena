import React, { useState, useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useToast } from "../../components/Toast";
import Spinner from "../../components/Spinner";
import AdminNav from "../../components/admin/AdminNav";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { CURRENT_TOURNAMENT } from "../../config/tournament";

export default function MatchList() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [configs, setConfigs] = useState({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        // Load tournament data
        const res = await fetch(CURRENT_TOURNAMENT.dataFile);
        const tournament = await res.json();
        setMatches(tournament?.matches || []);

        // Load match configs from Supabase
        if (supabase && isSupabaseConfigured()) {
          const { data } = await supabase.from("match_config").select("match_id, status, team_a, team_b, lock_time");
          if (data) {
            const map = {};
            data.forEach((c) => { map[c.match_id] = c; });
            setConfigs(map);
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

  const filteredMatches = useMemo(() => {
    const now = new Date();
    let filtered = [...matches];
    if (filter === "upcoming") filtered = filtered.filter((m) => new Date(`${m.date}T${m.time_gmt}:00Z`) > now);
    else if (filter === "past") filtered = filtered.filter((m) => new Date(`${m.date}T${m.time_gmt}:00Z`) <= now);
    filtered.sort((a, b) => new Date(`${a.date}T${a.time_gmt}:00Z`) - new Date(`${b.date}T${b.time_gmt}:00Z`));
    return filtered;
  }, [matches, filter]);

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="card text-center py-12"><p className="text-red-400">Access Denied</p></div></div>;

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;

  const statusColors = {
    DRAFT: "bg-yellow-500",
    OPEN: "bg-green-500",
    LOCKED: "bg-orange-500",
    SCORED: "bg-purple-500",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <AdminNav />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-200">All Matches</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
        >
          <option value="all">All ({matches.length})</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
      </div>

      <div className="space-y-2">
        {filteredMatches.map((match) => {
          const matchId = String(match.match_id);
          const cfg = configs[matchId];
          const status = cfg?.status || "DRAFT";
          const scheduledTime = new Date(`${match.date}T${match.time_gmt}:00Z`);
          const isPast = scheduledTime <= new Date();

          return (
            <div
              key={matchId}
              className={`card flex items-center gap-4 p-4 ${isPast ? "opacity-60" : ""}`}
            >
              <Link
                to={`/admin/match/${matchId}`}
                className="flex items-center gap-4 flex-1 min-w-0 hover:bg-gray-800/50 transition-colors -m-4 p-4 rounded-xl"
              >
                <span className={`w-3 h-3 rounded-full shrink-0 ${statusColors[status] || "bg-gray-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-200">{match.teams[0]} vs {match.teams[1]}</span>
                    <span className="text-xs text-gray-600">#{matchId}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {scheduledTime.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" - "}{match.venue}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  status === "SCORED" ? "bg-purple-900/50 text-purple-300" :
                  status === "LOCKED" ? "bg-orange-900/50 text-orange-300" :
                  status === "OPEN" ? "bg-green-900/50 text-green-300" :
                  "bg-gray-800 text-gray-400"
                }`}>
                  {status}
                </span>
              </Link>
              {status === "SCORED" && (
                <Link
                  to={`/admin/match/${matchId}/report`}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 transition-colors shrink-0"
                  title="View Match Report"
                  onClick={(e) => e.stopPropagation()}
                >
                  Report
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
