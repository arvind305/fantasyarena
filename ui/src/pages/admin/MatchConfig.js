import React, { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { getAdminEmail } from "../../config";
import { useToast } from "../../components/Toast";
import Spinner from "../../components/Spinner";
import AdminNav from "../../components/admin/AdminNav";
import PointsInput from "../../components/admin/PointsInput";
import PlayerStatsForm from "../../components/admin/PlayerStatsForm";
import { useMatchConfig } from "../../hooks/useMatchConfig";
import { useAdmin } from "../../hooks/useAdmin";
import { apiGetSquadPlayers } from "../../api";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export default function MatchConfig() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const adminEmail = getAdminEmail();
  const isAdmin = user && adminEmail && user.email?.trim().toLowerCase() === adminEmail;

  const { config, slots, sideBets, loading: configLoading, refetch } = useMatchConfig(matchId);
  const admin = useAdmin();

  const [activeTab, setActiveTab] = useState("basic");
  const [match, setMatch] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(true);

  // Form state
  const [form, setForm] = useState({
    winnerBasePoints: 1000,
    superOverMultiplier: 5,
    totalRunsBasePoints: 1000,
    playerSlotsEnabled: true,
    playerSlotCount: 3,
    runnersEnabled: false,
    runnerCount: 0,
    lockTime: "",
    teamA: "",
    teamB: "",
    status: "DRAFT",
  });

  const [slotsForm, setSlotsForm] = useState([
    { slotNumber: 1, multiplier: 100, isEnabled: true },
    { slotNumber: 2, multiplier: 70, isEnabled: true },
    { slotNumber: 3, multiplier: 40, isEnabled: true },
  ]);

  const [sideBetsForm, setSideBetsForm] = useState([]);
  const [sideBetTemplates, setSideBetTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [playerStats, setPlayerStats] = useState({});
  const [teamPlayers, setTeamPlayers] = useState({ teamA: [], teamB: [] });

  // Load match data
  useEffect(() => {
    fetch("/data/t20wc_2026.json")
      .then((r) => r.json())
      .then((tournament) => {
        const m = (tournament.matches || []).find(
          (m) => String(m.match_id) === matchId
        );
        setMatch(m);
        if (m) {
          setForm((prev) => ({
            ...prev,
            teamA: m.teams[0],
            teamB: m.teams[1],
            lockTime: `${m.date}T${m.time_gmt}`,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMatch(false));
  }, [matchId]);

  // Populate form from existing config
  useEffect(() => {
    if (config) {
      setForm({
        winnerBasePoints: config.winnerBasePoints,
        superOverMultiplier: config.superOverMultiplier,
        totalRunsBasePoints: config.totalRunsBasePoints,
        playerSlotsEnabled: config.playerSlotsEnabled,
        playerSlotCount: config.playerSlotCount,
        runnersEnabled: config.runnersEnabled,
        runnerCount: config.runnerCount,
        lockTime: config.lockTime ? config.lockTime.replace("Z", "").split(".")[0] : "",
        teamA: config.teamA || form.teamA,
        teamB: config.teamB || form.teamB,
        status: config.status,
      });
    }
    if (slots && slots.length > 0) {
      setSlotsForm(slots.map((s) => ({ slotNumber: s.slotNumber, multiplier: s.multiplier, isEnabled: s.isEnabled })));
    }
    if (sideBets && sideBets.length > 0) {
      setSideBetsForm(sideBets.map((sb) => ({
        sideBetId: sb.sideBetId,
        questionText: sb.questionText,
        options: sb.options,
        pointsCorrect: sb.pointsCorrect,
        pointsWrong: sb.pointsWrong,
        correctAnswer: sb.correctAnswer,
        status: sb.status,
      })));
    }
  }, [config, slots, sideBets]);

  // Load side bet templates
  useEffect(() => {
    if (activeTab === "sidebets" && sideBetTemplates.length === 0) {
      fetch("/data/side-bet-templates.json")
        .then((r) => r.json())
        .then((data) => setSideBetTemplates(data.templates || []))
        .catch(() => {});
    }
  }, [activeTab, sideBetTemplates.length]);

  // Load players for stats tab
  useEffect(() => {
    if (activeTab === "stats" && form.teamA && form.teamB) {
      Promise.all([
        apiGetSquadPlayers(form.teamA),
        apiGetSquadPlayers(form.teamB),
      ]).then(([a, b]) => {
        setTeamPlayers({ teamA: a, teamB: b });
      });

      // Load existing stats
      if (supabase && isSupabaseConfigured()) {
        supabase
          .from("player_match_stats")
          .select("*")
          .eq("match_id", matchId)
          .then(({ data }) => {
            if (data) {
              const statsMap = {};
              data.forEach((s) => {
                statsMap[s.player_id] = {
                  runs: s.runs,
                  balls_faced: s.balls_faced,
                  fours: s.fours,
                  sixes: s.sixes,
                  wickets: s.wickets,
                  overs_bowled: parseFloat(s.overs_bowled),
                  runs_conceded: s.runs_conceded,
                  catches: s.catches,
                  run_outs: s.run_outs,
                  stumpings: s.stumpings,
                  is_man_of_match: s.is_man_of_match,
                  has_century: s.has_century,
                  has_five_wicket_haul: s.has_five_wicket_haul,
                  has_hat_trick: s.has_hat_trick,
                };
              });
              setPlayerStats(statsMap);
            }
          });
      }
    }
  }, [activeTab, form.teamA, form.teamB, matchId]);

  // Handlers
  async function handleSaveBasic() {
    try {
      await admin.saveMatchConfig(matchId, { ...form, eventId: "t20wc_2026" });
      toast.success("Match config saved!");
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSaveSlots() {
    try {
      await admin.savePlayerSlots(matchId, slotsForm);
      toast.success("Player slots saved!");
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSaveSideBets() {
    try {
      await admin.saveSideBets(matchId, sideBetsForm);
      toast.success("Side bets saved!");
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSaveStats() {
    try {
      await admin.savePlayerStats(matchId, playerStats);
      const result = await admin.calculatePlayerPoints(matchId);
      toast.success(`Player stats saved! ${result?.playersScored || 0} players scored.`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSaveRunners() {
    try {
      await admin.saveMatchConfig(matchId, { ...form, eventId: "t20wc_2026" });
      toast.success("Runner settings saved!");
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Slot management
  function addSlot() {
    const next = slotsForm.length + 1;
    setSlotsForm([...slotsForm, { slotNumber: next, multiplier: 30, isEnabled: true }]);
    setForm((prev) => ({ ...prev, playerSlotCount: next }));
  }

  function removeSlot(index) {
    const updated = slotsForm.filter((_, i) => i !== index).map((s, i) => ({ ...s, slotNumber: i + 1 }));
    setSlotsForm(updated);
    setForm((prev) => ({ ...prev, playerSlotCount: updated.length }));
  }

  // Side bet management
  function addSideBet() {
    setSideBetsForm([...sideBetsForm, {
      questionText: "",
      options: ["Yes", "No"],
      pointsCorrect: 500,
      pointsWrong: 0,
      correctAnswer: null,
      status: "OPEN",
    }]);
  }

  function removeSideBet(index) {
    setSideBetsForm(sideBetsForm.filter((_, i) => i !== index));
  }

  function updateSideBet(index, field, value) {
    setSideBetsForm((prev) => prev.map((sb, i) => i === index ? { ...sb, [field]: value } : sb));
  }

  function addFromTemplate(template) {
    setSideBetsForm((prev) => [...prev, {
      questionText: template.question_text,
      options: template.options,
      pointsCorrect: template.suggested_points_correct,
      pointsWrong: template.suggested_points_wrong,
      correctAnswer: null,
      status: "OPEN",
    }]);
    setShowTemplates(false);
  }

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="card text-center py-12"><p className="text-red-400">Access Denied</p></div></div>;

  if (loadingMatch || configLoading) return <div className="max-w-6xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;

  const tabs = [
    { key: "basic", label: "Basic Settings" },
    { key: "slots", label: "Player Slots" },
    { key: "sidebets", label: "Side Bets" },
    { key: "runners", label: "Runners" },
    { key: "stats", label: "Player Stats" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <AdminNav />

      {/* Match header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">
            {match ? `${match.teams[0]} vs ${match.teams[1]}` : `Match ${matchId}`}
          </h1>
          <p className="text-sm text-gray-500">
            Match #{matchId}
            {match && ` - ${new Date(`${match.date}T${match.time_gmt}:00Z`).toLocaleString()}`}
          </p>
        </div>
        <Link to="/admin/matches" className="text-sm text-gray-400 hover:text-gray-200">Back to Matches</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-gray-800 text-brand-300 border border-gray-700 border-b-gray-800 -mb-px"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        {/* Basic Settings */}
        {activeTab === "basic" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-200">Basic Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PointsInput label="Winner Base Points" value={form.winnerBasePoints} onChange={(v) => setForm({ ...form, winnerBasePoints: v })} description="Points for correctly predicting the winner" />
              <PointsInput label="Super Over Multiplier" value={form.superOverMultiplier} onChange={(v) => setForm({ ...form, superOverMultiplier: v })} step={0.5} description="Multiplier applied if Super Over predicted correctly" />
              <PointsInput label="Total Runs Base Points" value={form.totalRunsBasePoints} onChange={(v) => setForm({ ...form, totalRunsBasePoints: v })} description="Base points for total runs (multiplied by tier)" />
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1">Lock Time</label>
                <input
                  type="datetime-local"
                  value={form.lockTime}
                  onChange={(e) => setForm({ ...form, lockTime: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
                />
                <p className="text-xs text-gray-500 mt-1">When betting closes for this match</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open</option>
                  <option value="LOCKED">Locked</option>
                  <option value="SCORED">Scored</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1">Team A</label>
                <input type="text" value={form.teamA} onChange={(e) => setForm({ ...form, teamA: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1">Team B</label>
                <input type="text" value={form.teamB} onChange={(e) => setForm({ ...form, teamB: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
              </div>
            </div>
            <button onClick={handleSaveBasic} disabled={admin.saving} className="btn-primary">
              {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
              Save Basic Settings
            </button>
          </div>
        )}

        {/* Player Slots */}
        {activeTab === "slots" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-200">Player Slots</h2>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.playerSlotsEnabled}
                  onChange={(e) => setForm({ ...form, playerSlotsEnabled: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-brand-600"
                />
                <span className="text-sm text-gray-400">Enabled</span>
              </label>
            </div>

            {form.playerSlotsEnabled && (
              <>
                <div className="space-y-3">
                  {slotsForm.map((slot, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                      <span className="text-sm font-medium text-gray-300 w-16">Slot {slot.slotNumber}</span>
                      <div className="flex-1">
                        <PointsInput
                          label=""
                          value={slot.multiplier}
                          onChange={(v) => {
                            const updated = [...slotsForm];
                            updated[i] = { ...updated[i], multiplier: v };
                            setSlotsForm(updated);
                          }}
                          step={1}
                          description={`${slot.multiplier}x multiplier`}
                        />
                      </div>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={slot.isEnabled}
                          onChange={(e) => {
                            const updated = [...slotsForm];
                            updated[i] = { ...updated[i], isEnabled: e.target.checked };
                            setSlotsForm(updated);
                          }}
                          className="rounded border-gray-600 bg-gray-800 text-brand-600"
                        />
                        <span className="text-xs text-gray-400">Active</span>
                      </label>
                      <button onClick={() => removeSlot(i)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1">Remove</button>
                    </div>
                  ))}
                </div>
                <button onClick={addSlot} className="btn-secondary text-sm">+ Add Slot</button>
              </>
            )}

            <button onClick={handleSaveSlots} disabled={admin.saving} className="btn-primary">
              {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
              Save Player Slots
            </button>
          </div>
        )}

        {/* Side Bets */}
        {activeTab === "sidebets" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-200">Side Bets</h2>
              <span className="text-sm text-gray-500">{sideBetsForm.length} question(s)</span>
            </div>

            <div className="space-y-4">
              {sideBetsForm.map((sb, i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-purple-400">Side Bet {i + 1}</span>
                    <button onClick={() => removeSideBet(i)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Question</label>
                      <input
                        type="text"
                        value={sb.questionText}
                        onChange={(e) => updateSideBet(i, "questionText", e.target.value)}
                        placeholder="e.g., Will there be a century in this match?"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Options (comma-separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(sb.options) ? sb.options.map(o => typeof o === 'string' ? o : o.label || o.value || '').join(", ") : ""}
                        onChange={(e) => updateSideBet(i, "options", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                        placeholder="Yes, No"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <PointsInput label="Points (Correct)" value={sb.pointsCorrect} onChange={(v) => updateSideBet(i, "pointsCorrect", v)} />
                      <PointsInput label="Points (Wrong)" value={sb.pointsWrong} onChange={(v) => updateSideBet(i, "pointsWrong", v)} description="Can be negative" />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Correct Answer (leave empty until match ends)</label>
                      <input
                        type="text"
                        value={sb.correctAnswer || ""}
                        onChange={(e) => updateSideBet(i, "correctAnswer", e.target.value || null)}
                        placeholder="Set after match..."
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={addSideBet} className="btn-secondary text-sm">+ Add Blank</button>
              <button onClick={() => setShowTemplates(!showTemplates)} className="btn-secondary text-sm bg-purple-900/30 border-purple-700/50 text-purple-300 hover:bg-purple-900/50">
                {showTemplates ? "Hide Templates" : "Pick from Template Bank"}
              </button>
            </div>

            {/* Template Bank Picker */}
            {showTemplates && sideBetTemplates.length > 0 && (
              <div className="p-4 rounded-xl bg-gray-800/70 border border-purple-700/30 max-h-80 overflow-y-auto">
                <p className="text-xs text-gray-400 mb-3">Click a template to add it as a side bet. Points can be adjusted after adding.</p>
                {(() => {
                  const categories = [...new Set(sideBetTemplates.map((t) => t.category))];
                  return categories.map((cat) => (
                    <div key={cat} className="mb-3">
                      <p className="text-xs font-semibold text-purple-400 mb-1.5">{cat}</p>
                      <div className="space-y-1.5">
                        {sideBetTemplates.filter((t) => t.category === cat).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => addFromTemplate(t)}
                            className="w-full text-left p-2.5 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-700/50 hover:border-purple-600/50 transition-colors"
                          >
                            <p className="text-sm text-gray-200">{t.question_text}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Options: {t.options.join(", ")} | +{t.suggested_points_correct}pts correct
                              {t.suggested_points_wrong !== 0 && ` / ${t.suggested_points_wrong}pts wrong`}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            <button onClick={handleSaveSideBets} disabled={admin.saving} className="btn-primary">
              {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
              Save Side Bets
            </button>
          </div>
        )}

        {/* Runners */}
        {activeTab === "runners" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-200">Runner Settings</h2>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.runnersEnabled}
                onChange={(e) => setForm({ ...form, runnersEnabled: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-brand-600"
              />
              <span className="text-sm text-gray-300">Enable runners for this match</span>
            </label>

            {form.runnersEnabled && (
              <PointsInput
                label="Max Runners"
                value={form.runnerCount}
                onChange={(v) => setForm({ ...form, runnerCount: v })}
                min={0}
                max={5}
                description="Number of runners each user can pick"
              />
            )}

            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <p className="text-xs text-gray-400">
                When runners are enabled, each user can pick other users. If their runner also bets on this match,
                the runner's match score is added to the picker's total.
              </p>
            </div>

            <button onClick={handleSaveRunners} disabled={admin.saving} className="btn-primary">
              {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
              Save Runner Settings
            </button>
          </div>
        )}

        {/* Player Stats */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-200">Player Match Stats</h2>
            <p className="text-sm text-gray-500">
              Enter stats for players who participated in this match. Fantasy points auto-calculate.
            </p>

            {form.teamA && teamPlayers.teamA.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-300 mb-3">{form.teamA}</h3>
                <PlayerStatsForm
                  players={teamPlayers.teamA}
                  stats={playerStats}
                  setStats={setPlayerStats}
                />
              </div>
            )}

            {form.teamB && teamPlayers.teamB.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-300 mb-3">{form.teamB}</h3>
                <PlayerStatsForm
                  players={teamPlayers.teamB}
                  stats={playerStats}
                  setStats={setPlayerStats}
                />
              </div>
            )}

            {teamPlayers.teamA.length === 0 && teamPlayers.teamB.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No players loaded. Make sure teams are set in Basic Settings and squads are seeded.
              </div>
            )}

            <button onClick={handleSaveStats} disabled={admin.saving} className="btn-primary">
              {admin.saving ? <Spinner size="sm" className="inline mr-2" /> : null}
              Save Stats & Calculate Fantasy Points
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
