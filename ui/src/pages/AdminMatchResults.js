import React, { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  apiGetMatch,
  apiGetBettingQuestions,
  apiSaveMatchResults,
  apiCalculateMatchScores,
  apiGetMatchResults,
  apiLockMatchBets,
} from "../api";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../components/Toast";
import { getAdminEmail } from "../config";
import Spinner from "../components/Spinner";

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Match result options
const RESULT_OPTIONS = [
  { value: "TEAM_A", label: "Team A Wins" },
  { value: "TEAM_B", label: "Team B Wins" },
  { value: "SUPER_OVER", label: "Super Over" },
  { value: "TIE", label: "Tie" },
  { value: "NO_RESULT", label: "No Result" },
  { value: "ABANDONED", label: "Abandoned" },
];

// Checkpoint definitions for live match scoring
const CHECKPOINTS = [
  { id: "powerplay_1", label: "End of Powerplay (Innings 1)", triggered: false },
  { id: "10_overs_1", label: "End of 10 Overs (Innings 1)", triggered: false },
  { id: "15_overs_1", label: "End of 15 Overs (Innings 1)", triggered: false },
  { id: "innings_1", label: "End of Innings 1", triggered: false },
  { id: "powerplay_2", label: "End of Powerplay (Innings 2)", triggered: false },
  { id: "10_overs_2", label: "End of 10 Overs (Innings 2)", triggered: false },
  { id: "15_overs_2", label: "End of 15 Overs (Innings 2)", triggered: false },
  { id: "innings_2", label: "End of Innings 2 / Match End", triggered: false },
];

// Empty player stats template
function createEmptyPlayerStats() {
  return {
    playerId: "",
    playerName: "",
    teamId: "",
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    wickets: 0,
    overs: 0,
    runsConceded: 0,
    catches: 0,
    runOuts: 0,
    stumpings: 0,
  };
}

