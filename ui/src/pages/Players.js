import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiGetPlayers, apiGetTeams } from "../api";
import Spinner from "../components/Spinner";

const ROLE_LABEL = { BAT: "Batter", BOWL: "Bowler", WK: "Keeper", AR: "All-Rounder" };
const ROLES = ["", "BAT", "BOWL", "WK", "AR"];

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    Promise.all([apiGetPlayers(), apiGetTeams()])
      .then(([p, t]) => { setPlayers(p); setTeams(t); })
      .finally(() => setLoading(false));
  }, []);

  // Filtering uses server-provided data. The UI applies display filters
  // over the full player list returned by the server. This is presentation
  // filtering (narrowing a rendered list), NOT domain validation.
  const filtered = players.filter((p) => {
    if (teamFilter && p.teamId !== teamFilter) return false;
    if (roleFilter && p.role !== roleFilter) return false;
    return true;
  });

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-brand-300 to-emerald-400 bg-clip-text text-transparent">Players</span>
        </h1>
        <p className="text-gray-500">Browse all players in the tournament.</p>
      </div>

      {/* Filters — presentation-only, not domain validation */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="input w-auto text-sm">
          <option value="">All Teams</option>
          {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input w-auto text-sm">
          <option value="">All Roles</option>
          {ROLES.filter(Boolean).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <span className="text-gray-500 text-sm self-center">{filtered.length} players</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, i) => {
          const team = teams.find((t) => t.teamId === p.teamId);
          return (
            <Link
              key={p.playerId}
              to={`/players/${p.playerId}`}
              className="card hover:border-brand-700 transition-all group animate-slide-up"
              style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                  {p.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-100 group-hover:text-brand-300 transition-colors text-sm">{p.name}</h3>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>{ROLE_LABEL[p.role]}</span>
                    {team && <span style={{ color: team.color }}>{team.shortName}</span>}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
