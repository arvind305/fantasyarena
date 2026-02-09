import React, { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { getAdminEmail } from "../../config";
import { useToast } from "../../components/Toast";
import Spinner from "../../components/Spinner";
import AdminNav from "../../components/admin/AdminNav";
import { useMatchConfig } from "../../hooks/useMatchConfig";
import { useAdmin } from "../../hooks/useAdmin";
import { apiGetMatchResults } from "../../api";

export default function ScoreMatch() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const adminEmail = getAdminEmail();
  const isAdmin = user && adminEmail && user.email?.trim().toLowerCase() === adminEmail;

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

  useEffect(() => {
    Promise.all([
      fetch("/data/t20wc_2026.json").then((r) => r.json()),
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

  async function handleSaveResults() {
    if (!winner) return toast.error("Please set the winner");
    if (!totalRuns) return toast.error("Please set total runs");

    try {
      await admin.setMatchCorrectAnswers(matchId, {
        winner,
        totalRuns: parseInt(totalRuns),
        sideBetAnswers,
        manOfMatch: manOfMatch || null,
      });
      toast.success("Match results saved!");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleTriggerScoring() {
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
            <label className="text-sm font-medium text-gray-300 block mb-2">Match Winner</label>
            <div className="flex flex-wrap gap-3">
              {[teamA, teamB, "TIE", "NO_RESULT"].map((opt) => (
                <label
                  key={opt}
                  className={`px-5 py-3 rounded-xl cursor-pointer border-2 transition-all text-sm font-medium ${
                    winner === opt
                      ? "bg-brand-600/30 border-brand-500 text-brand-200"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <input type="radio" name="winner" value={opt} checked={winner === opt} onChange={() => setWinner(opt)} className="sr-only" />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Total Runs */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1">Total Runs (both teams combined)</label>
            <input
              type="number"
              value={totalRuns}
              onChange={(e) => setTotalRuns(e.target.value)}
              placeholder="e.g., 350"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
            />
          </div>

          {/* Man of Match */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1">Man of the Match (optional)</label>
            <input
              type="text"
              value={manOfMatch}
              onChange={(e) => setManOfMatch(e.target.value)}
              placeholder="Player name..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
            />
          </div>

          {/* Side Bet Answers */}
          {sideBets && sideBets.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-3">Side Bet Correct Answers</label>
              <div className="space-y-3">
                {sideBets.map((sb) => (
                  <div key={sb.sideBetId} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
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

      {/* Step 2: Trigger Scoring */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Step 2: Calculate Scores</h2>
        <p className="text-sm text-gray-500 mb-4">
          This will calculate scores for all bets on this match using the results above,
          player fantasy points, side bet answers, and runner picks.
        </p>

        {scored && scoreResult && (
          <div className="mb-4 p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
            <p className="text-emerald-400 font-semibold">Scoring Complete!</p>
            <div className="text-sm text-gray-400 mt-2">
              <p>Bets scored: {scoreResult.betsScored}</p>
              <p>Total points awarded: {scoreResult.totalPoints}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleTriggerScoring}
          disabled={admin.saving || (!existingResults && !winner)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
          Calculate All Scores
        </button>

        {!existingResults && !winner && (
          <p className="text-xs text-red-400 mt-2">Save results first before scoring</p>
        )}
      </div>
    </div>
  );
}
