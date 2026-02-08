import React, { useState, useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../components/Toast";
import { getAdminEmail } from "../config";
import Spinner from "../components/Spinner";
import {
  generateStandardPack,
  applySideBets,
  loadSideBetLibrary,
  preloadGeneratorData,
  DEFAULT_CONFIG,
  isEarlyMatch,
  EARLY_MATCH_CONFIG,
} from "../mock/MatchTemplateGenerator";
import {
  getQuestions,
  saveStandardQuestions,
  saveSideBetQuestions,
  getStoreSnapshot,
} from "../mock/QuestionStore";
// API imports available but using direct Supabase queries for admin status data
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Simple seeded random for deterministic side bet selection
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function formatDate(date, time) {
  const d = new Date(`${date}T${time}:00Z`);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScheduledTime(match) {
  return new Date(`${match.date}T${match.time_gmt}:00Z`);
}

// Get tomorrow's date in YYYY-MM-DD format
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Convert raw match_id to engine matchId format
function toEngineMatchId(rawMatchId) {
  return `wc_m${rawMatchId}`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const adminEmail = getAdminEmail();
  const isAdmin = user && adminEmail && user.email?.trim().toLowerCase() === adminEmail;

  console.log("[AdminDashboard] Render - user:", user?.email, "adminEmail:", adminEmail, "isAdmin:", isAdmin);

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [publishedQuestions, setPublishedQuestions] = useState({});
  const [sideBetLibrary, setSideBetLibrary] = useState({ templates: [] });
  const [sideBetCount, setSideBetCount] = useState(3);
  const [filter, setFilter] = useState("all"); // all | upcoming | past
  const [actionInProgress, setActionInProgress] = useState({}); // matchId -> action
  const [publishError, setPublishError] = useState(null);
  const [matchResults, setMatchResults] = useState({}); // matchId -> results
  const [betsScored, setBetsScored] = useState({}); // matchId -> boolean (has scored bets)
  const [supabaseQuestions, setSupabaseQuestions] = useState({}); // matchId -> questions from Supabase
  const [preparingTomorrow, setPreparingTomorrow] = useState(false);
  const [tomorrowMatches, setTomorrowMatches] = useState([]);

  // Load all data on mount
  useEffect(() => {
    console.log("[AdminDashboard] Loading data...");
    Promise.all([
      fetch("/data/t20wc_2026.json").then((r) => {
        if (!r.ok) throw new Error(`Failed to load tournament: ${r.status}`);
        return r.json();
      }),
      fetch(`/data/questions.json?v=${Date.now()}`).then((r) => r.json()).catch(() => ({ questionsByMatch: {} })),
      loadSideBetLibrary(),
    ])
      .then(([tournament, published, library]) => {
        console.log("[AdminDashboard] Data loaded:", {
          matches: tournament?.matches?.length,
          published: Object.keys(published?.questionsByMatch || {}).length
        });
        setMatches(tournament?.matches || []);
        setPublishedQuestions(published?.questionsByMatch || {});
        setSideBetLibrary(library);

        // Load match results and Supabase questions for status indicators
        loadMatchStatusData(tournament?.matches || []);
      })
      .catch((err) => {
        console.error("[AdminDashboard] Load error:", err);
        toast.error(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load match results and Supabase questions for enhanced status indicators
  async function loadMatchStatusData(matchList) {
    if (!supabase || !isSupabaseConfigured()) return;

    try {
      // Load all match results
      const { data: results } = await supabase
        .from('match_results')
        .select('match_id, winner, completed_at');

      if (results) {
        const resultsMap = {};
        results.forEach(r => {
          resultsMap[r.match_id] = r;
        });
        setMatchResults(resultsMap);
      }

      // Load all questions from Supabase to check publish status
      const { data: questions } = await supabase
        .from('match_questions')
        .select('match_id, question_id');

      if (questions) {
        const questionsMap = {};
        questions.forEach(q => {
          if (!questionsMap[q.match_id]) questionsMap[q.match_id] = [];
          questionsMap[q.match_id].push(q);
        });
        setSupabaseQuestions(questionsMap);
      }

      // Check which matches have scored bets
      const { data: scoredBets } = await supabase
        .from('bets')
        .select('match_id, score')
        .not('score', 'is', null);

      if (scoredBets) {
        const scoredMap = {};
        scoredBets.forEach(b => {
          scoredMap[b.match_id] = true;
        });
        setBetsScored(scoredMap);
      }
    } catch (err) {
      console.warn('[AdminDashboard] Error loading status data:', err);
    }
  }

  // Get draft store snapshot for status computation
  const draftStore = useMemo(() => getStoreSnapshot(), [actionInProgress]);

  // Compute status for each match
  const matchStatuses = useMemo(() => {
    const statuses = {};
    for (const match of matches) {
      const matchId = toEngineMatchId(match.match_id);
      const draftQuestions = draftStore.questionsByMatch[matchId] || [];
      const publishedQs = publishedQuestions[matchId] || [];
      const supabaseQs = supabaseQuestions[matchId] || [];

      const draftStandard = draftQuestions.filter((q) => q.section === "STANDARD");
      const draftSide = draftQuestions.filter((q) => q.section === "SIDE");
      const publishedStandard = publishedQs.filter((q) => q.section === "STANDARD");
      const publishedSide = publishedQs.filter((q) => q.section === "SIDE");

      // Enhanced status levels
      const hasResults = !!matchResults[matchId];
      const hasScores = !!betsScored[matchId];
      const publishedToSupabase = supabaseQs.length > 0;

      statuses[matchId] = {
        standardCreated: draftStandard.length > 0,
        standardCount: draftStandard.length,
        sideCreated: draftSide.length > 0,
        sideCount: draftSide.length,
        published: publishedQs.length > 0,
        publishedStandardCount: publishedStandard.length,
        publishedSideCount: publishedSide.length,
        differs:
          publishedQs.length > 0 &&
          (draftStandard.length !== publishedStandard.length ||
            draftSide.length !== publishedSide.length),
        // New status fields
        publishedToSupabase,
        supabaseQuestionCount: supabaseQs.length,
        hasResults,
        hasScores,
        // Overall status level: 'none' | 'draft' | 'published' | 'results' | 'scored'
        statusLevel: hasScores ? 'scored' :
                     hasResults ? 'results' :
                     publishedToSupabase ? 'published' :
                     (draftStandard.length > 0 || draftSide.length > 0) ? 'draft' : 'none'
      };
    }
    return statuses;
  }, [matches, draftStore, publishedQuestions, supabaseQuestions, matchResults, betsScored]);

  // Compute summary statistics
  const summaryStats = useMemo(() => {
    const statusValues = Object.values(matchStatuses);
    const now = new Date();
    return {
      totalMatches: matches.length,
      matchesCompleted: statusValues.filter(s => s.hasResults).length,
      matchesWithQuestions: statusValues.filter(s => s.publishedToSupabase).length,
      matchesWithResults: statusValues.filter(s => s.hasResults).length,
      matchesScored: statusValues.filter(s => s.hasScores).length,
      matchesNeedingAttention: statusValues.filter(s => s.statusLevel === 'none' || s.statusLevel === 'draft').length,
      upcomingMatches: matches.filter(m => getScheduledTime(m) > now).length,
    };
  }, [matches, matchStatuses]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    const now = new Date();
    let filtered = [...matches];

    if (filter === "upcoming") {
      filtered = filtered.filter((m) => getScheduledTime(m) > now);
    } else if (filter === "past") {
      filtered = filtered.filter((m) => getScheduledTime(m) <= now);
    }

    // Sort by scheduledTime ascending
    filtered.sort((a, b) => getScheduledTime(a) - getScheduledTime(b));

    return filtered;
  }, [matches, filter]);

  // Generate standard pack for a match
  async function handleGenerateStandard(match) {
    const matchId = toEngineMatchId(match.match_id);
    setActionInProgress((prev) => ({ ...prev, [matchId]: "generating-standard" }));

    try {
      // Preload squads and players data for PLAYER_PICK options
      await preloadGeneratorData();

      // Build match object in expected format
      const matchObj = {
        matchId,
        eventId: "t20wc_2026",
        teamA: { teamId: match.teams[0].toLowerCase(), shortName: match.teams[0] },
        teamB: { teamId: match.teams[1].toLowerCase(), shortName: match.teams[1] },
        scheduledTime: `${match.date}T${match.time_gmt}:00Z`,
        venue: match.venue,
      };

      const standardPack = generateStandardPack(matchObj, {}, DEFAULT_CONFIG);
      saveStandardQuestions(matchId, standardPack);

      toast.success(`Generated ${standardPack.length} standard questions for Match ${matchId}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    }
  }

  // Auto-pick N side bets for a match
  async function handleAutoPickSideBets(match) {
    const matchId = toEngineMatchId(match.match_id);
    setActionInProgress((prev) => ({ ...prev, [matchId]: "picking-sidebets" }));

    try {
      // Build match object
      const matchObj = {
        matchId,
        eventId: "t20wc_2026",
        teamA: { teamId: match.teams[0].toLowerCase(), shortName: match.teams[0] },
        teamB: { teamId: match.teams[1].toLowerCase(), shortName: match.teams[1] },
      };

      // Deterministic selection seeded by matchId
      const templates = sideBetLibrary.templates || [];
      if (templates.length === 0) {
        toast.error("No side bet templates available");
        return;
      }

      // For early matches (first 3), enforce max 1 side bet
      const earlyMatch = isEarlyMatch(matchId);
      const maxSideBets = earlyMatch ? EARLY_MATCH_CONFIG.maxSideBets : sideBetCount;

      // Create shuffled indices using seeded random
      const seed = parseInt(matchId, 10) || 1;
      const indices = templates.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      const selectedTemplates = indices.slice(0, maxSideBets).map((i) => templates[i]);
      const sideBets = applySideBets(matchId, matchObj, selectedTemplates, maxSideBets, {});

      saveSideBetQuestions(matchId, sideBets);

      if (earlyMatch) {
        toast.success(`Added 1 side bet for early match ${matchId} (simplified sheet)`);
      } else {
        toast.success(`Added ${sideBets.length} side bets for Match ${matchId}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    }
  }

  // Prepare tomorrow's matches - find matches and check their question status
  async function handlePrepareTomorrow() {
    setPreparingTomorrow(true);
    try {
      const tomorrow = getTomorrowDate();
      const tomorrowMatchList = matches.filter(m => m.date === tomorrow);
      setTomorrowMatches(tomorrowMatchList);

      if (tomorrowMatchList.length === 0) {
        toast.info("No matches scheduled for tomorrow");
      } else {
        toast.success(`Found ${tomorrowMatchList.length} match(es) for tomorrow`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPreparingTomorrow(false);
    }
  }

  // Auto-generate questions for all tomorrow's matches
  async function handleAutoGenerateForTomorrow() {
    setPreparingTomorrow(true);
    try {
      await preloadGeneratorData();

      for (const match of tomorrowMatches) {
        const matchId = toEngineMatchId(match.match_id);
        const status = matchStatuses[matchId] || {};

        // Generate standard pack if not already created
        if (!status.standardCreated) {
          const matchObj = {
            matchId,
            eventId: "t20wc_2026",
            teamA: { teamId: match.teams[0].toLowerCase(), shortName: match.teams[0] },
            teamB: { teamId: match.teams[1].toLowerCase(), shortName: match.teams[1] },
            scheduledTime: `${match.date}T${match.time_gmt}:00Z`,
            venue: match.venue,
          };
          const standardPack = generateStandardPack(matchObj, {}, DEFAULT_CONFIG);
          saveStandardQuestions(matchId, standardPack);
        }

        // Generate side bets if not already created
        if (!status.sideCreated) {
          const matchObj = {
            matchId,
            eventId: "t20wc_2026",
            teamA: { teamId: match.teams[0].toLowerCase(), shortName: match.teams[0] },
            teamB: { teamId: match.teams[1].toLowerCase(), shortName: match.teams[1] },
          };

          const templates = sideBetLibrary.templates || [];
          if (templates.length > 0) {
            const earlyMatch = isEarlyMatch(matchId);
            const maxSideBets = earlyMatch ? EARLY_MATCH_CONFIG.maxSideBets : sideBetCount;
            const seed = parseInt(matchId, 10) || 1;
            const indices = templates.map((_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
              const j = Math.floor(seededRandom(seed + i) * (i + 1));
              [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            const selectedTemplates = indices.slice(0, maxSideBets).map((i) => templates[i]);
            const sideBets = applySideBets(matchId, matchObj, selectedTemplates, maxSideBets, {});
            saveSideBetQuestions(matchId, sideBets);
          }
        }
      }

      toast.success(`Generated questions for ${tomorrowMatches.length} match(es)`);
      setTomorrowMatches([]); // Clear the list after generation
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPreparingTomorrow(false);
    }
  }

  // Publish questions for a match
  async function handlePublish(match) {
    const matchId = toEngineMatchId(match.match_id);
    setActionInProgress((prev) => ({ ...prev, [matchId]: "publishing" }));
    setPublishError(null);

    try {
      const draftQuestions = getQuestions(matchId);
      if (draftQuestions.length === 0) {
        toast.error("No questions to publish for this match");
        return;
      }

      // Build new canonical: merge draft into published
      const newCanonical = { ...publishedQuestions };
      newCanonical[matchId] = draftQuestions;

      const res = await fetch("/api/publishQuestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionsJson: { questionsByMatch: newCanonical },
          meta: { matchId },
        }),
      });

      // Check if response is JSON (API might not be available in dev mode)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setPublishError("API not available. Use 'vercel dev' instead of 'npm start' to test publishing, or deploy to Vercel.");
        toast.error("Publish API not available in this environment");
        return;
      }

      const result = await res.json();

      if (!res.ok) {
        // Check for missing env vars error
        if (result.error && result.error.includes("environment variable")) {
          setPublishError(result.error);
          toast.error("Publish failed: GitHub credentials not configured");
        } else {
          toast.error(result.error || "Publish failed");
        }
        return;
      }

      // Refresh published questions
      setPublishedQuestions(newCanonical);
      toast.success(`Published Match ${matchId} successfully`);
    } catch (err) {
      if (err.message.includes("Failed to fetch")) {
        setPublishError("Publish endpoint not available. Check server configuration.");
      }
      toast.error(err.message);
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    }
  }

  // Auth guards
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card text-center py-12">
          <p className="text-red-400 text-lg">Access Denied</p>
          <p className="text-gray-500 text-sm mt-2">You do not have admin privileges.</p>
          <Link to="/" className="text-brand-400 text-sm mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-gray-500 mt-4">Loading match data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-200 mb-6">Admin Dashboard</h1>

      {/* Match Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-gray-200">{summaryStats.totalMatches}</div>
          <div className="text-sm text-gray-500">Total Matches</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-green-400">{summaryStats.matchesWithQuestions}</div>
          <div className="text-sm text-gray-500">Questions Ready</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-blue-400">{summaryStats.matchesWithResults}</div>
          <div className="text-sm text-gray-500">Results Entered</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-purple-400">{summaryStats.matchesScored}</div>
          <div className="text-sm text-gray-500">Bets Scored</div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/schedule"
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
          >
            View All Matches
          </Link>
          <Link
            to="/leaderboard"
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
          >
            Leaderboard
          </Link>
          <button
            onClick={handlePrepareTomorrow}
            disabled={preparingTomorrow}
            className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {preparingTomorrow ? <Spinner size="sm" className="inline" /> : "Prepare Tomorrow's Matches"}
          </button>
          {summaryStats.matchesNeedingAttention > 0 && (
            <span className="px-3 py-1 text-sm bg-amber-900/50 text-amber-400 border border-amber-700 rounded">
              {summaryStats.matchesNeedingAttention} match(es) need attention
            </span>
          )}
        </div>

        {/* Tomorrow's Matches Panel */}
        {tomorrowMatches.length > 0 && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-md font-medium text-gray-200 mb-3">
              Tomorrow's Matches ({getTomorrowDate()})
            </h3>
            <div className="space-y-2 mb-4">
              {tomorrowMatches.map(match => {
                const matchId = toEngineMatchId(match.match_id);
                const status = matchStatuses[matchId] || {};
                return (
                  <div key={matchId} className="flex items-center justify-between p-2 bg-gray-900 rounded">
                    <span className="text-gray-200">
                      {match.teams[0]} vs {match.teams[1]}
                    </span>
                    <div className="flex items-center gap-2">
                      {status.standardCreated ? (
                        <span className="text-xs text-green-400">Standard: {status.standardCount}</span>
                      ) : (
                        <span className="text-xs text-red-400">No standard questions</span>
                      )}
                      {status.sideCreated ? (
                        <span className="text-xs text-green-400">Side: {status.sideCount}</span>
                      ) : (
                        <span className="text-xs text-red-400">No side bets</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAutoGenerateForTomorrow}
                disabled={preparingTomorrow}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {preparingTomorrow ? <Spinner size="sm" className="inline" /> : "Auto-Generate All Questions"}
              </button>
              <button
                onClick={() => setTomorrowMatches([])}
                className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Publish Error Banner */}
      {publishError && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm font-medium">Publishing Disabled</p>
          <p className="text-red-300 text-xs mt-1">{publishError}</p>
          <p className="text-gray-500 text-xs mt-2">
            Configure GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO environment variables in Vercel.
          </p>
        </div>
      )}

      {/* Global Controls */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Side bets per match */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Side bets per match:</label>
            <input
              type="number"
              min="1"
              max="8"
              value={sideBetCount}
              onChange={(e) =>
                setSideBetCount(Math.max(1, Math.min(8, parseInt(e.target.value, 10) || 3)))
              }
              className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-gray-200"
            >
              <option value="all">All ({matches.length})</option>
              <option value="upcoming">
                Upcoming ({matches.filter((m) => getScheduledTime(m) > new Date()).length})
              </option>
              <option value="past">
                Past ({matches.filter((m) => getScheduledTime(m) <= new Date()).length})
              </option>
            </select>
          </div>

          {/* Stats summary */}
          <div className="ml-auto text-sm text-gray-500">
            {Object.values(matchStatuses).filter((s) => s.published).length} / {matches.length}{" "}
            published
          </div>
        </div>
      </div>

      {/* Match Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="px-3 py-3 text-gray-400 font-medium">Status</th>
              <th className="px-3 py-3 text-gray-400 font-medium">Match</th>
              <th className="px-3 py-3 text-gray-400 font-medium text-center">Standard Pack</th>
              <th className="px-3 py-3 text-gray-400 font-medium text-center">Side Bets</th>
              <th className="px-3 py-3 text-gray-400 font-medium text-center">Published</th>
              <th className="px-3 py-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map((match) => {
              const matchId = toEngineMatchId(match.match_id);
              const rawMatchId = match.match_id;
              const status = matchStatuses[matchId] || {};
              const action = actionInProgress[matchId];
              const isPast = getScheduledTime(match) <= new Date();
              const earlyMatch = isEarlyMatch(matchId);

              return (
                <tr
                  key={matchId}
                  className={`border-b border-gray-800 hover:bg-gray-800/50 ${
                    isPast ? "opacity-60" : ""
                  }`}
                >
                  {/* Status Indicator */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {status.statusLevel === 'scored' && (
                        <span className="w-3 h-3 rounded-full bg-purple-500" title="Bets Scored"></span>
                      )}
                      {status.statusLevel === 'results' && (
                        <span className="w-3 h-3 rounded-full bg-blue-500" title="Results Entered"></span>
                      )}
                      {status.statusLevel === 'published' && (
                        <span className="w-3 h-3 rounded-full bg-green-500" title="Questions Published"></span>
                      )}
                      {status.statusLevel === 'draft' && (
                        <span className="w-3 h-3 rounded-full bg-yellow-500" title="Draft Questions"></span>
                      )}
                      {status.statusLevel === 'none' && (
                        <span className="w-3 h-3 rounded-full bg-red-500" title="No Questions"></span>
                      )}
                      <span className="text-xs text-gray-500 capitalize">{status.statusLevel}</span>
                    </div>
                  </td>

                  {/* Match Info */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-200">
                        {match.teams[0]} vs {match.teams[1]}
                      </span>
                      <span className="text-xs text-gray-600">#{rawMatchId}</span>
                      {earlyMatch && (
                        <span className="px-1.5 py-0.5 text-xs bg-amber-900/50 text-amber-400 border border-amber-700 rounded">
                          4Q
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(match.date, match.time_gmt)}
                    </div>
                    <div className="text-xs text-gray-600">{match.venue}</div>
                  </td>

                  {/* Standard Pack Status */}
                  <td className="px-3 py-3 text-center">
                    {status.standardCreated ? (
                      <span className="text-green-400">
                        {"\u2705"} {status.standardCount}
                      </span>
                    ) : (
                      <span className="text-red-400">{"\u274C"}</span>
                    )}
                  </td>

                  {/* Side Bets Status */}
                  <td className="px-3 py-3 text-center">
                    {status.sideCreated ? (
                      <span className="text-green-400">
                        {"\u2705"} {status.sideCount}
                      </span>
                    ) : (
                      <span className="text-red-400">{"\u274C"}</span>
                    )}
                  </td>

                  {/* Published Status */}
                  <td className="px-3 py-3 text-center">
                    {status.published ? (
                      <div>
                        <span className="text-green-400">{"\u2705"}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({status.publishedStandardCount}+{status.publishedSideCount})
                        </span>
                        {status.differs && (
                          <div className="text-xs text-amber-400 mt-1">Differs from draft</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-red-400">{"\u274C"}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {/* Generate Standard */}
                      <button
                        onClick={() => handleGenerateStandard(match)}
                        disabled={action}
                        className="px-2 py-1 text-xs bg-brand-600 hover:bg-brand-700 text-white rounded transition-colors disabled:opacity-50"
                      >
                        {action === "generating-standard" ? (
                          <Spinner size="sm" className="inline" />
                        ) : (
                          "Gen Standard"
                        )}
                      </button>

                      {/* Auto-pick Side Bets */}
                      <button
                        onClick={() => handleAutoPickSideBets(match)}
                        disabled={action}
                        className={`px-2 py-1 text-xs text-white rounded transition-colors disabled:opacity-50 ${
                          earlyMatch
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-purple-600 hover:bg-purple-700"
                        }`}
                      >
                        {action === "picking-sidebets" ? (
                          <Spinner size="sm" className="inline" />
                        ) : earlyMatch ? (
                          "Pick 1 Side"
                        ) : (
                          `Pick ${sideBetCount} Side`
                        )}
                      </button>

                      {/* Publish */}
                      <button
                        onClick={() => handlePublish(match)}
                        disabled={action || publishError || (!status.standardCreated && !status.sideCreated)}
                        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                      >
                        {action === "publishing" ? (
                          <Spinner size="sm" className="inline" />
                        ) : (
                          "Publish"
                        )}
                      </button>

                      {/* Link to Match Builder */}
                      <Link
                        to={`/admin/match/${matchId}`}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
                      >
                        Builder
                      </Link>

                      {/* Link to Match Results */}
                      <Link
                        to={`/admin/match/${matchId}/results`}
                        className="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                      >
                        Results
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredMatches.length === 0 && (
          <div className="text-center py-8 text-gray-500">No matches found for this filter.</div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 text-xs text-gray-600 space-y-1">
        <div>
          <strong className="text-gray-400">Status Indicators:</strong>{" "}
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> None</span>{" | "}
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Draft</span>{" | "}
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Published</span>{" | "}
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Results</span>{" | "}
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Scored</span>
        </div>
        <div>
          <span className="text-green-400">{"\u2705"}</span> = Created/Published |{" "}
          <span className="text-red-400">{"\u274C"}</span> = Not created |{" "}
          <span className="text-amber-400">Differs</span> = Draft != Published |{" "}
          <span className="px-1 py-0.5 bg-amber-900/50 text-amber-400 border border-amber-700 rounded text-xs">4Q</span> = Simplified 4-question sheet (first 3 matches)
        </div>
      </div>
    </div>
  );
}
