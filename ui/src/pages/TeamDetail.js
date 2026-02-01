import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetTeamDetail } from "../api";
import Spinner from "../components/Spinner";

const ROLE_LABEL = { BAT: "Batter", BOWL: "Bowler", WK: "Keeper", AR: "All-Rounder" };

export default function TeamDetail() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetTeamDetail(teamId)
      .then(setTeam)
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;
  if (!team) return <div className="max-w-4xl mx-auto px-4 py-10 card text-center"><p className="text-gray-400">Team not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="card mb-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl" style={{ backgroundColor: team.color + "25", color: team.color }}>
            {team.shortName}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-100">{team.name}</h1>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 text-gray-200">Roster</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(team.roster || []).map((p, i) => (
          <Link
            key={p.playerId}
            to={`/players/${p.playerId}`}
            className="card hover:border-brand-700 transition-all group animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                {p.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-semibold text-gray-100 group-hover:text-brand-300 transition-colors text-sm">{p.name}</h3>
                <span className="text-xs text-gray-500">{ROLE_LABEL[p.role] || p.role}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
