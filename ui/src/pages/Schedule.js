import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiGetMatches, apiGetEvents } from "../api";
import Spinner from "../components/Spinner";

const STATUS_BADGE = {
  UPCOMING: "bg-blue-900/50 text-blue-400 border-blue-800",
  LIVE: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
  COMPLETED: "bg-gray-800/80 text-gray-400 border-gray-700",
  ABANDONED: "bg-red-900/50 text-red-400 border-red-800",
  NO_RESULT: "bg-gray-800/80 text-gray-400 border-gray-700",
};

const STAGE_ORDER = ["Group", "Super8", "SemiFinal", "Final"];
const STAGE_LABELS = {
  Group: "Group Stage",
  Super8: "Super 8",
  SemiFinal: "Semi Finals",
  Final: "Final",
};

function formatLocalTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatGMTTime(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDateKey(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function extractMatchNumber(matchId) {
  const match = matchId.match(/wc_m(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function isTbcTeam(code) {
  if (!code) return true;
  const tbcPatterns = ["TBC", "X1", "X2", "X3", "X4", "Y1", "Y2", "Y3", "Y4"];
  return tbcPatterns.includes(code);
}

export default function Schedule() {
  const [matches, setMatches] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([apiGetMatches(), apiGetEvents()])
      .then(([m, events]) => {
        setMatches(m);
        if (events?.length) setEvent(events[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredMatches = useMemo(() => {
    let filtered = [...matches];

    if (stageFilter !== "All") {
      filtered = filtered.filter((m) => m.stage === stageFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (m) =>
          m.teamA?.toLowerCase().includes(q) ||
          m.teamB?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [matches, stageFilter, searchQuery]);

  const groupedByStage = useMemo(() => {
    const groups = {};
    for (const stage of STAGE_ORDER) {
      const stageMatches = filteredMatches.filter((m) => m.stage === stage);
      if (stageMatches.length > 0) {
        const byDate = {};
        for (const m of stageMatches) {
          const dateKey = getDateKey(m.scheduledTime);
          if (!byDate[dateKey]) byDate[dateKey] = [];
          byDate[dateKey].push(m);
        }
        for (const dateKey in byDate) {
          byDate[dateKey].sort(
            (a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime)
          );
        }
        groups[stage] = byDate;
      }
    }
    return groups;
  }, [filteredMatches]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalMatches = matches.length;
  const filteredCount = filteredMatches.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-brand-300 to-emerald-400 bg-clip-text text-transparent">
            Schedule
          </span>
        </h1>
        <p className="text-gray-500">
          {event?.name || "Tournament"} — {totalMatches} matches
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1.5">
              Filter by Stage
            </label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="All">All Stages</option>
              {STAGE_ORDER.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1.5">
              Search by Team
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. IND, PAK, England..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>
        {(stageFilter !== "All" || searchQuery.trim()) && (
          <div className="mt-3 text-xs text-gray-500">
            Showing {filteredCount} of {totalMatches} matches
          </div>
        )}
      </div>

      {/* Schedule by Stage */}
      {filteredMatches.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No matches found</p>
          <p className="text-gray-600 text-sm">
            Try adjusting your filters.
          </p>
        </div>
      ) : (
        Object.entries(groupedByStage).map(([stage, dateGroups]) => (
          <div key={stage} className="mb-10 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-brand-500 rounded-full" />
              {STAGE_LABELS[stage]}
            </h2>

            {Object.entries(dateGroups)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .map(([dateKey, dayMatches]) => (
                <div key={dateKey} className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 pl-1">
                    {formatDate(dayMatches[0].scheduledTime)}
                  </h3>
                  <div className="space-y-3">
                    {dayMatches.map((m) => (
                      <MatchRow key={m.matchId} match={m} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ))
      )}
    </div>
  );
}

function MatchRow({ match: m }) {
  const matchNumber = extractMatchNumber(m.matchId);
  const statusLabel = m.status.charAt(0) + m.status.slice(1).toLowerCase();
  const isCompleted = m.status === "COMPLETED";
  const teamATbc = isTbcTeam(m.teamA);
  const teamBTbc = isTbcTeam(m.teamB);

  const [venueName, venueCity] = m.venue?.split(", ") || [m.venue, ""];

  return (
    <div className="card hover:border-brand-700/50 transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Match number */}
        <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
          {matchNumber}
        </div>

        {/* Teams */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-semibold ${
                teamATbc ? "text-gray-500" : "text-gray-200"
              }`}
            >
              {m.teamA || "TBC"}
            </span>
            <span className="text-gray-600 text-xs">vs</span>
            <span
              className={`font-semibold ${
                teamBTbc ? "text-gray-500" : "text-gray-200"
              }`}
            >
              {m.teamB || "TBC"}
            </span>
          </div>

          {/* Venue */}
          <div className="text-xs text-gray-500 mt-1 truncate">
            {venueName}
            {venueCity && <span className="text-gray-600"> • {venueCity}</span>}
          </div>
        </div>

        {/* Time + Status */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-300">
              {formatLocalTime(m.scheduledTime)}
            </div>
            <div className="text-xs text-gray-600">
              {formatGMTTime(m.scheduledTime)} GMT
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${
              STATUS_BADGE[m.status] || ""
            }`}
          >
            {m.status === "LIVE" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 align-middle" />
            )}
            {statusLabel}
          </span>

          {/* CTA Button */}
          <Link
            to={`/match/${m.matchId}`}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isCompleted
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-brand-600 text-white hover:bg-brand-500"
            }`}
          >
            {isCompleted ? "View" : "Open"}
          </Link>
        </div>
      </div>

      {/* Result if completed */}
      {m.result && (
        <div className="text-xs text-emerald-400 mt-2 pl-12 sm:pl-14">
          {m.result}
        </div>
      )}
    </div>
  );
}
