import React, { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useToast } from "../../components/Toast";
import Spinner from "../../components/Spinner";
import AdminNav from "../../components/admin/AdminNav";
import { useMatchConfig } from "../../hooks/useMatchConfig";
import { useAdmin } from "../../hooks/useAdmin";
import { apiGetMatchResults } from "../../api";
import PlayerStatsEntry from "../../components/admin/PlayerStatsEntry";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { CURRENT_TOURNAMENT } from "../../config/tournament";

export default function ScoreMatch() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const { config, sideBets, loading: configLoading } = useMatchConfig(matchId);
  const admin = useAdmin();

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [existingResults, setExistingResults] = useState(null);

  // Form state
  const [winner, setWinner] = useState("");
  const [totalRuns, setTotalRuns] = useState("");
  const [sideBetAnswers, setSideBetAnswers] = useState({});
  const [manOfMatch, setManOfMatch] = useState("");
  const [scored, setScored] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [superOverTeam, setSuperOverTeam] = useState("");

  // Player stats status
  const [playerStatsCount, setPlayerStatsCount] = useState(0);
  const [betCount, setBetCount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(CURRENT_TOURNAMENT.dataFile).then((r) => r.json()),
      apiGetMatchResults(matchId),
    ])
      .then(([tournament, results]) => {
        const m = (tournament.matches || []).find((m) => String(m.match_id) === matchId);
        setMatch(m);

        if (results) {
          setExistingResults(results);
          setWinner(results.winner || "");
          setTotalRuns(String(results.totalRuns || ""));
          setManOfMatch(results.manOfMatch || "");
          if (results.sideBetAnswers) {
            setSideBetAnswers(results.sideBetAnswers);
          }
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [matchId]);

  // Check player stats and bet counts
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    Promise.all([
      supabase.from('player_match_stats').select('stat_id', { count: 'exact', head: true }).eq('match_id', matchId),
      supabase.from('bets').select('bet_id', { count: 'exact', head: true }).eq('match_id', matchId),
    ])
      .then(([statsRes, betsRes]) => {
        setPlayerStatsCount(statsRes.count || 0);
        setBetCount(betsRes.count || 0);
      });
  }, [matchId, scored]);

  async function handleSaveResults() {
    if (!winner) { toast.error("Please set the winner"); return false; }
    if (!totalRuns) { toast.error("Please set total runs"); return false; }
    if (!manOfMatch.trim()) { toast.error("Man of the Match is required"); return false; }

    // Check side bets are answered
    if (sideBets && sideBets.length > 0) {
      const unanswered = sideBets.filter(sb => !sideBetAnswers[sb.sideBetId]);
      if (unanswered.length > 0) {
        toast.error(`Please answer all side bets (${unanswered.length} unanswered)`);
        return false;
      }
    }

    try {
      await admin.setMatchCorrectAnswers(matchId, {
        winner,
        totalRuns: parseInt(totalRuns),
        sideBetAnswers,
        manOfMatch: manOfMatch.trim(),
      });
      setExistingResults({
        winner,
        totalRuns: parseInt(totalRuns),
        manOfMatch: manOfMatch.trim(),
        sideBetAnswers,
        completedAt: new Date().toISOString(),
      });
      toast.success("Match results saved!");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  }

  async function handleTriggerScoring() {
    // Final validation before scoring
    const issues = [];
    if (!winner && !existingResults?.winner) issues.push("Winner not set");
    if (!totalRuns && !existingResults?.totalRuns) issues.push("Total runs not set");
    if (!manOfMatch.trim() && !existingResults?.manOfMatch) issues.push("Man of the Match not set");
    if (playerStatsCount === 0) issues.push("No player stats entered (0 rows in player_match_stats)");
    if (betCount === 0) issues.push("No bets to score");

    if (issues.length > 0) {
      toast.error("Cannot score: " + issues.join(", "));
      return;
    }

    // Confirmation dialog
    if (!window.confirm(
      `Score match ${matchId}?\n\nThis will calculate points for ${betCount} bets.\nResults will be saved automatically before scoring.`
    )) return;

    // Auto-save results before scoring to ensure DB has latest data
    const saveSuccess = await handleSaveResults();
    if (!saveSuccess) {
      toast.error("Failed to save results. Fix errors before scoring.");
      return;
    }

    try {
      const result = await admin.triggerScoring(matchId);
      setScoreResult(result);
      setScored(true);
      toast.success(`Scoring complete! ${result?.betsScored || 0} bets scored.`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="card text-center py-12"><p className="text-red-400">Access Denied</p></div></div>;

  if (loading || configLoading) return <div className="max-w-4xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;

  const teamA = config?.teamA || match?.teams?.[0] || "Team A";
  const teamB = config?.teamB || match?.teams?.[1] || "Team B";

  const resolvedWinnerOptions = [
    { value: `opt_${matchId}_winner_teamA`, label: teamA },
    { value: `opt_${matchId}_winner_teamB`, label: teamB },
    { value: `opt_${matchId}_winner_tie`, label: "TIE" },
    { value: `opt_${matchId}_winner_no_result`, label: "NO RESULT" },
    { value: `opt_${matchId}_winner_super_over`, label: "Super Over" },
  ];
  const winnerLower = winner.toLowerCase();
  const isSuperOverSelected = winnerLower.includes('super_over') || winnerLower.includes('superover');

  // Pre-scoring checklist
  const checks = {
    winner: { label: "Winner", ok: !!(winner || existingResults?.winner) },
    totalRuns: { label: "Total Runs", ok: !!(totalRuns || existingResults?.totalRuns) },
    manOfMatch: { label: "Man of the Match", ok: !!(manOfMatch.trim() || existingResults?.manOfMatch) },
    sideBets: {
      label: "Side Bet Answers",
      ok: !sideBets || sideBets.length === 0 || sideBets.every(sb => sideBetAnswers[sb.sideBetId]),
    },
    playerStats: { label: `Player Stats (${playerStatsCount}/22 rows)`, ok: playerStatsCount > 0 },
    playerStatsComplete: {
      label: playerStatsCount > 0 && playerStatsCount < 22
        ? `Warning: Only ${playerStatsCount}/22 player stats — missing players will score 0`
        : "Player Stats Complete",
      ok: playerStatsCount >= 22 || playerStatsCount === 0,
      isWarning: playerStatsCount > 0 && playerStatsCount < 22,
    },
    bets: { label: `Bets to Score (${betCount})`, ok: betCount > 0 },
  };
  const allChecksOk = Object.values(checks).every(c => c.ok || c.isWarning);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <AdminNav />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Score Match</h1>
          <p className="text-sm text-gray-500">
            {match ? `${match.teams[0]} vs ${match.teams[1]}` : `Match ${matchId}`}
          </p>
        </div>
        <Link to={`/admin/match/${matchId}`} className="text-sm text-gray-400 hover:text-gray-200">Match Config</Link>
      </div>

      {existingResults && (
        <div className="card mb-6 bg-emerald-950/20 border-emerald-800/30">
          <p className="text-emerald-400 font-semibold">Results already entered</p>
          <p className="text-gray-500 text-sm mt-1">Completed at {new Date(existingResults.completedAt).toLocaleString()}</p>
        </div>
      )}

      {/* Step 1: Set Results */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Step 1: Set Match Results</h2>

        <div className="space-y-4">
          {/* Winner */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Match Winner <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {resolvedWinnerOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`px-5 py-3 rounded-xl cursor-pointer border-2 transition-all text-sm font-medium ${
                    winner === opt.value
                      ? opt.label === "Super Over"
                        ? "bg-amber-600/30 border-amber-500 text-amber-200"
                        : "bg-brand-600/30 border-brand-500 text-brand-200"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <input type="radio" name="winner" value={opt.value} checked={winner === opt.value} onChange={() => setWinner(opt.value)} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
            {/* Super Over: pick which team won */}
            {isSuperOverSelected && (
              <div className="mt-3 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30">
                <label className="text-sm font-medium text-amber-300 block mb-2">
                  Which team won the Super Over?
                </label>
                <div className="flex gap-3">
                  {[teamA, teamB].map((team) => (
                    <label
                      key={team}
                      className={`px-4 py-2 rounded-lg cursor-pointer border-2 text-sm font-medium transition-all ${
                        superOverTeam === team
                          ? "bg-amber-600/30 border-amber-500 text-amber-200"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <input type="radio" name="superOverTeam" value={team} checked={superOverTeam === team} onChange={() => setSuperOverTeam(team)} className="sr-only" />
                      {team}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">For reference only. The winner is saved as "Super Over" for scoring (5x multiplier).</p>
              </div>
            )}
          </div>

          {/* Total Runs */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1">
              Total Runs (both teams combined) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={totalRuns}
              onChange={(e) => setTotalRuns(e.target.value)}
              placeholder="e.g., 350"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
            />
          </div>

          {/* Man of Match — REQUIRED */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1">
              Man of the Match <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={manOfMatch}
              onChange={(e) => setManOfMatch(e.target.value)}
              placeholder="Player name (required)..."
              className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600 ${
                !manOfMatch.trim() && (winner || existingResults) ? "border-red-700" : "border-gray-700"
              }`}
            />
            {!manOfMatch.trim() && (winner || existingResults) && (
              <p className="text-xs text-red-400 mt-1">MoM is required — it affects player scoring (+200 bonus)</p>
            )}
          </div>

          {/* Side Bet Answers */}
          {sideBets && sideBets.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-3">
                Side Bet Correct Answers <span className="text-red-400">*</span>
              </label>
              <div className="space-y-3">
                {sideBets.map((sb) => (
                  <div key={sb.sideBetId} className={`p-3 rounded-lg border ${
                    sideBetAnswers[sb.sideBetId] ? "bg-gray-800/50 border-gray-700/50" : "bg-red-950/10 border-red-800/30"
                  }`}>
                    <p className="text-sm text-gray-300 mb-2">{sb.questionText}</p>
                    <div className="flex flex-wrap gap-2">
                      {(sb.options || []).map((opt, i) => {
                        const optValue = typeof opt === "string" ? opt : opt.label || opt.value || opt;
                        return (
                          <label
                            key={i}
                            className={`px-4 py-2 rounded-lg text-sm cursor-pointer border transition-all ${
                              sideBetAnswers[sb.sideBetId] === optValue
                                ? "bg-purple-600/30 border-purple-500 text-purple-200"
                                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`sb_${sb.sideBetId}`}
                              value={optValue}
                              checked={sideBetAnswers[sb.sideBetId] === optValue}
                              onChange={() => setSideBetAnswers((prev) => ({ ...prev, [sb.sideBetId]: optValue }))}
                              className="sr-only"
                            />
                            {optValue}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleSaveResults} disabled={admin.saving} className="btn-primary">
            {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
            Save Results
          </button>
        </div>
      </div>

      {/* Step 2: Player Stats Entry */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Step 2: Player Stats</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter the scorecard for each player who played. Stats determine fantasy points,
          which are multiplied by slot multipliers for user scores.
        </p>

        <PlayerStatsEntry
          matchId={matchId}
          teamA={teamA}
          teamB={teamB}
          manOfMatch={manOfMatch}
          onManOfMatchChange={setManOfMatch}
          onStatsCountChange={setPlayerStatsCount}
          admin={admin}
          toast={toast}
        />
      </div>

      {/* Step 3: Pre-Scoring Checklist & Trigger */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Step 3: Calculate Scores</h2>

        {/* Checklist */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Pre-Scoring Checklist</h3>
          <div className="space-y-2">
            {Object.entries(checks).map(([key, { label, ok, isWarning }]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                {ok ? (
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isWarning ? (
                  <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={ok ? "text-gray-300" : isWarning ? "text-yellow-400 font-medium" : "text-red-400 font-medium"}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {scored && scoreResult && (
          <div className="mb-4 p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
            <p className="text-emerald-400 font-semibold">Scoring Complete!</p>
            <div className="text-sm text-gray-400 mt-2">
              <p>Bets scored: {scoreResult.betsScored}</p>
              <p>Total points awarded: {scoreResult.totalPoints}</p>
            </div>
            <Link
              to={`/admin/match/${matchId}/report`}
              className="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              View Match Report
            </Link>
          </div>
        )}

        <button
          onClick={handleTriggerScoring}
          disabled={admin.saving || !allChecksOk}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
          Calculate All Scores
        </button>

        {!allChecksOk && (
          <p className="text-xs text-red-400 mt-2">
            Resolve all checklist items above before scoring
          </p>
        )}
      </div>
    </div>
  );
}
