import React, { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useToast } from "../../components/Toast";
import Spinner from "../../components/Spinner";
import AdminNav from "../../components/admin/AdminNav";
import PointsInput from "../../components/admin/PointsInput";
import { useAdmin } from "../../hooks/useAdmin";
import { apiGetLongTermConfig, apiGetAllPlayers } from "../../api";
import { utcToIST, istToUTC } from "../../utils/date";
import { TEAM_CODE_TO_ID, TEAM_NAMES } from "../../data/teams";
import { CURRENT_TOURNAMENT } from "../../config/tournament";

const ALL_TEAM_CODES = Object.keys(TEAM_CODE_TO_ID);

export default function LongTermConfig() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const admin = useAdmin();

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState({ orangeCap: "", purpleCap: "" });
  const [scoringResult, setScoringResult] = useState(null);
  const [scoring, setScoring] = useState(false);

  const [form, setForm] = useState({
    eventId: CURRENT_TOURNAMENT.id,
    winnerPoints: 5000,
    finalistPoints: 2000,
    finalFourPoints: 1000,
    orangeCapPoints: 3000,
    purpleCapPoints: 3000,
    lockTime: "",
    isLocked: false,
    changeCostPercent: 10,
    allowChanges: false,
  });

  const [results, setResults] = useState({
    actualWinner: "",
    actualFinalists: [],
    actualFinalFour: [],
    actualOrangeCap: "",
    actualPurpleCap: "",
  });

  useEffect(() => {
    Promise.all([
      apiGetLongTermConfig(CURRENT_TOURNAMENT.id),
      apiGetAllPlayers(CURRENT_TOURNAMENT.id),
    ])
      .then(([cfg, allPlayers]) => {
        if (cfg) {
          setForm({
            eventId: cfg.eventId,
            winnerPoints: cfg.winnerPoints,
            finalistPoints: cfg.finalistPoints,
            finalFourPoints: cfg.finalFourPoints,
            orangeCapPoints: cfg.orangeCapPoints,
            purpleCapPoints: cfg.purpleCapPoints,
            lockTime: cfg.lockTime ? utcToIST(cfg.lockTime) : "",
            isLocked: cfg.isLocked,
            changeCostPercent: cfg.changeCostPercent,
            allowChanges: cfg.allowChanges,
          });
          setResults({
            actualWinner: cfg.actualWinner || "",
            actualFinalists: cfg.actualFinalists || [],
            actualFinalFour: cfg.actualFinalFour || [],
            actualOrangeCap: cfg.actualOrangeCap || "",
            actualPurpleCap: cfg.actualPurpleCap || "",
          });
        }
        setPlayers(allPlayers || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered player lists for search
  const filteredOrangeCap = useMemo(() => {
    if (!playerSearch.orangeCap) return [];
    const q = playerSearch.orangeCap.toLowerCase();
    return players.filter(
      (p) =>
        p.playerName.toLowerCase().includes(q) ||
        (p.teamCode && p.teamCode.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [players, playerSearch.orangeCap]);

  const filteredPurpleCap = useMemo(() => {
    if (!playerSearch.purpleCap) return [];
    const q = playerSearch.purpleCap.toLowerCase();
    return players.filter(
      (p) =>
        p.playerName.toLowerCase().includes(q) ||
        (p.teamCode && p.teamCode.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [players, playerSearch.purpleCap]);

  // Get player name by ID
  function getPlayerName(playerId) {
    if (!playerId) return "";
    const p = players.find((pl) => pl.playerId === playerId);
    return p ? `${p.playerName} (${p.teamCode})` : playerId;
  }

  async function handleSave() {
    try {
      await admin.saveLongTermConfig({
        ...form,
        lockTime: istToUTC(form.lockTime),
      });
      toast.success("Long-term config saved!");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSaveResults() {
    try {
      await admin.saveLongTermConfig({
        ...form,
        lockTime: istToUTC(form.lockTime),
        actualWinner: results.actualWinner || null,
        actualFinalists: results.actualFinalists,
        actualFinalFour: results.actualFinalFour,
        actualOrangeCap: results.actualOrangeCap || null,
        actualPurpleCap: results.actualPurpleCap || null,
      });
      toast.success("Actual results saved!");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleScore() {
    if (!window.confirm(
      "Score all long-term bets? This will add points to the leaderboard. " +
      "Only unscored bets will be processed. This action cannot be easily undone."
    )) return;

    setScoring(true);
    setScoringResult(null);
    try {
      const data = await admin.triggerLongTermScoring(form.eventId);
      setScoringResult(data);
      toast.success(`Scored ${data?.betsScored || 0} long-term bets!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setScoring(false);
    }
  }

  const allResultsSet =
    results.actualWinner &&
    results.actualFinalists.length === 2 &&
    results.actualFinalFour.length === 4 &&
    results.actualOrangeCap &&
    results.actualPurpleCap;

  // Multi-select toggle helper
  function toggleTeam(field, teamCode, maxCount) {
    setResults((prev) => {
      const arr = prev[field] || [];
      if (arr.includes(teamCode)) {
        return { ...prev, [field]: arr.filter((t) => t !== teamCode) };
      }
      if (arr.length >= maxCount) return prev;
      return { ...prev, [field]: [...arr, teamCode] };
    });
  }

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="card text-center py-12"><p className="text-red-400">Access Denied</p></div></div>;

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <AdminNav />
      <h1 className="text-2xl font-bold text-gray-200 mb-6">Long-Term Bets Configuration</h1>

      {/* Point Values */}
      <div className="card space-y-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-200">Point Values</h2>
        <p className="text-sm text-gray-500">These are the points users earn for correct long-term predictions.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PointsInput label="Tournament Winner Points" value={form.winnerPoints} onChange={(v) => setForm({ ...form, winnerPoints: v })} description="Points for correctly predicting the winner" />
          <PointsInput label="Finalist Points (per correct)" value={form.finalistPoints} onChange={(v) => setForm({ ...form, finalistPoints: v })} description="Points per correctly predicted finalist" />
          <PointsInput label="Final Four Points (per correct)" value={form.finalFourPoints} onChange={(v) => setForm({ ...form, finalFourPoints: v })} description="Points per correctly predicted semi-finalist" />
          <PointsInput label="Orange Cap Points" value={form.orangeCapPoints} onChange={(v) => setForm({ ...form, orangeCapPoints: v })} description="Points for correct highest run-scorer" />
          <PointsInput label="Purple Cap Points" value={form.purpleCapPoints} onChange={(v) => setForm({ ...form, purpleCapPoints: v })} description="Points for correct highest wicket-taker" />
        </div>

        <h2 className="text-lg font-semibold text-gray-200 pt-4 border-t border-gray-700">Lock Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1">Lock Time (IST)</label>
            <input
              type="datetime-local"
              value={form.lockTime}
              onChange={(e) => setForm({ ...form, lockTime: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
            />
            <p className="text-xs text-gray-500 mt-1">When predictions lock (Indian Standard Time)</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isLocked}
                onChange={(e) => setForm({ ...form, isLocked: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-brand-600"
              />
              <span className="text-sm text-gray-300">Locked (manual override)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.allowChanges}
                onChange={(e) => setForm({ ...form, allowChanges: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-brand-600"
              />
              <span className="text-sm text-gray-300">Allow paid changes after lock</span>
            </label>
          </div>

          {form.allowChanges && (
            <PointsInput
              label="Change Cost (%)"
              value={form.changeCostPercent}
              onChange={(v) => setForm({ ...form, changeCostPercent: v })}
              step={1}
              min={0}
              max={100}
              description="Percentage of total points deducted per edit"
            />
          )}
        </div>

        <button onClick={handleSave} disabled={admin.saving} className="btn-primary">
          {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
          Save Configuration
        </button>
      </div>

      {/* Actual Results */}
      <div className="card space-y-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-200">Actual Tournament Results</h2>
        <p className="text-sm text-gray-500">Enter the real results after the tournament ends. These are used to score long-term bets.</p>

        {/* Tournament Winner */}
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1">Tournament Winner</label>
          <select
            value={results.actualWinner}
            onChange={(e) => setResults({ ...results, actualWinner: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
          >
            <option value="">-- Select Winner --</option>
            {ALL_TEAM_CODES.map((code) => (
              <option key={code} value={code}>
                {TEAM_NAMES[TEAM_CODE_TO_ID[code]]} ({code})
              </option>
            ))}
          </select>
        </div>

        {/* Finalists (2 teams) */}
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1">
            Finalists ({results.actualFinalists.length}/2 selected)
          </label>
          <p className="text-xs text-gray-500 mb-2">Click teams to toggle selection. Select exactly 2 teams.</p>
          <div className="flex flex-wrap gap-2">
            {ALL_TEAM_CODES.map((code) => {
              const selected = results.actualFinalists.includes(code);
              return (
                <button
                  key={code}
                  onClick={() => toggleTeam("actualFinalists", code, 2)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selected
                      ? "bg-brand-600 text-white border border-brand-500"
                      : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500"
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        </div>

        {/* Final Four (4 teams) */}
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1">
            Final Four / Semi-finalists ({results.actualFinalFour.length}/4 selected)
          </label>
          <p className="text-xs text-gray-500 mb-2">Click teams to toggle selection. Select exactly 4 teams.</p>
          <div className="flex flex-wrap gap-2">
            {ALL_TEAM_CODES.map((code) => {
              const selected = results.actualFinalFour.includes(code);
              return (
                <button
                  key={code}
                  onClick={() => toggleTeam("actualFinalFour", code, 4)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selected
                      ? "bg-purple-600 text-white border border-purple-500"
                      : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500"
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orange Cap */}
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1">Orange Cap (Highest Run-Scorer)</label>
          {results.actualOrangeCap && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-orange-400 font-medium">{getPlayerName(results.actualOrangeCap)}</span>
              <button
                onClick={() => setResults({ ...results, actualOrangeCap: "" })}
                className="text-xs text-gray-500 hover:text-red-400"
              >
                Clear
              </button>
            </div>
          )}
          <input
            type="text"
            placeholder="Search player name..."
            value={playerSearch.orangeCap}
            onChange={(e) => setPlayerSearch({ ...playerSearch, orangeCap: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
          />
          {filteredOrangeCap.length > 0 && (
            <div className="mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
              {filteredOrangeCap.map((p) => (
                <button
                  key={p.playerId}
                  onClick={() => {
                    setResults({ ...results, actualOrangeCap: p.playerId });
                    setPlayerSearch({ ...playerSearch, orangeCap: "" });
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                    results.actualOrangeCap === p.playerId ? "bg-orange-900/30 text-orange-300" : "text-gray-300"
                  }`}
                >
                  {p.playerName} <span className="text-gray-500">({p.teamCode})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purple Cap */}
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1">Purple Cap (Highest Wicket-Taker)</label>
          {results.actualPurpleCap && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-purple-400 font-medium">{getPlayerName(results.actualPurpleCap)}</span>
              <button
                onClick={() => setResults({ ...results, actualPurpleCap: "" })}
                className="text-xs text-gray-500 hover:text-red-400"
              >
                Clear
              </button>
            </div>
          )}
          <input
            type="text"
            placeholder="Search player name..."
            value={playerSearch.purpleCap}
            onChange={(e) => setPlayerSearch({ ...playerSearch, purpleCap: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
          />
          {filteredPurpleCap.length > 0 && (
            <div className="mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
              {filteredPurpleCap.map((p) => (
                <button
                  key={p.playerId}
                  onClick={() => {
                    setResults({ ...results, actualPurpleCap: p.playerId });
                    setPlayerSearch({ ...playerSearch, purpleCap: "" });
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                    results.actualPurpleCap === p.playerId ? "bg-purple-900/30 text-purple-300" : "text-gray-300"
                  }`}
                >
                  {p.playerName} <span className="text-gray-500">({p.teamCode})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSaveResults} disabled={admin.saving} className="btn-primary">
          {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
          Save Results
        </button>
      </div>

      {/* Scoring Section */}
      <div className="card space-y-6">
        <h2 className="text-lg font-semibold text-gray-200">Score Long-Term Bets</h2>

        {!allResultsSet && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg px-4 py-3">
            <p className="text-sm text-yellow-400">
              All actual results must be set before scoring. Missing:{" "}
              {[
                !results.actualWinner && "Winner",
                results.actualFinalists.length !== 2 && "Finalists (need 2)",
                results.actualFinalFour.length !== 4 && "Final Four (need 4)",
                !results.actualOrangeCap && "Orange Cap",
                !results.actualPurpleCap && "Purple Cap",
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}

        {allResultsSet && (
          <div className="bg-gray-800 rounded-lg px-4 py-3 space-y-1">
            <p className="text-sm text-gray-300">
              <span className="text-gray-500">Winner:</span>{" "}
              {TEAM_NAMES[TEAM_CODE_TO_ID[results.actualWinner]]} ({results.actualWinner})
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-gray-500">Finalists:</span>{" "}
              {results.actualFinalists.map((c) => `${TEAM_NAMES[TEAM_CODE_TO_ID[c]]} (${c})`).join(", ")}
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-gray-500">Final Four:</span>{" "}
              {results.actualFinalFour.map((c) => `${TEAM_NAMES[TEAM_CODE_TO_ID[c]]} (${c})`).join(", ")}
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-gray-500">Orange Cap:</span> {getPlayerName(results.actualOrangeCap)}
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-gray-500">Purple Cap:</span> {getPlayerName(results.actualPurpleCap)}
            </p>
          </div>
        )}

        <button
          onClick={handleScore}
          disabled={!allResultsSet || scoring || admin.saving}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
            allResultsSet && !scoring
              ? "bg-green-600 hover:bg-green-500 text-white"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          {scoring ? (
            <>
              <Spinner size="sm" className="inline mr-2" />
              Scoring...
            </>
          ) : (
            "Score All Long-Term Bets"
          )}
        </button>

        {scoringResult && (
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg px-4 py-4 space-y-2">
            <h3 className="text-sm font-semibold text-green-400">Scoring Complete</h3>
            <p className="text-sm text-gray-300">
              Bets scored: <span className="font-bold text-green-300">{scoringResult.betsScored || 0}</span>
            </p>
            <p className="text-sm text-gray-300">
              Total points awarded: <span className="font-bold text-green-300">{scoringResult.totalPoints || 0}</span>
            </p>
            {scoringResult.betsScored === 0 && (
              <p className="text-xs text-yellow-400">
                No unscored bets found. Either no users placed long-term bets, or they have already been scored.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
