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
  DEFAULT_CONFIG,
} from "../mock/MatchTemplateGenerator";
import {
  getQuestions,
  saveStandardQuestions,
  saveSideBetQuestions,
  getStoreSnapshot,
} from "../mock/QuestionStore";

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

  // Load all data on mount
  useEffect(() => {
    console.log("[AdminDashboard] Loading data...");
    Promise.all([
      fetch("/data/t20wc_2026.json").then((r) => {
        if (!r.ok) throw new Error(`Failed to load tournament: ${r.status}`);
        return r.json();
      }),
      fetch("/data/questions.json").then((r) => r.json()).catch(() => ({ questionsByMatch: {} })),
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
      })
      .catch((err) => {
        console.error("[AdminDashboard] Load error:", err);
        toast.error(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Get draft store snapshot for status computation
  const draftStore = useMemo(() => getStoreSnapshot(), [actionInProgress]);

  // Compute status for each match
  const matchStatuses = useMemo(() => {
    const statuses = {};
    for (const match of matches) {
      const matchId = toEngineMatchId(match.match_id);
      const draftQuestions = draftStore.questionsByMatch[matchId] || [];
      const publishedQs = publishedQuestions[matchId] || [];

      const draftStandard = draftQuestions.filter((q) => q.section === "STANDARD");
      const draftSide = draftQuestions.filter((q) => q.section === "SIDE");
      const publishedStandard = publishedQs.filter((q) => q.section === "STANDARD");
      const publishedSide = publishedQs.filter((q) => q.section === "SIDE");

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
      };
    }
    return statuses;
  }, [matches, draftStore, publishedQuestions]);

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
      // Build match object in expected format
      const matchObj = {
        matchId,
        eventId: "t20wc_2026",
        teamA: { teamId: match.teams[0].toLowerCase(), shortName: match.teams[0] },
        teamB: { teamId: match.teams[1].toLowerCase(), shortName: match.teams[1] },
        scheduledTime: `${match.date}T${match.time_gmt}:00Z`,
        venue: match.venue,
        squads: [], // Empty - player options will be minimal
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

      // Create shuffled indices using seeded random
      const seed = parseInt(matchId, 10) || 1;
      const indices = templates.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      const selectedTemplates = indices.slice(0, sideBetCount).map((i) => templates[i]);
      const sideBets = applySideBets(matchId, matchObj, selectedTemplates, sideBetCount, {});

      saveSideBetQuestions(matchId, sideBets);
      toast.success(`Added ${sideBets.length} side bets for Match ${matchId}`);
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

              return (
                <tr
                  key={matchId}
                  className={`border-b border-gray-800 hover:bg-gray-800/50 ${
                    isPast ? "opacity-60" : ""
                  }`}
                >
                  {/* Match Info */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-200">
                        {match.teams[0]} vs {match.teams[1]}
                      </span>
                      <span className="text-xs text-gray-600">#{rawMatchId}</span>
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
                        className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50"
                      >
                        {action === "picking-sidebets" ? (
                          <Spinner size="sm" className="inline" />
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

                      {/* Link to detailed builder */}
                      <Link
                        to={`/admin/match/${matchId}`}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
                      >
                        Edit
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
      <div className="mt-4 text-xs text-gray-600">
        <span className="text-green-400">{"\u2705"}</span> = Created/Published |{" "}
        <span className="text-red-400">{"\u274C"}</span> = Not created |{" "}
        <span className="text-amber-400">Differs</span> = Draft != Published
      </div>
    </div>
  );
}