export default function AdminMatchResults() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [match, setMatch] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Match result state
  const [matchResult, setMatchResult] = useState("TEAM_A");
  const [superOverWinner, setSuperOverWinner] = useState("");
  const [teamAScore, setTeamAScore] = useState({ runs: 0, wickets: 0, overs: 0 });
  const [teamBScore, setTeamBScore] = useState({ runs: 0, wickets: 0, overs: 0 });
  const [manOfMatch, setManOfMatch] = useState("");

  // Player stats state
  const [playerStats, setPlayerStats] = useState([]);

  // Side bet answers state
  const [sideBetAnswers, setSideBetAnswers] = useState({});

  // Checkpoint state
  const [checkpoints, setCheckpoints] = useState([...CHECKPOINTS]);
  const [triggeringCheckpoint, setTriggeringCheckpoint] = useState(null);

  // All players from both squads for dropdown
  const [allPlayers, setAllPlayers] = useState([]);

  const adminEmail = getAdminEmail();
  const isAdmin = user && adminEmail && user.email?.trim().toLowerCase() === adminEmail;

  useEffect(() => {
    Promise.all([apiGetMatch(matchId), apiGetBettingQuestions(matchId)])
      .then(([m, q]) => {
        setMatch(m);
        setQuestions(q || []);

        // Build player list from squads
        const players = [];
        if (m.squads) {
          for (const squad of m.squads) {
            const teamId = squad.teamId;
            const teamName =
              teamId === m.teamA?.teamId
                ? m.teamA?.shortName
                : teamId === m.teamB?.teamId
                ? m.teamB?.shortName
                : teamId;
            for (const p of squad.players || []) {
              players.push({
                playerId: p.playerId,
                playerName: p.name,
                teamId,
                teamName,
              });
            }
          }
        }
        setAllPlayers(players);

        // Initialize side bet answers from questions
        const sideQ = (q || []).filter((qu) => qu.section === "SIDE" || qu.kind === "SIDE_BET");
        const initialAnswers = {};
        for (const qu of sideQ) {
          initialAnswers[qu.questionId] = "";
        }
        setSideBetAnswers(initialAnswers);

        // Load existing match results if available
        return apiGetMatchResults(matchId).then((existingResults) => {
          if (existingResults) {
            if (existingResults.result) setMatchResult(existingResults.result);
            if (existingResults.superOverWinner) setSuperOverWinner(existingResults.superOverWinner);
            if (existingResults.teamAScore) setTeamAScore(existingResults.teamAScore);
            if (existingResults.teamBScore) setTeamBScore(existingResults.teamBScore);
            if (existingResults.manOfMatch) setManOfMatch(existingResults.manOfMatch);
            if (existingResults.playerStats) setPlayerStats(existingResults.playerStats);
            if (existingResults.sideBetAnswers) {
              setSideBetAnswers((prev) => ({ ...prev, ...existingResults.sideBetAnswers }));
            }
            if (existingResults.checkpoints) {
              setCheckpoints((prev) =>
                prev.map((cp) => ({
                  ...cp,
                  triggered: existingResults.checkpoints.includes(cp.id),
                }))
              );
            }
          }
        });
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [matchId, toast]);

  // Calculate total runs
  const totalRuns = teamAScore.runs + teamBScore.runs;

  // Filter side bet questions
  const sideBetQuestions = questions.filter(
    (q) => q.section === "SIDE" || q.kind === "SIDE_BET"
  );

  // Add a new player stats row
  function handleAddPlayer() {
    setPlayerStats((prev) => [...prev, createEmptyPlayerStats()]);
  }

  // Remove a player stats row
  function handleRemovePlayer(index) {
    setPlayerStats((prev) => prev.filter((_, i) => i !== index));
  }

  // Update player stats
  function handleUpdatePlayerStats(index, field, value) {
    setPlayerStats((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]:
                field === "playerId" || field === "playerName" || field === "teamId"
                  ? value
                  : parseFloat(value) || 0,
            }
          : p
      )
    );
  }

  // Select player from dropdown
  function handleSelectPlayer(index, playerId) {
    const player = allPlayers.find((p) => p.playerId === playerId);
    if (player) {
      setPlayerStats((prev) =>
        prev.map((p, i) =>
          i === index
            ? { ...p, playerId: player.playerId, playerName: player.playerName, teamId: player.teamId }
            : p
        )
      );
    }
  }

  // Trigger a checkpoint
  async function handleTriggerCheckpoint(checkpointId) {
    setTriggeringCheckpoint(checkpointId);
    try {
      // In a real implementation, this would call an API to trigger checkpoint scoring
      // For now, we just mark it as triggered locally
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

      setCheckpoints((prev) =>
        prev.map((cp) => (cp.id === checkpointId ? { ...cp, triggered: true } : cp))
      );
      toast.success(`Checkpoint "${checkpoints.find((c) => c.id === checkpointId)?.label}" triggered`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTriggeringCheckpoint(null);
    }
  }

  // Calculate scores (trigger scoring for all bets)
  async function handleCalculateScores() {
    setCalculating(true);
    try {
      // First, lock all bets for this match to prevent further changes
      await apiLockMatchBets(matchId);

      // Build the match results payload
      const resultsPayload = {
        matchId,
        result: matchResult,
        superOverWinner: matchResult === "SUPER_OVER" ? superOverWinner : null,
        teamAScore,
        teamBScore,
        totalRuns,
        manOfMatch,
        playerStats,
        sideBetAnswers,
        checkpoints: checkpoints.filter((c) => c.triggered).map((c) => c.id),
      };

      // Save results first
      await apiSaveMatchResults(matchId, resultsPayload);

      // Then trigger scoring calculation (use match's eventId or default)
      const eventId = match?.eventId || 't20wc_2026';
      const scoreResult = await apiCalculateMatchScores(matchId, eventId);

      const betsScored = scoreResult?.betsScored || scoreResult?.count;
      if (betsScored !== undefined) {
        toast.success(`Scores calculated successfully! ${betsScored} bets scored. Review the results before finalizing.`);
      } else {
        toast.success("Scores calculated successfully! Review the results before finalizing.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to calculate scores");
    } finally {
      setCalculating(false);
    }
  }

  // Save and finalize match
  async function handleSaveAndFinalize() {
    setSaving(true);
    try {
      const resultsPayload = {
        matchId,
        result: matchResult,
        superOverWinner: matchResult === "SUPER_OVER" ? superOverWinner : null,
        teamAScore,
        teamBScore,
        totalRuns,
        manOfMatch,
        playerStats,
        sideBetAnswers,
        checkpoints: checkpoints.filter((c) => c.triggered).map((c) => c.id),
        finalizedAt: new Date().toISOString(),
      };

      // Save results and mark match as finalized
      await apiSaveMatchResults(matchId, resultsPayload);

      toast.success("Match results saved and finalized!");
    } catch (err) {
      toast.error(err.message || "Failed to save match results");
    } finally {
      setSaving(false);
    }
  }

  // Access control
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
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">Match not found</p>
          <Link to="/schedule" className="text-brand-400 text-sm mt-2 inline-block">
            Back to Schedule
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Match Header */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{
                backgroundColor: match.teamA?.color + "30",
                color: match.teamA?.color,
              }}
            >
              {match.teamA?.shortName}
            </div>
            <span className="text-gray-500 text-sm font-semibold">vs</span>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{
                backgroundColor: match.teamB?.color + "30",
                color: match.teamB?.color,
              }}
            >
              {match.teamB?.shortName}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-gray-400">{formatDate(match.scheduledTime)}</div>
            <div className="text-gray-500 text-xs">{match.venue}</div>
            <div className="text-xs text-gray-600 mt-1">Match ID: {matchId}</div>
          </div>
        </div>
      </div>

      {/* Admin Title */}
      <h1 className="text-xl font-bold text-gray-200 mb-6">Match Results Entry</h1>

      {/* Section 1: Match Result */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">1) Match Result</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Winner Selection */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Match Winner / Result</label>
            <select
              value={matchResult}
              onChange={(e) => setMatchResult(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
            >
              {RESULT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === "TEAM_A"
                    ? `${match.teamA?.shortName || "Team A"} Wins`
                    : opt.value === "TEAM_B"
                    ? `${match.teamB?.shortName || "Team B"} Wins`
                    : opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Super Over Winner (if applicable) */}
          {matchResult === "SUPER_OVER" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Super Over Winner</label>
              <select
                value={superOverWinner}
                onChange={(e) => setSuperOverWinner(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              >
                <option value="">Select Winner</option>
                <option value={match.teamA?.teamId}>{match.teamA?.shortName}</option>
                <option value={match.teamB?.teamId}>{match.teamB?.shortName}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Team Scores */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">2) Team Scores</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team A Score */}
          <div className="p-4 rounded-lg border border-gray-700" style={{ backgroundColor: match.teamA?.color + "10" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: match.teamA?.color }}>
              {match.teamA?.shortName || "Team A"}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Runs</label>
                <input
                  type="number"
                  min="0"
                  value={teamAScore.runs}
                  onChange={(e) => setTeamAScore((prev) => ({ ...prev, runs: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Wickets</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={teamAScore.wickets}
                  onChange={(e) => setTeamAScore((prev) => ({ ...prev, wickets: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Overs</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={teamAScore.overs}
                  onChange={(e) => setTeamAScore((prev) => ({ ...prev, overs: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Team B Score */}
          <div className="p-4 rounded-lg border border-gray-700" style={{ backgroundColor: match.teamB?.color + "10" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: match.teamB?.color }}>
              {match.teamB?.shortName || "Team B"}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Runs</label>
                <input
                  type="number"
                  min="0"
                  value={teamBScore.runs}
                  onChange={(e) => setTeamBScore((prev) => ({ ...prev, runs: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Wickets</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={teamBScore.wickets}
                  onChange={(e) => setTeamBScore((prev) => ({ ...prev, wickets: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Overs</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={teamBScore.overs}
                  onChange={(e) => setTeamBScore((prev) => ({ ...prev, overs: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Total Runs (auto-calculated) */}
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Runs (Auto-calculated)</span>
            <span className="text-xl font-bold text-brand-400">{totalRuns}</span>
          </div>
        </div>
      </div>

      {/* Section 3: Man of the Match */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">3) Man of the Match</h2>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Select Player</label>
          <select
            value={manOfMatch}
            onChange={(e) => setManOfMatch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
          >
            <option value="">Select Man of the Match</option>
            {allPlayers.map((p) => (
              <option key={p.playerId} value={p.playerId}>
                {p.playerName} ({p.teamName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 4: Player Stats Entry */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">4) Player Stats</h2>
          <button
            onClick={handleAddPlayer}
            className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            + Add Player
          </button>
        </div>

        {playerStats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No player stats added yet</p>
            <p className="text-gray-600 text-sm mt-1">Click "Add Player" to enter individual performance stats.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {playerStats.map((stats, index) => (
              <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 mr-4">
                    <select
                      value={stats.playerId}
                      onChange={(e) => handleSelectPlayer(index, e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                    >
                      <option value="">Select Player</option>
                      {allPlayers.map((p) => (
                        <option key={p.playerId} value={p.playerId}>
                          {p.playerName} ({p.teamName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleRemovePlayer(index)}
                    className="p-2 text-red-400 hover:bg-red-900/30 rounded"
                    title="Remove Player"
                  >
                    X
                  </button>
                </div>

                {/* Batting Stats */}
                <div className="mb-3">
                  <h4 className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Batting</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Runs</label>
                      <input
                        type="number"
                        min="0"
                        value={stats.runs}
                        onChange={(e) => handleUpdatePlayerStats(index, "runs", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Balls</label>
                      <input
                        type="number"
                        min="0"
                        value={stats.balls}
                        onChange={(e) => handleUpdatePlayerStats(index, "balls", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">4s</label>
                      <input
                        type="number"
                        min="0"
                        value={stats.fours}
                        onChange={(e) => handleUpdatePlayerStats(index, "fours", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">6s</label>
                      <input
                        type="number"
                        min="0"
                        value={stats.sixes}
                        onChange={(e) => handleUpdatePlayerStats(index, "sixes", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Bowling Stats */}
                <div className="mb-3">
                  <h4 className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Bowling</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Wickets</label>
                      <input
                        type="number"
                        min="0"
                        value={stats.wickets}
                        onChange={(e) => handleUpdatePlayerStats(index, "wickets", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Overs</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={stats.overs}
                        onChange={(e) => handleUpdatePlayerStats(index, "overs", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Runs Given</label>
                      <input
                        type="number"
                        min="0"
                        value={stats.runsConceded}
                        onChange={(e) => handleUpdatePlayerStats(index, "runsConceded", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Fielding Stats */}
                <div>
                  <h4 className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Fielding</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Catches</label>
                      <input
                        type="number"
                        min="0"
                        value={stats.catches}
                        onChange={(e) => handleUpdatePlayerStats(index, "catches", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Run Outs</label>
                      <input
                        type="number"
                        min="0"
                        value={stats.runOuts}
                        onChange={(e) => handleUpdatePlayerStats(index, "runOuts", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Stumpings</label>
                      <input
                        type="number"
                        min="0"
                        value={stats.stumpings}
                        onChange={(e) => handleUpdatePlayerStats(index, "stumpings", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Side Bet Answers */}
      {sideBetQuestions.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">5) Side Bet Answers</h2>

          <div className="space-y-4">
            {sideBetQuestions.map((q) => (
              <div key={q.questionId} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-200 mb-2">{q.text}</div>
                <div className="text-xs text-gray-500 mb-2">Points: {q.points}</div>

                {q.type === "YES_NO" || q.type === "MULTI_CHOICE" ? (
                  <select
                    value={sideBetAnswers[q.questionId] || ""}
                    onChange={(e) =>
                      setSideBetAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  >
                    <option value="">Select Correct Answer</option>
                    {q.options.map((opt) => (
                      <option key={opt.optionId} value={opt.optionId}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : q.type === "NUMERIC_INPUT" ? (
                  <input
                    type="number"
                    value={sideBetAnswers[q.questionId] || ""}
                    onChange={(e) =>
                      setSideBetAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))
                    }
                    placeholder="Enter correct numeric value"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  />
                ) : q.type === "PLAYER_PICK" ? (
                  <select
                    value={sideBetAnswers[q.questionId] || ""}
                    onChange={(e) =>
                      setSideBetAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  >
                    <option value="">Select Correct Player</option>
                    {allPlayers.map((p) => (
                      <option key={p.playerId} value={p.playerId}>
                        {p.playerName} ({p.teamName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={sideBetAnswers[q.questionId] || ""}
                    onChange={(e) =>
                      setSideBetAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  >
                    <option value="">Select Correct Answer</option>
                    {(q.options || []).map((opt) => (
                      <option key={opt.optionId} value={opt.optionId}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 6: Checkpoint Triggers (for live matches) */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">6) Checkpoint Triggers (Live Match)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Trigger checkpoints to calculate partial scores during live matches.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checkpoints.map((cp) => (
            <div
              key={cp.id}
              className={`p-3 rounded-lg border transition-colors ${
                cp.triggered
                  ? "bg-emerald-900/20 border-emerald-700"
                  : "bg-gray-800/50 border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-200">{cp.label}</div>
                  {cp.triggered && (
                    <div className="text-xs text-emerald-400 mt-1">Triggered</div>
                  )}
                </div>
                <button
                  onClick={() => handleTriggerCheckpoint(cp.id)}
                  disabled={cp.triggered || triggeringCheckpoint === cp.id}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    cp.triggered
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-brand-600 hover:bg-brand-700 text-white"
                  }`}
                >
                  {triggeringCheckpoint === cp.id ? (
                    <Spinner size="sm" className="inline" />
                  ) : cp.triggered ? (
                    "Done"
                  ) : (
                    "Trigger"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleCalculateScores}
            disabled={calculating}
            className="px-6 py-3 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {calculating && <Spinner size="sm" className="inline" />}
            Calculate Scores
          </button>

          <button
            onClick={handleSaveAndFinalize}
            disabled={saving}
            className="btn-primary px-6 py-3 text-sm flex items-center gap-2"
          >
            {saving && <Spinner size="sm" className="inline text-white" />}
            Save &amp; Finalize Match
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        <Link to={`/admin/match/${matchId}`} className="text-brand-400 hover:text-brand-300">
          Back to Match Builder
        </Link>
        <Link to={`/match/${matchId}`} className="text-brand-400 hover:text-brand-300">
          View Match Betting Page
        </Link>
        <Link to="/admin/dashboard" className="text-brand-400 hover:text-brand-300">
          Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
