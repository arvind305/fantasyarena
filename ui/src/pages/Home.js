import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGetMatches, apiGetEvents } from "../api";
import { useAuth } from "../auth/AuthProvider";
import Spinner, { SkeletonCard } from "../components/Spinner";
import { formatDateRange, formatMatchDate, formatMatchTime, isToday, getRelativeDayLabel } from "../utils/date";

const STATUS_BADGE = {
  UPCOMING: "bg-blue-900/50 text-blue-400 border-blue-800",
  LIVE: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
  COMPLETED: "bg-gray-800/80 text-gray-400 border-gray-700",
  ABANDONED: "bg-red-900/50 text-red-400 border-red-800",
  NO_RESULT: "bg-gray-800/80 text-gray-400 border-gray-700",
};

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([apiGetMatches(), apiGetEvents()])
      .then(([m, events]) => {
        setMatches(m);
        if (events?.length) setEvent(events[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Get next 3 upcoming matches for preview
  const upcomingMatches = matches
    .filter((m) => m.status === "UPCOMING" || m.status === "LIVE")
    .slice(0, 3);

  const tournamentDateRange = event
    ? formatDateRange(event.startDate, event.endDate)
    : "7 Feb – 8 Mar 2026";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">
          <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-emerald-400 bg-clip-text text-transparent">
            Fantasy Arena
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Predict match outcomes, compete with friends, and climb the leaderboard.
        </p>

        {/* Primary CTA */}
        <div className="mt-8">
          <Link
            to="/play"
            className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2"
          >
            Start Playing
            <span>→</span>
          </Link>
        </div>

        {!user && (
          <p className="text-gray-500 mt-4 text-sm">Log in from the navbar to start placing bets.</p>
        )}
      </div>

      {/* Tournament summary */}
      {event && (
        <div className="card mb-10 animate-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-200">{event.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{tournamentDateRange}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs border bg-brand-900/50 text-brand-300 border-brand-800">
              {event.status}
            </span>
          </div>
        </div>
      )}

      {/* Quick Preview of Upcoming Matches */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : upcomingMatches.length > 0 ? (
        <div className="mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-300">Next Matches</h2>
            <Link to="/play" className="text-brand-400 hover:text-brand-300 text-sm">
              View all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMatches.map((m, i) => (
              <MatchCard key={m.matchId} match={m} delay={i * 60} />
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-4 text-center">
            Click a match to place your bets
          </p>
        </div>
      ) : (
        <div className="card text-center py-12 animate-slide-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg mb-2">No upcoming matches</p>
          <p className="text-gray-600 text-sm">Check back soon for fixtures.</p>
        </div>
      )}

      {/* Secondary CTAs */}
      <div className="grid sm:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <Link
          to="/long-term-bets"
          className="card hover:border-purple-600 hover:shadow-lg hover:shadow-purple-900/20 transition-all duration-300 group text-center py-6"
        >
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-semibold text-purple-300 group-hover:text-purple-200">Tournament Predictions</h3>
          <p className="text-gray-500 text-sm mt-1">Predict winners, top scorers & more</p>
        </Link>
        <Link
          to="/leaderboard"
          className="card hover:border-brand-600 hover:shadow-lg hover:shadow-brand-900/20 transition-all duration-300 group text-center py-6"
        >
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold text-brand-300 group-hover:text-brand-200">Leaderboard</h3>
          <p className="text-gray-500 text-sm mt-1">See where you stand</p>
        </Link>
      </div>
    </div>
  );
}

function MatchCard({ match: m, delay = 0 }) {
  const navigate = useNavigate();
  const statusLabel = m.status.charAt(0) + m.status.slice(1).toLowerCase();
  const isLive = m.status === "LIVE";
  const isUpcoming = m.status === "UPCOMING";
  const dayLabel = getRelativeDayLabel(m.scheduledTime);

  return (
    <div
      onClick={() => navigate(`/match/${m.matchId}`)}
      className="card hover:border-brand-600 hover:shadow-lg hover:shadow-brand-900/20 transition-all duration-300 cursor-pointer group animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{m.teamA}</span>
          <span className="text-gray-600 text-xs">vs</span>
          <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{m.teamB}</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_BADGE[m.status] || ""}`}>
          {isLive && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 align-middle" />
          )}
          {statusLabel}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        <div>{m.venue}</div>
        <div className="mt-1">
          <span className="text-gray-400">{dayLabel}</span> at {formatMatchTime(m.scheduledTime)}
        </div>
      </div>
      {m.result && <div className="text-xs text-emerald-400 mt-2">{m.result}</div>}
      {(isUpcoming || isLive) && !m.result && (
        <button className="w-full mt-3 py-2 px-3 rounded-lg bg-brand-600/20 border border-brand-700/50 text-brand-300 text-sm font-medium group-hover:bg-brand-600/30 group-hover:border-brand-600 transition-all">
          Place Bets →
        </button>
      )}
    </div>
  );
}
