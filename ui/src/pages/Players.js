import React, { useState, useEffect, useMemo } from "react";
import { apiGetAllPlayers, apiGetSquads } from "../api";
import { TEAM_COLORS } from "./Teams";
import Spinner from "../components/Spinner";

const ROLE_LABEL = { BAT: "Batter", BOWL: "Bowler", WK: "Keeper", AR: "All-Rounder" };
const ROLES = ["BAT", "BOWL", "AR", "WK"];

export default function Players() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    Promise.all([
      apiGetAllPlayers("t20wc_2026"),
      apiGetSquads("t20wc_2026"),
    ])
      .then(([players, teams]) => {
        setAllPlayers(players);
        setSquads(teams);
      })
      .catch((err) => {
        console.error("[Players] Failed to load:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Sort squads alphabetically by team name for the filter dropdown
  const sortedSquads = useMemo(
    () => [...squads].sort((a, b) => a.teamName.localeCompare(b.teamName)),
    [squads]
  );

  // Apply search + filters (presentation-only, not domain validation)
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allPlayers.filter((p) => {
      if (teamFilter && p.teamCode !== teamFilter) return false;
      if (roleFilter && p.playerRole !== roleFilter) return false;
      if (q && !p.playerName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allPlayers, search, teamFilter, roleFilter]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="card text-center">
          <p className="text-red-400">Failed to load players: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-brand-300 to-emerald-400 bg-clip-text text-transparent">
            Players
          </span>
        </h1>
        <p className="text-gray-500">
          Browse all {allPlayers.length} players in the tournament.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="input w-auto text-sm min-w-[200px]"
        />
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="input w-auto text-sm"
        >
          <option value="">All Teams</option>
          {sortedSquads.map((s) => (
            <option key={s.teamCode} value={s.teamCode}>
              {s.teamCode} - {s.teamName}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input w-auto text-sm"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <span className="text-gray-500 text-sm self-center">
          {filtered.length} player{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Player grid */}
      {filtered.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">No players match your filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const color = TEAM_COLORS[p.teamCode] || "#888888";
            return (
              <div
                key={p.playerId}
                className="card hover:border-brand-700 transition-all group animate-slide-up"
                style={{
                  animationDelay: `${Math.min(i * 40, 400)}ms`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                    {p.playerName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-100 group-hover:text-brand-300 transition-colors text-sm truncate">
                      {p.playerName}
                      {p.isCaptain && (
                        <span
                          className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: color + "25",
                            color: color,
                          }}
                        >
                          C
                        </span>
                      )}
                    </h3>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>{ROLE_LABEL[p.playerRole] || p.playerRole}</span>
                      <span style={{ color: color }}>{p.teamCode}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
