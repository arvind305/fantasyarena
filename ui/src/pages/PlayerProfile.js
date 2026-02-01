import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetPlayerProfile } from "../api";
import Spinner from "../components/Spinner";

const ROLE_LABEL = { BAT: "Batter", BOWL: "Bowler", WK: "Wicket-Keeper", AR: "All-Rounder" };

export default function PlayerProfile() {
  const { playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetPlayerProfile(playerId)
      .then(setPlayer)
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;
  if (!player) return <div className="max-w-3xl mx-auto px-4 py-10 card text-center"><p className="text-gray-400">Player not found</p></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="card mb-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-400">
            {player.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-100">{player.name}</h1>
            <div className="flex gap-3 text-sm text-gray-500 mt-1">
              <span>{ROLE_LABEL[player.role]}</span>
              {player.nationality && <span>{player.nationality}</span>}
              {player.team && (
                <Link to={`/teams/${player.team.teamId}`} className="hover:text-brand-300 transition-colors" style={{ color: player.team.color }}>
                  {player.team.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
