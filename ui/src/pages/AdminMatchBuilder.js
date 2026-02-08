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
  preloadGeneratorData,
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

// Chaos mode presets with high multipliers and negative scoring
const CHAOS_PRESETS = {
  mild: {
    name: "Mild Chaos",
    description: "2x multipliers, no negative scoring",
    winnerPointsX: 20,
    totalRunsPointsX: 20,
    playerPickSlots: 3,
    multiplierPreset: [1, 1.5, 2],
    sideBetPointsDefault: 20,
    enableNegativeScoring: false,
  },
  wild: {
    name: "Wild Chaos",
    description: "5x multipliers, -50% penalty for wrong answers",
    winnerPointsX: 50,
    totalRunsPointsX: 50,
    playerPickSlots: 5,
    multiplierPreset: [1, 2, 3, 4, 5],
    sideBetPointsDefault: 50,
    sideBetPointsWrong: -25,
    enableNegativeScoring: true,
  },
  extreme: {
    name: "Extreme Chaos",
    description: "10x+ multipliers, full negative scoring",
    winnerPointsX: 100,
    totalRunsPointsX: 100,
    playerPickSlots: 5,
    multiplierPreset: [2, 4, 6, 8, 10],
    sideBetPointsDefault: 100,
    sideBetPointsWrong: -100,
    enableNegativeScoring: true,
  },
  allOrNothing: {
    name: "All or Nothing",
    description: "1000 pts if all correct, 0 otherwise",
    winnerPointsX: 1000,
    totalRunsPointsX: 1000,
    playerPickSlots: 1,
    multiplierPreset: [1],
    sideBetPointsDefault: 1000,
    sideBetPointsWrong: -1000,
    enableNegativeScoring: true,
    allOrNothing: true,
  },
};

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

  // Custom question builder state
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customQuestion, setCustomQuestion] = useState({
    text: "",
    type: "YES_NO",
    kind: "SIDE_BET",
    section: "SIDE",
    points: 10,
    pointsWrong: 0,
    options: [
      { label: "Yes", optionId: "" },
      { label: "No", optionId: "" },
    ],
  });

  // Question editing state
  const [editingQuestionId, setEditingQuestionId] = useState(null);

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

  // Apply chaos mode preset
  function applyChaosPreset(presetKey) {
    const preset = CHAOS_PRESETS[presetKey];
    if (!preset) return;
    setConfig((prev) => ({
      ...prev,
      winnerPointsX: preset.winnerPointsX,
      totalRunsPointsX: preset.totalRunsPointsX,
      playerPickSlots: preset.playerPickSlots,
      multiplierPreset: [...preset.multiplierPreset],
      sideBetPointsDefault: preset.sideBetPointsDefault,
      enableNegativeScoring: preset.enableNegativeScoring,
      sideBetPointsWrong: preset.sideBetPointsWrong || 0,
      allOrNothing: preset.allOrNothing || false,
    }));
    setCustomMultipliers(true);
    toast.success(`Applied "${preset.name}" preset`);
  }

  // Add custom question
  function handleAddCustomQuestion() {
    if (!customQuestion.text.trim()) {
      toast.error("Question text is required");
      return;
    }

    const now = new Date().toISOString();
    const questionId = "q_custom_" + Math.random().toString(36).slice(2, 10);

    // Generate option IDs
    const processedOptions = customQuestion.options.map((opt, i) => ({
      ...opt,
      optionId: `opt_${questionId}_${i}`,
      referenceType: "NONE",
      referenceId: null,
    }));

    const newQuestion = {
      questionId,
      matchId,
      eventId: match?.eventId,
      section: customQuestion.section,
      kind: customQuestion.kind,
      type: customQuestion.type,
      text: customQuestion.text,
      points: customQuestion.points,
      pointsWrong: customQuestion.pointsWrong,
      options: processedOptions,
      createdAt: now,
      isCustom: true,
    };

    setQuestions((prev) => [...prev, newQuestion]);
    toast.success("Custom question added");

    // Reset form
    setCustomQuestion({
      text: "",
      type: "YES_NO",
      kind: "SIDE_BET",
      section: "SIDE",
      points: 10,
      pointsWrong: 0,
      options: [
        { label: "Yes", optionId: "" },
        { label: "No", optionId: "" },
      ],
    });
    setShowCustomBuilder(false);
  }

  // Delete question
  function handleDeleteQuestion(questionId) {
    setQuestions((prev) => prev.filter((q) => q.questionId !== questionId));
    toast.success("Question removed");
  }

  // Toggle question enabled/disabled
  function handleToggleQuestion(questionId) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.questionId === questionId ? { ...q, disabled: !q.disabled } : q
      )
    );
  }

  // Update question points
  function handleUpdateQuestionPoints(questionId, points, pointsWrong) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.questionId === questionId
          ? { ...q, points: points ?? q.points, pointsWrong: pointsWrong ?? q.pointsWrong }
          : q
      )
    );
  }

  // Move question up/down
  function handleMoveQuestion(questionId, direction) {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.questionId === questionId);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;

      const newQuestions = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newQuestions[idx], newQuestions[swapIdx]] = [newQuestions[swapIdx], newQuestions[idx]];
      return newQuestions;
    });
  }

  // Update custom question option
  function updateCustomOption(index, label) {
    setCustomQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? { ...opt, label } : opt)),
    }));
  }

  // Add option to custom question
  function addCustomOption() {
    setCustomQuestion((prev) => ({
      ...prev,
      options: [...prev.options, { label: "", optionId: "" }],
    }));
  }

  // Remove option from custom question
  function removeCustomOption(index) {
    if (customQuestion.options.length <= 2) {
      toast.error("Minimum 2 options required");
      return;
    }
    setCustomQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }

  async function handleGenerateStandard() {
    if (!match) return;

    setGenerating(true);
    try {
      // Preload squads and players data for PLAYER_PICK options
      await preloadGeneratorData();

      // Build squads object from match (fallback to squads.json happens in generator)
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
      // Select templates - no limit on number of side bets
      let templatesToUse =
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

      {/* Chaos Mode Presets */}
      <div className="card mb-6 bg-gradient-to-r from-red-950/30 to-orange-950/30 border-red-800/50">
        <h2 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
          <span>🔥</span> Chaos Mode Presets
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Quick presets for high-stakes matches with multipliers and risk/reward mechanics.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(CHAOS_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyChaosPreset(key)}
              className="p-3 rounded-lg border border-red-700/50 bg-red-900/20 hover:bg-red-900/40 transition-colors text-left"
            >
              <div className="text-sm font-semibold text-red-300">{preset.name}</div>
              <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

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
              max="20"
              value={config.playerPickSlots}
              onChange={(e) => updateConfig("playerPickSlots", parseInt(e.target.value, 10) || 1)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
            />
            <p className="text-xs text-gray-600 mt-1">Unlimited slots supported</p>
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
              <label className="block text-xs text-gray-500 mb-1">Side Bet Count</label>
              <input
                type="number"
                min="0"
                max="50"
                value={config.sideBetCount}
                onChange={(e) => updateConfig("sideBetCount", Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              />
              <p className="text-xs text-gray-600 mt-1">0 = no side bets required</p>
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
          <button
            onClick={() => setShowCustomBuilder(!showCustomBuilder)}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            {showCustomBuilder ? "Hide" : "Add"} Custom Question
          </button>
        </div>
      </div>

      {/* Custom Question Builder */}
      {showCustomBuilder && (
        <div className="card mb-6 border-emerald-700/50">
          <h2 className="text-lg font-semibold text-emerald-400 mb-4">Custom Question Builder</h2>

          <div className="space-y-4">
            {/* Question Text */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Question Text *</label>
              <input
                type="text"
                value={customQuestion.text}
                onChange={(e) => setCustomQuestion((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="e.g., Will there be a century scored in this match?"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Question Type */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={customQuestion.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    let options = customQuestion.options;
                    if (type === "YES_NO") {
                      options = [{ label: "Yes", optionId: "" }, { label: "No", optionId: "" }];
                    }
                    setCustomQuestion((prev) => ({ ...prev, type, options }));
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                >
                  <option value="YES_NO">Yes/No</option>
                  <option value="MULTI_CHOICE">Multiple Choice</option>
                  <option value="NUMERIC_INPUT">Numeric Input</option>
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Section</label>
                <select
                  value={customQuestion.section}
                  onChange={(e) => setCustomQuestion((prev) => ({ ...prev, section: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                >
                  <option value="SIDE">Side Bet</option>
                  <option value="STANDARD">Standard</option>
                </select>
              </div>

              {/* Points Correct */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Points (Correct)</label>
                <input
                  type="number"
                  value={customQuestion.points}
                  onChange={(e) => setCustomQuestion((prev) => ({ ...prev, points: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                />
              </div>

              {/* Points Wrong */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Points (Wrong)</label>
                <input
                  type="number"
                  value={customQuestion.pointsWrong}
                  onChange={(e) => setCustomQuestion((prev) => ({ ...prev, pointsWrong: parseInt(e.target.value, 10) || 0 }))}
                  placeholder="0 or negative"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                />
                <p className="text-xs text-gray-600 mt-1">Use negative for penalty</p>
              </div>
            </div>

            {/* Options (for non-numeric types) */}
            {customQuestion.type !== "NUMERIC_INPUT" && (
              <div>
                <label className="block text-xs text-gray-500 mb-2">Options</label>
                <div className="space-y-2">
                  {customQuestion.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => updateCustomOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                      />
                      {customQuestion.options.length > 2 && (
                        <button
                          onClick={() => removeCustomOption(i)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {customQuestion.type === "MULTI_CHOICE" && (
                  <button
                    onClick={addCustomOption}
                    className="mt-2 text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            )}

            {/* Add Button */}
            <div className="pt-2">
              <button
                onClick={handleAddCustomQuestion}
                className="btn-primary px-6 py-2"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <QuestionPreviewCard
                      key={q.questionId}
                      question={q}
                      index={i}
                      onDelete={() => handleDeleteQuestion(q.questionId)}
                      onToggle={() => handleToggleQuestion(q.questionId)}
                      onUpdatePoints={(pts, ptsWrong) => handleUpdateQuestionPoints(q.questionId, pts, ptsWrong)}
                      onMoveUp={() => handleMoveQuestion(q.questionId, "up")}
                      onMoveDown={() => handleMoveQuestion(q.questionId, "down")}
                      isFirst={i === 0}
                      isLast={i === standardQuestions.length - 1}
                    />
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
                    <QuestionPreviewCard
                      key={q.questionId}
                      question={q}
                      index={i}
                      onDelete={() => handleDeleteQuestion(q.questionId)}
                      onToggle={() => handleToggleQuestion(q.questionId)}
                      onUpdatePoints={(pts, ptsWrong) => handleUpdateQuestionPoints(q.questionId, pts, ptsWrong)}
                      onMoveUp={() => handleMoveQuestion(q.questionId, "up")}
                      onMoveDown={() => handleMoveQuestion(q.questionId, "down")}
                      isFirst={i === 0}
                      isLast={i === sideQuestions.length - 1}
                    />
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
                    <QuestionPreviewCard
                      key={q.questionId}
                      question={q}
                      index={i}
                      onDelete={() => handleDeleteQuestion(q.questionId)}
                      onToggle={() => handleToggleQuestion(q.questionId)}
                      onUpdatePoints={(pts, ptsWrong) => handleUpdateQuestionPoints(q.questionId, pts, ptsWrong)}
                      onMoveUp={() => handleMoveQuestion(q.questionId, "up")}
                      onMoveDown={() => handleMoveQuestion(q.questionId, "down")}
                      isFirst={i === 0}
                      isLast={i === legacyQuestions.length - 1}
                    />
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

function QuestionPreviewCard({
  question,
  index,
  onDelete,
  onToggle,
  onUpdatePoints,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) {
  const q = question;
  const [isEditing, setIsEditing] = useState(false);
  const [editPoints, setEditPoints] = useState(q.points);
  const [editPointsWrong, setEditPointsWrong] = useState(q.pointsWrong || 0);

  const handleSavePoints = () => {
    onUpdatePoints(editPoints, editPointsWrong);
    setIsEditing(false);
  };

  return (
    <div
      className={`p-3 bg-gray-800/50 rounded-lg border transition-all ${
        q.disabled ? "border-gray-700 opacity-50" : "border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className={`p-1 text-xs ${isFirst ? "text-gray-700" : "text-gray-500 hover:text-gray-300"}`}
          >
            ▲
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className={`p-1 text-xs ${isLast ? "text-gray-700" : "text-gray-500 hover:text-gray-300"}`}
          >
            ▼
          </button>
        </div>

        <div className="flex-1">
          <div className="text-sm text-gray-200">
            <span className="text-gray-500 mr-2">{index + 1}.</span>
            {q.text}
            {q.isCustom && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 rounded">
                Custom
              </span>
            )}
            {q.disabled && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-900/50 text-red-400 rounded">
                Disabled
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500">Pts:</label>
                <input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(parseInt(e.target.value, 10) || 0)}
                  className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500">Wrong:</label>
                <input
                  type="number"
                  value={editPointsWrong}
                  onChange={(e) => setEditPointsWrong(parseInt(e.target.value, 10) || 0)}
                  className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                />
              </div>
              <button
                onClick={handleSavePoints}
                className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
              <span className="text-gray-500">Kind: {q.kind}</span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-500">Type: {q.type}</span>
              <span className="text-gray-600">|</span>
              <span
                className="text-gray-500 cursor-pointer hover:text-brand-400"
                onClick={() => setIsEditing(true)}
              >
                Points: {q.points}
                {q.pointsWrong ? ` / ${q.pointsWrong}` : ""} ✎
              </span>
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
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <div className="text-right text-xs text-gray-500">
            {q.options.length > 0 && <span>{q.options.length} opts</span>}
            {q.type === "NUMERIC_INPUT" && <span className="text-amber-500">Numeric</span>}
          </div>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded ${
              q.disabled
                ? "text-emerald-400 hover:bg-emerald-900/30"
                : "text-amber-400 hover:bg-amber-900/30"
            }`}
            title={q.disabled ? "Enable" : "Disable"}
          >
            {q.disabled ? "○" : "●"}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-400 hover:bg-red-900/30 rounded"
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
