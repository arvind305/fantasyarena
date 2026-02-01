import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGetMatches, apiGetEvents } from "../api";
import { useAuth } from "../auth/AuthProvider";
import Spinner, { SkeletonCard } from "../components/Spinner";

const STATUS_BADGE = {
  UPCOMING: "bg-blue-900/50 text-blue-400 border-blue-800",
  LIVE: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
  COMPLETED: "bg-gray-800/80 text-gray-400 border-gray-700",
  ABANDONED: "bg-red-900/50 text-red-400 border-red-800",
  NO_RESULT: "bg-gray-800/80 text-gray-400 border-gray-700",
};

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([apiGetMatches(), apiGetEvents()])
      .then(([m, events]) => {
        setMatches(m);
        if (events?.length) setEvent(events[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const todayMatches = matches.filter((m) => isToday(m.scheduledTime) && m.status !== "COMPLETED");
  const liveMatches = matches.filter((m) => m.status === "LIVE");
  const upcomingMatches = matches.filter((m) => m.status === "UPCOMING" && !isToday(m.scheduledTime)).slice(0, 5);
  const completedMatches = matches.filter((m) => m.status === "COMPLETED").slice(0, 3);

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
        {!user ? (
          <button onClick={signIn} className="btn-primary mt-6 text-lg px-8 py-3">
            Login to Play
          </button>
        ) : todayMatches.length > 0 ? (
          <button onClick={() => navigate(`/match/${todayMatches[0].matchId}`)} className="btn-primary mt-6 text-lg px-8 py-3">
            Go to Today's Match
          </button>
        ) : (
          <Link to="/long-term-bets" className="btn-primary mt-6 inline-block text-lg px-8 py-3">
            Make Tournament Predictions
          </Link>
        )}
      </div>

      {/* Tournament summary */}
      {event && (
        <div className="card mb-10 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-200">{event.name}</h2>
              <p className="text-gray-500 text-sm">{event.startDate} to {event.endDate}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs border bg-brand-900/50 text-brand-300 border-brand-800">{event.status}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold mb-4 text-gray-300">Live Now</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {liveMatches.map((m) => <MatchCard key={m.matchId} match={m} />)}
              </div>
            </div>
          )}

          {/* Today's Matches */}
          {todayMatches.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold mb-4 text-gray-300">Today's Matches</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {todayMatches.map((m) => <MatchCard key={m.matchId} match={m} />)}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingMatches.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold mb-4 text-gray-300">Upcoming Matches</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((m, i) => <MatchCard key={m.matchId} match={m} delay={i * 60} />)}
              </div>
            </div>
          )}

          {/* Recent Results */}
          {completedMatches.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold mb-4 text-gray-300">Recent Results</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedMatches.map((m, i) => <MatchCard key={m.matchId} match={m} delay={i * 60} />)}
              </div>
            </div>
          )}

          {matches.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-400 text-lg mb-2">No matches scheduled</p>
              <p className="text-gray-600 text-sm">Check back soon for upcoming fixtures.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MatchCard({ match: m, delay = 0 }) {
  const statusLabel = m.status.charAt(0) + m.status.slice(1).toLowerCase();
  return (
    <Link
      to={`/match/${m.matchId}`}
      className="card hover:border-brand-700 hover:shadow-brand-900/20 transition-all duration-300 group animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-200">{m.teamA}</span>
          <span className="text-gray-600 text-xs">vs</span>
          <span className="font-bold text-gray-200">{m.teamB}</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_BADGE[m.status] || ""}`}>
          {m.status === "LIVE" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 align-middle" />}
          {statusLabel}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        <div>{m.venue}</div>
        <div className="mt-1">{formatDate(m.scheduledTime)} at {formatTime(m.scheduledTime)}</div>
      </div>
      {m.result && <div className="text-xs text-emerald-400 mt-2">{m.result}</div>}
    </Link>
  );
}
