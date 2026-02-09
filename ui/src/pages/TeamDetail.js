import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetSquads, apiGetSquadPlayers } from "../api";
import { TEAM_COLORS } from "./Teams";
import Spinner from "../components/Spinner";

const ROLE_LABEL = { BAT: "Batter", BOWL: "Bowler", WK: "Keeper", AR: "All-Rounder" };
const ROLE_ORDER = { WK: 0, BAT: 1, AR: 2, BOWL: 3 };

export default function TeamDetail() {
  const { teamId } = useParams(); // teamId is actually teamCode (e.g., "IND")
  const teamCode = teamId.toUpperCase();

  const [squad, setSquad] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      apiGetSquads("t20wc_2026"),
      apiGetSquadPlayers(teamCode, "t20wc_2026"),
    ])
      .then(([squads, roster]) => {
        const found = squads.find((s) => s.teamCode === teamCode);
        setSquad(found || null);
        // Sort: captain first, then by role order, then alphabetical
        const sorted = [...roster].sort((a, b) => {
          if (a.isCaptain && !b.isCaptain) return -1;
          if (!a.isCaptain && b.isCaptain) return 1;
          const roleA = ROLE_ORDER[a.playerRole] ?? 99;
          const roleB = ROLE_ORDER[b.playerRole] ?? 99;
          if (roleA !== roleB) return roleA - roleB;
          return a.playerName.localeCompare(b.playerName);
        });
        setPlayers(sorted);
      })
      .catch((err) => {
        console.error("[TeamDetail] Failed to load:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [teamCode]);

  const color = TEAM_COLORS[teamCode] || "#888888";

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="card text-center">
          <p className="text-red-400">Failed to load team: {error}</p>
          <Link to="/teams" className="text-brand-400 hover:underline text-sm mt-2 inline-block">
            Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="card text-center">
          <p className="text-gray-400">Team not found: {teamCode}</p>
          <Link to="/teams" className="text-brand-400 hover:underline text-sm mt-2 inline-block">
            Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Team header */}
      <div className="card mb-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-2">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl"
            style={{ backgroundColor: color + "25", color: color }}
          >
            {squad.teamCode}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-100">
              {squad.teamName}
            </h1>
            <p className="text-sm text-gray-500">
              {players.length} player{players.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Link
          to="/teams"
          className="text-brand-400 hover:underline text-sm"
        >
          &larr; All Teams
        </Link>
      </div>

      {/* Roster */}
      <h2 className="text-xl font-bold mb-4 text-gray-200">Squad Roster</h2>

      {players.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">No players found for this squad.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((p, i) => (
            <div
              key={p.playerId}
              className="card hover:border-brand-700 transition-all group animate-slide-up"
              style={{ animationDelay: `${Math.min(i * 50, 500)}ms` }}
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
                        style={{ backgroundColor: color + "25", color: color }}
                      >
                        C
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {ROLE_LABEL[p.playerRole] || p.playerRole}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
