import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiGetTeams, apiGetEvents } from "../api";
import Spinner from "../components/Spinner";

const GROUP_ORDER = ["A", "B", "C", "D"];

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiGetTeams(), apiGetEvents()])
      .then(([teamsData, events]) => {
        setTeams(teamsData);
        if (events?.length) setEvent(events[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const teamsByGroup = useMemo(() => {
    if (!event?.groups) return null;

    const groups = {};
    for (const groupName of GROUP_ORDER) {
      const teamCodes = event.groups[groupName] || [];
      const groupTeams = teamCodes
        .map((code) => {
          const team = teams.find(
            (t) =>
              t.shortName === code ||
              t.teamId.toLowerCase() === code.toLowerCase()
          );
          return team;
        })
        .filter(Boolean);
      if (groupTeams.length > 0) {
        groups[groupName] = groupTeams;
      }
    }
    return groups;
  }, [teams, event]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasGroups = teamsByGroup && Object.keys(teamsByGroup).length > 0;

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
                  {teamsByGroup[groupName].map((t, i) => (
                    <TeamCard
                      key={t.teamId}
                      team={t}
                      delay={groupIndex * 100 + i * 60}
                    />
                  ))}
                </div>
              </div>
            )
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map((t, i) => (
            <TeamCard key={t.teamId} team={t} delay={i * 60} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ team: t, delay = 0 }) {
  return (
    <Link
      to={`/teams/${t.teamId}`}
      className="card hover:border-brand-700 transition-all duration-300 group animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl mb-3"
        style={{ backgroundColor: t.color + "25", color: t.color }}
      >
        {t.shortName}
      </div>
      <h3 className="font-semibold text-gray-100 group-hover:text-brand-300 transition-colors">
        {t.name}
      </h3>
    </Link>
  );
}
