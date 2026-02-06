import React, { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { apiGetMatch, apiSaveMatchQuestions, apiGetBettingQuestions } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../components/Toast";
import { getAdminEmail } from "../config";
import Spinner from "../components/Spinner";
import {
  generateStandardPack,
  applySideBets,
  loadSideBetLibrary,
  getSideBetLibrary,
  selectTemplates,
  DEFAULT_CONFIG,
} from "../mock/MatchTemplateGenerator";
import { saveMatchConfig, getMatchConfig } from "../mock/QuestionStore";

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMatchBuilder() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [match, setMatch] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Config state
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [customMultipliers, setCustomMultipliers] = useState(false);

  // Side bet library state
  const [library, setLibrary] = useState({ templates: [] });
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [sideBetOverrides, setSideBetOverrides] = useState({});
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);

  const adminEmail = getAdminEmail();
  const isAdmin = user && adminEmail && user.email?.trim().toLowerCase() === adminEmail;

  useEffect(() => {
    Promise.all([
      apiGetMatch(matchId),
      apiGetBettingQuestions(matchId),
      loadSideBetLibrary(),
    ])
      .then(([m, existingQuestions, lib]) => {
        setMatch(m);
        setLibrary(lib);
        if (existingQuestions && existingQuestions.length > 0) {
          setQuestions(existingQuestions);
        }
        // Load saved config if exists
        const savedConfig = getMatchConfig(matchId);
        if (savedConfig) {
          setConfig(savedConfig);
          if (savedConfig.sideBetTemplateIds) {
            setSelectedTemplateIds(savedConfig.sideBetTemplateIds);
          }
          // Check if custom multipliers are used
          if (savedConfig.multiplierPreset?.some((m, i) => m !== 1 || i >= 1)) {
            setCustomMultipliers(true);
          }
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [matchId]);

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

  // Split questions by section
  const standardQuestions = questions.filter((q) => q.section === "STANDARD");
  const sideQuestions = questions.filter((q) => q.section === "SIDE");
  // Legacy questions (no section) for backwards compatibility
  const legacyQuestions = questions.filter((q) => !q.section);

  function updateConfig(field, value) {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }

  function updateMultiplier(index, value) {
    const newPreset = [...config.multiplierPreset];
    while (newPreset.length <= index) newPreset.push(1);
    newPreset[index] = parseFloat(value) || 1;
    updateConfig("multiplierPreset", newPreset);
  }

  function toggleTemplate(templateId) {
    setSelectedTemplateIds((prev) => {
      if (prev.includes(templateId)) {
        return prev.filter((id) => id !== templateId);
      }
      return [...prev, templateId];
    });
  }

  function updateSideBetPoints(templateId, points) {
    setSideBetOverrides((prev) => ({
      ...prev,
      [templateId]: points,
    }));
  }

  async function handleGenerateStandard() {
    if (!match) return;

    setGenerating(true);
    try {
      // Build squads object from match
      const squads = {};
      if (match.squads) {
        for (const s of match.squads) {
          squads[s.teamId] = s.playerIds || s.players || [];
        }
      }

      // Ensure multiplier array length matches slots
      const cfgToUse = { ...config };
      if (cfgToUse.multiplierPreset.length < cfgToUse.playerPickSlots) {
        const diff = cfgToUse.playerPickSlots - cfgToUse.multiplierPreset.length;
        cfgToUse.multiplierPreset = [...cfgToUse.multiplierPreset, ...Array(diff).fill(1)];
      }

      const standardPack = generateStandardPack(match, squads, cfgToUse);

      // Merge: replace STANDARD, keep SIDE and legacy
      const newQuestions = [
        ...standardPack,
        ...sideQuestions,
        ...legacyQuestions,
      ];

      setQuestions(newQuestions);
      toast.success(`Generated ${standardPack.length} standard questions`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddSideBets() {
    if (!match) return;

    setGenerating(true);
    try {
      // Select templates
      const templatesToUse =
        selectedTemplateIds.length > 0
          ? selectTemplates(library, selectedTemplateIds, selectedTemplateIds.length)
          : selectTemplates(library, null, config.sideBetCount);

      if (templatesToUse.length === 0) {
        toast.error("No side bet templates selected or available");
        return;
      }

      const sideBets = applySideBets(
        matchId,
        match,
        templatesToUse,
        templatesToUse.length,
        sideBetOverrides
      );

      // Merge: keep STANDARD and legacy, replace SIDE
      const newQuestions = [
        ...standardQuestions,
        ...legacyQuestions,
        ...sideBets,
      ];

      setQuestions(newQuestions);
      toast.success(`Added ${sideBets.length} side bet questions`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Save config
      const configToSave = {
        ...config,
        sideBetTemplateIds: selectedTemplateIds.length > 0 ? selectedTemplateIds : null,
      };
      saveMatchConfig(matchId, configToSave);

      // Save questions
      await apiSaveMatchQuestions(matchId, questions);
      toast.success(`Saved ${questions.length} questions`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
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
      <h1 className="text-xl font-bold text-gray-200 mb-6">Match Config + Generate</h1>

      {/* Section A: Match Config Panel */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">A) Match Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Winner Points */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Winner Points (X)</label>
            <input
              type="number"
              value={config.winnerPointsX}
              onChange={(e) => updateConfig("winnerPointsX", parseInt(e.target.value, 10) || 10)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
            />
            <p className="text-xs text-gray-600 mt-1">Super Over = 5X</p>
          </div>

          {/* Total Runs Points */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Total Runs Points (X)</label>
            <input
              type="number"
              value={config.totalRunsPointsX}
              onChange={(e) => updateConfig("totalRunsPointsX", parseInt(e.target.value, 10) || 10)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
            />
          </div>

          {/* Player Pick Slots */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Player Pick Slots</label>
            <input
              type="number"
              min="1"
              max="5"
              value={config.playerPickSlots}
              onChange={(e) => updateConfig("playerPickSlots", parseInt(e.target.value, 10) || 1)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
            />
          </div>

          {/* Multiplier Preset */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Multiplier Preset</label>
            <div className="flex items-center gap-2 mb-2">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={!customMultipliers}
                  onChange={(e) => {
                    setCustomMultipliers(!e.target.checked);
                    if (e.target.checked) {
                      updateConfig("multiplierPreset", Array(config.playerPickSlots).fill(1));
                    }
                  }}
                  className="rounded border-gray-600"
                />
                Default 1x (all slots)
              </label>
            </div>
            {customMultipliers && (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: config.playerPickSlots }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">S{i + 1}:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="5"
                      value={config.multiplierPreset[i] || 1}
                      onChange={(e) => updateMultiplier(i, e.target.value)}
                      className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
                    />
                    <span className="text-xs text-gray-500">x</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Runners Toggle */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <label className="flex items-center gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={config.runnersEnabled}
              onChange={(e) => updateConfig("runnersEnabled", e.target.checked)}
              className="rounded border-gray-600 w-5 h-5"
            />
            Enable Runner Bets
          </label>

          {config.runnersEnabled && (
            <div className="mt-3 ml-8 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Runners (R)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={config.runnerConfig.maxRunners}
                  onChange={(e) =>
                    updateConfig("runnerConfig", {
                      ...config.runnerConfig,
                      maxRunners: parseInt(e.target.value, 10) || 2,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Percent (X%)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.runnerConfig.percent}
                  onChange={(e) =>
                    updateConfig("runnerConfig", {
                      ...config.runnerConfig,
                      percent: parseInt(e.target.value, 10) || 10,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* Side Bet Config */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Side Bet Count (min 1)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.sideBetCount}
                onChange={(e) => updateConfig("sideBetCount", Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Side Bet Default Points</label>
              <input
                type="number"
                value={config.sideBetPointsDefault}
                onChange={(e) => updateConfig("sideBetPointsDefault", parseInt(e.target.value, 10) || 10)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              />
              <p className="text-xs text-gray-600 mt-1">Can be overridden per bet (including negative)</p>
            </div>
          </div>
        </div>

        {/* Generate Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleGenerateStandard}
            disabled={generating}
            className="btn-primary px-4 py-2 text-sm"
          >
            {generating ? <Spinner size="sm" className="inline mr-2" /> : null}
            Generate Standard Pack
          </button>
          <button
            onClick={handleAddSideBets}
            disabled={generating}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {generating ? <Spinner size="sm" className="inline mr-2" /> : null}
            Add Side Bets From Library
          </button>
          <button
            onClick={() => setShowLibraryPicker(!showLibraryPicker)}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            {showLibraryPicker ? "Hide" : "Show"} Library Picker
          </button>
        </div>
      </div>

      {/* Section B: Side Bet Library Picker */}
      {showLibraryPicker && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">B) Side Bet Library</h2>
          <p className="text-sm text-gray-500 mb-4">
            Select specific templates or leave unchecked for auto-pick (first {config.sideBetCount}).
            {selectedTemplateIds.length > 0 && (
              <span className="text-brand-400 ml-2">
                {selectedTemplateIds.length} selected
              </span>
            )}
          </p>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {library.templates.map((template) => (
              <div
                key={template.templateId}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedTemplateIds.includes(template.templateId)
                    ? "bg-purple-900/30 border-purple-600"
                    : "bg-gray-800 border-gray-700 hover:border-gray-600"
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTemplateIds.includes(template.templateId)}
                    onChange={() => toggleTemplate(template.templateId)}
                    className="mt-1 rounded border-gray-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-200">{template.text}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        Type: {template.type}
                      </span>
                      <span className="text-xs text-gray-500">|</span>
                      <span className="text-xs text-gray-500">
                        Default: {template.defaultPoints} pts
                      </span>
                      {template.tags?.length > 0 && (
                        <>
                          <span className="text-xs text-gray-500">|</span>
                          <span className="text-xs text-gray-600">
                            {template.tags.join(", ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedTemplateIds.includes(template.templateId) && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Pts:</label>
                      <input
                        type="number"
                        value={sideBetOverrides[template.templateId] ?? template.defaultPoints}
                        onChange={(e) =>
                          updateSideBetPoints(template.templateId, parseInt(e.target.value, 10))
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                      />
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>

          {selectedTemplateIds.length > 0 && (
            <button
              onClick={() => setSelectedTemplateIds([])}
              className="mt-3 text-sm text-gray-400 hover:text-gray-300"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Questions Preview */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Questions Preview</h2>
          <div className="text-sm text-gray-500">
            {standardQuestions.length} Standard + {sideQuestions.length} Side
            {legacyQuestions.length > 0 && ` + ${legacyQuestions.length} Legacy`}
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No questions generated yet</p>
            <p className="text-gray-600 text-sm mt-1">
              Click "Generate Standard Pack" to create standard questions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Standard Questions */}
            {standardQuestions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-brand-400 mb-2">Standard Bets</h3>
                <div className="space-y-2">
                  {standardQuestions.map((q, i) => (
                    <QuestionPreviewCard key={q.questionId} question={q} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Side Questions */}
            {sideQuestions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-purple-400 mb-2">Side Bets</h3>
                <div className="space-y-2">
                  {sideQuestions.map((q, i) => (
                    <QuestionPreviewCard key={q.questionId} question={q} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Legacy Questions */}
            {legacyQuestions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Legacy Questions</h3>
                <div className="space-y-2">
                  {legacyQuestions.map((q, i) => (
                    <QuestionPreviewCard key={q.questionId} question={q} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      {questions.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-lg px-10 py-3"
          >
            {saving ? <Spinner size="sm" className="text-white inline mr-2" /> : null}
            Save All
          </button>
        </div>
      )}

      {/* Back Link */}
      <div className="mt-6 text-center">
        <Link to={`/match/${matchId}`} className="text-brand-400 text-sm">
          View Match Betting Page
        </Link>
      </div>
    </div>
  );
}

function QuestionPreviewCard({ question, index }) {
  const q = question;
  return (
    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm text-gray-200">
            <span className="text-gray-500 mr-2">{index + 1}.</span>
            {q.text}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
            <span className="text-gray-500">Kind: {q.kind}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">Type: {q.type}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">Points: {q.points}</span>
            {q.slot && (
              <>
                <span className="text-gray-600">|</span>
                <span className="text-gray-500">
                  Slot {q.slot.index + 1} ({q.slot.multiplier}x)
                </span>
              </>
            )}
            {q.weight && q.kind === "WINNER" && (
              <>
                <span className="text-gray-600">|</span>
                <span className="text-gray-500">SuperOver: {q.weight}x</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          {q.options.length > 0 && (
            <span className="text-xs text-gray-500">{q.options.length} options</span>
          )}
          {q.type === "NUMERIC_INPUT" && (
            <span className="text-xs text-amber-500">Numeric</span>
          )}
        </div>
      </div>
    </div>
  );
}
