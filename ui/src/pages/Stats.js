import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { apiGetMatches } from "../api";
import { initializeQuestionStore, getQuestions } from "../mock/QuestionStore";
import Tabs, { useTabsWithUrl, useUrlSync } from "../components/Tabs";
import { formatMatchDate } from "../utils/date";

const STATS_TABS = [
  { key: "overview", label: "Overview" },
  { key: "history", label: "Bet History" },
  { key: "breakdowns", label: "Breakdowns" },
];

const VALID_TABS = STATS_TABS.map((t) => t.key);

export default function Stats() {
  const { user } = useAuth();
  const identity = resolveIdentity(user);

  // URL-synced tab state
  useUrlSync();
  const [activeTab, setActiveTab] = useTabsWithUrl("tab", VALID_TABS, "overview");

  // Bet history state
  const [betHistory, setBetHistory] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState("all"); // "all" | "scored" | "pending"

  // Load matches and questions on mount
  useEffect(() => {
    Promise.all([apiGetMatches(), initializeQuestionStore()])
      .then(([m]) => {
        setMatches(m);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load user bets from localStorage when matches are loaded
  useEffect(() => {
    if (!identity.userId || matches.length === 0) return;

    try {
      const raw = JSON.parse(localStorage.getItem("betting_arena_state") || "{}");
      const userBets = raw.bets?.[identity.userId] || {};

      // Convert to array and enrich with match data
      const betsArray = Object.entries(userBets).map(([matchId, bet]) => {
        const match = matches.find((m) => m.matchId === matchId);
        const questions = getQuestions(matchId);
        return {
          matchId,
          ...bet,
          match,
          questions,
        };
      });

      // Sort by submittedAt descending (newest first)
      betsArray.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      setBetHistory(betsArray);
    } catch (err) {
      console.warn("[Stats] Error loading bet history:", err);
      setBetHistory([]);
    }
  }, [identity.userId, matches]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-cyan-300 via-brand-400 to-blue-400 bg-clip-text text-transparent">
            Stats
          </span>
        </h1>
        <p className="text-gray-500">Your betting performance and history.</p>
      </div>

      {/* Tabs */}
      <Tabs tabs={STATS_TABS} activeKey={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Guest Banner */}
      {!user && (
        <div className="card mb-6 text-center py-4 bg-amber-950/20 border-amber-800/30">
          <p className="text-amber-300/80 text-sm">Sign in to view your personal stats</p>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <OverviewTab betHistory={betHistory} loading={loading} />
      )}

      {/* Bet History Tab */}
      {activeTab === "history" && (
        <BetHistoryTab
          betHistory={betHistory}
          loading={loading}
          historyFilter={historyFilter}
          setHistoryFilter={setHistoryFilter}
        />
      )}

      {/* Breakdowns Tab */}
      {activeTab === "breakdowns" && (
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-1">Breakdowns</h2>
            <p className="text-gray-500 text-sm">See how standard bets vs side bets contribute to your score.</p>
          </div>

          {/* Breakdown Sections */}
          <div className="space-y-4">
            <BreakdownCard
              icon="📊"
              title="Standard vs Side Bets"
              description="Compare your performance on standard and side bets"
            />
            <BreakdownCard
              icon="🎯"
              title="Accuracy by Bet Type"
              description="See which bet categories you're strongest at"
            />
            <BreakdownCard
              icon="🏏"
              title="Points by Match"
              description="Track how your points accumulated across matches"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ betHistory, loading }) {
  // Compute metrics from bet history
  const matchesPlayed = new Set(betHistory.map((b) => b.matchId)).size;
  const betsSubmitted = betHistory.length;
  const pendingCount = betHistory.filter((b) => b.score === null || b.score === undefined).length;
  const scoredCount = betHistory.filter((b) => b.score !== null && b.score !== undefined).length;

  // Last activity: most recent submittedAt
  const lastActivity = betHistory.length > 0
    ? new Date(betHistory[0].submittedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Loading state
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading stats...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (betHistory.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card text-center py-16 bg-gray-900/30">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg mb-2">No betting activity yet</p>
          <p className="text-gray-600 text-sm mb-6">Place bets on matches to see your stats here.</p>
          <Link to="/play" className="btn-primary px-6 py-2">
            Start Playing
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <Link
            to="/leaderboard"
            className="card hover:border-brand-600 transition-colors text-center py-4"
          >
            <p className="text-brand-400 font-medium">View Leaderboard</p>
            <p className="text-gray-600 text-xs mt-1">See where you rank</p>
          </Link>
          <Link
            to="/play"
            className="card hover:border-brand-600 transition-colors text-center py-4"
          >
            <p className="text-brand-400 font-medium">Browse Matches</p>
            <p className="text-gray-600 text-xs mt-1">Find upcoming games</p>
          </Link>
        </div>
      </div>
    );
  }

  // Stats with data
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-1">Overview</h2>
        <p className="text-gray-500 text-sm">Your betting activity at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          label="Matches Played"
          value={matchesPlayed}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          label="Bets Submitted"
          value={betsSubmitted}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Pending Scoring"
          value={pendingCount}
          valueColor="text-amber-400"
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Scored Bets"
          value={scoredCount}
          valueColor="text-emerald-400"
        />
      </div>

      {/* Last Activity */}
      {lastActivity && (
        <div className="card bg-gray-900/50 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-gray-500 text-sm">Last Activity</p>
              <p className="font-medium text-gray-200">{lastActivity}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/leaderboard"
          className="card hover:border-brand-600 transition-colors text-center py-4"
        >
          <p className="text-brand-400 font-medium">View Leaderboard</p>
          <p className="text-gray-600 text-xs mt-1">See where you rank</p>
        </Link>
        <Link
          to="/play"
          className="card hover:border-brand-600 transition-colors text-center py-4"
        >
          <p className="text-brand-400 font-medium">Browse Matches</p>
          <p className="text-gray-600 text-xs mt-1">Find upcoming games</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, valueColor = "text-gray-100" }) {
  return (
    <div className="card bg-gray-900/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-gray-500 text-sm">{label}</p>
          <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function BreakdownCard({ icon, title, description }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-xl shrink-0">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-200">{title}</h3>
      </div>
      <div className="bg-gray-900/50 rounded-lg p-6 text-center">
        <p className="text-gray-500 text-sm">{description}</p>
        <p className="text-gray-600 text-xs mt-2">Available after matches are scored</p>
      </div>
    </div>
  );
}

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "scored", label: "Scored" },
  { key: "pending", label: "Pending" },
];

const STATUS_BADGE_STYLES = {
  UPCOMING: "bg-blue-900/50 text-blue-400 border-blue-800",
  LIVE: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
  COMPLETED: "bg-gray-800/80 text-gray-400 border-gray-700",
  ABANDONED: "bg-red-900/50 text-red-400 border-red-800",
  NO_RESULT: "bg-gray-800/80 text-gray-400 border-gray-700",
};

function BetHistoryTab({ betHistory, loading, historyFilter, setHistoryFilter }) {
  // Filter bets based on selected filter
  const filteredBets = betHistory.filter((bet) => {
    if (historyFilter === "all") return true;
    if (historyFilter === "scored") return bet.score !== null && bet.score !== undefined;
    if (historyFilter === "pending") return bet.score === null || bet.score === undefined;
    return true;
  });

  // Count for filter badges
  const scoredCount = betHistory.filter((b) => b.score !== null && b.score !== undefined).length;
  const pendingCount = betHistory.filter((b) => b.score === null || b.score === undefined).length;

  const getFilterCount = (key) => {
    if (key === "all") return betHistory.length;
    if (key === "scored") return scoredCount;
    if (key === "pending") return pendingCount;
    return 0;
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-1">Bet History</h2>
        <p className="text-gray-500 text-sm">Review your bets by match and see what scored.</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading bet history...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && betHistory.length === 0 && (
        <div className="card text-center py-16 bg-gray-900/30">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg mb-2">You haven't placed any match bets yet</p>
          <p className="text-gray-600 text-sm mb-6">Place bets on matches to see your history here.</p>
          <Link to="/play" className="btn-primary px-6 py-2">
            Start Playing
          </Link>
        </div>
      )}

      {/* Filter Chips + Bet History List */}
      {!loading && betHistory.length > 0 && (
        <>
          {/* Filter Chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {FILTER_OPTIONS.map((opt) => {
              const count = getFilterCount(opt.key);
              const isActive = historyFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setHistoryFilter(opt.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-600/30 text-brand-300 border border-brand-600"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-gray-300"
                  }`}
                >
                  {opt.label}
                  {count > 0 && (
                    <span className={`ml-1.5 text-xs ${isActive ? "text-brand-400" : "text-gray-500"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filtered List */}
          {filteredBets.length > 0 ? (
            <div className="space-y-4">
              {filteredBets.map((bet, index) => (
                <BetHistoryCard key={bet.matchId} bet={bet} index={index} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-8 bg-gray-900/30">
              <p className="text-gray-500 text-sm">
                No {historyFilter === "scored" ? "scored" : "pending"} bets found.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BetHistoryCard({ bet, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { match, questions, answers, score, submittedAt } = bet;

  // Build question map for lookup
  const questionMap = new Map(questions.map((q) => [q.questionId, q]));

  // Get match display info
  const matchTitle = match
    ? `${match.teamA} vs ${match.teamB}`
    : `Match ${bet.matchId}`;
  const matchDate = match?.scheduledTime
    ? formatMatchDate(match.scheduledTime)
    : "";
  const matchStatus = match?.status || "UPCOMING";
  const statusLabel = matchStatus.charAt(0) + matchStatus.slice(1).toLowerCase();

  // Get answer display value
  const getAnswerDisplay = (questionId, answerId) => {
    const question = questionMap.get(questionId);
    if (!question) return String(answerId);

    // For numeric input, just show the value
    if (question.type === "NUMERIC_INPUT") {
      return answerId;
    }

    // For option-based questions, find the option label
    const option = question.options?.find((o) => o.optionId === answerId);
    return option?.label || String(answerId);
  };

  // Score badge display
  const renderScoreBadge = () => {
    if (score === null || score === undefined) {
      return <span className="text-sm text-gray-500 bg-gray-800/50 px-2 py-1 rounded">Pending</span>;
    }
    const colorClass = score > 0 ? "text-emerald-400" : score < 0 ? "text-red-400" : "text-gray-400";
    const prefix = score > 0 ? "+" : "";
    return (
      <span className={`text-lg font-bold ${colorClass}`}>
        {prefix}{score} pts
      </span>
    );
  };

  const answerCount = Object.keys(answers).length;

  return (
    <div
      className="card animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Match Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-100">{matchTitle}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE_STYLES[matchStatus] || STATUS_BADGE_STYLES.UPCOMING}`}>
              {matchStatus === "LIVE" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1 align-middle" />
              )}
              {statusLabel}
            </span>
          </div>
          {matchDate && (
            <p className="text-gray-500 text-sm mt-0.5">{matchDate}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {renderScoreBadge()}
        </div>
      </div>

      {/* Expand/Collapse Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-300 flex items-center justify-center gap-1 transition-colors"
      >
        {isExpanded ? (
          <>
            <span>Hide answers</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </>
        ) : (
          <>
            <span>Show answers ({answerCount})</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Answers List (collapsible) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-800/50 space-y-2">
          {Object.entries(answers).map(([questionId, answerId]) => {
            const question = questionMap.get(questionId);
            const questionText = question?.text || `Question ${questionId}`;
            const answerDisplay = getAnswerDisplay(questionId, answerId);

            return (
              <div
                key={questionId}
                className="flex items-start justify-between gap-4 py-2 border-b border-gray-800/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400">{questionText}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-gray-200">{answerDisplay}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between">
        <p className="text-xs text-gray-600">
          Submitted {new Date(submittedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {match && (
          <Link
            to={`/match/${bet.matchId}`}
            className="text-xs text-brand-400 hover:text-brand-300"
          >
            View Match →
          </Link>
        )}
      </div>
    </div>
  );
}
