import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiGetTeams } from "../api";
import Spinner from "../components/Spinner";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetTeams()
      .then(setTeams)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-brand-300 to-emerald-400 bg-clip-text text-transparent">Teams</span>
        </h1>
        <p className="text-gray-500">Browse all teams in the tournament.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {teams.map((t, i) => (
          <Link
            key={t.teamId}
            to={`/teams/${t.teamId}`}
            className="card hover:border-brand-700 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl mb-3" style={{ backgroundColor: t.color + "25", color: t.color }}>
              {t.shortName}
            </div>
            <h3 className="font-semibold text-gray-100 group-hover:text-brand-300 transition-colors">{t.name}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
