import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiGetSquads } from "../api";
import Spinner from "../components/Spinner";

// Group definitions for T20 World Cup 2026
const GROUPS = {
  A: ["USA", "PAK", "IND", "NAM", "NED"],
  B: ["ZIM", "SL", "AUS", "OMAN", "IRE"],
  C: ["SCO", "WI", "ENG", "ITA", "NEP"],
  D: ["NZ", "RSA", "UAE", "AFG", "CAN"],
};
const GROUP_ORDER = ["A", "B", "C", "D"];

// Team brand colors keyed by team_code
const TEAM_COLORS = {
  IND: "#1e90ff",
  PAK: "#006400",
  USA: "#b22234",
  NED: "#ff6600",
  NAM: "#003580",
  AUS: "#ffcc00",
  SL: "#0033a0",
  IRE: "#169b62",
  ZIM: "#ffd700",
  OMAN: "#c8102e",
  ENG: "#cf142b",
  WI: "#7b3f00",
  ITA: "#009246",
  NEP: "#dc143c",
  SCO: "#0065bd",
  RSA: "#007749",
  NZ: "#000000",
  AFG: "#0066b2",
  CAN: "#ff0000",
  UAE: "#00732f",
};

export default function Teams() {
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGetSquads("t20wc_2026")
      .then((data) => setSquads(data))
      .catch((err) => {
        console.error("[Teams] Failed to load squads:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Organize squads into groups
  const teamsByGroup = useMemo(() => {
    if (!squads.length) return {};

    const groups = {};
    for (const groupName of GROUP_ORDER) {
      const codes = GROUPS[groupName] || [];
      const groupTeams = codes
        .map((code) => squads.find((s) => s.teamCode === code))
        .filter(Boolean);
      if (groupTeams.length > 0) {
        groups[groupName] = groupTeams;
      }
    }
    return groups;
  }, [squads]);

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
          <p className="text-red-400">Failed to load teams: {error}</p>
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

  const hasGroups = Object.keys(teamsByGroup).length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-brand-300 to-emerald-400 bg-clip-text text-transparent">
            Teams
          </span>
        </h1>
        <p className="text-gray-500">
          {hasGroups
            ? "Browse teams by tournament group."
            : "Browse all teams in the tournament."}
        </p>
      </div>

      {hasGroups ? (
        GROUP_ORDER.map(
          (groupName, groupIndex) =>
            teamsByGroup[groupName] && (
              <div
                key={groupName}
                className="mb-10 animate-slide-up"
                style={{ animationDelay: `${groupIndex * 100}ms` }}
              >
                <h2 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold text-sm">
                    {groupName}
                  </span>
                  Group {groupName}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {teamsByGroup[groupName].map((squad, i) => (
                    <TeamCard
                      key={squad.teamCode}
                      squad={squad}
                      delay={groupIndex * 100 + i * 60}
                    />
                  ))}
                </div>
              </div>
            )
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {squads.map((squad, i) => (
            <TeamCard key={squad.teamCode} squad={squad} delay={i * 60} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ squad, delay = 0 }) {
  const color = TEAM_COLORS[squad.teamCode] || "#888888";

  return (
    <Link
      to={`/teams/${squad.teamCode}`}
      className="card hover:border-brand-700 transition-all duration-300 group animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold text-base sm:text-xl mb-3"
        style={{ backgroundColor: color + "25", color: color }}
      >
        {squad.teamCode}
      </div>
      <h3 className="font-semibold text-gray-100 group-hover:text-brand-300 transition-colors">
        {squad.teamName}
      </h3>
    </Link>
  );
}

export { TEAM_COLORS };
