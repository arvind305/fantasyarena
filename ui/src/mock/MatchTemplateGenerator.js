/**
 * MatchTemplateGenerator.js — Generates standard betting questions and applies side bets.
 *
 * Standard bets are always generated from templates:
 *   - Winner bet (always ON): Team A, Team B, Super Over options
 *   - Total Runs prediction (always ON): Numeric input
 *   - Player pick (always ON): Default 1 player, configurable K slots
 *   - Runner bet (optional): Only if admin toggles runners ON
 *
 * Side bets are loaded from sideBetLibrary.json and applied separately.
 */

let _sideBetLibrary = null;
let _libraryLoadPromise = null;

/**
 * Load side bet library from JSON.
 */
export async function loadSideBetLibrary() {
  if (_sideBetLibrary) return _sideBetLibrary;
  if (_libraryLoadPromise) return _libraryLoadPromise;

  _libraryLoadPromise = (async () => {
    try {
      const res = await fetch("/data/sideBetLibrary.json");
      if (!res.ok) {
        console.warn("[MatchTemplateGenerator] Failed to load sideBetLibrary.json");
        _sideBetLibrary = { templates: [] };
        return _sideBetLibrary;
      }
      _sideBetLibrary = await res.json();
      console.log(`[MatchTemplateGenerator] Loaded ${_sideBetLibrary.templates.length} side bet templates`);
      return _sideBetLibrary;
    } catch (err) {
      console.warn("[MatchTemplateGenerator] Error loading sideBetLibrary.json:", err);
      _sideBetLibrary = { templates: [] };
      return _sideBetLibrary;
    }
  })();

  return _libraryLoadPromise;
}

/**
 * Get side bet library (sync, must be loaded first).
 */
export function getSideBetLibrary() {
  return _sideBetLibrary || { templates: [] };
}

function generateId() {
  return "q_" + Math.random().toString(36).slice(2, 10);
}

function generateOptionId() {
  return "opt_" + Math.random().toString(36).slice(2, 10);
}

/**
 * Default config values.
 */
export const DEFAULT_CONFIG = {
  winnerPointsX: 10,
  totalRunsPointsX: 10,
  playerPickSlots: 1,
  multiplierPreset: [1], // Array of multipliers, length = playerPickSlots
  runnersEnabled: false,
  runnerConfig: { maxRunners: 2, percent: 10 },
  sideBetCount: 1,
  sideBetPointsDefault: 10,
  sideBetTemplateIds: null, // null = auto-pick
};

/**
 * Generate standard betting questions pack for a match.
 *
 * @param {Object} match - Match object with teamA, teamB, squads
 * @param {Object} squads - Squads object (teamId -> playerIds array)
 * @param {Object} config - Configuration object
 * @returns {Array} Array of standard questions
 */
export function generateStandardPack(match, squads, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const questions = [];
  const now = new Date().toISOString();

  // Ensure multiplier array matches slot count
  if (cfg.multiplierPreset.length < cfg.playerPickSlots) {
    const diff = cfg.playerPickSlots - cfg.multiplierPreset.length;
    cfg.multiplierPreset = [...cfg.multiplierPreset, ...Array(diff).fill(1)];
  }

  // 1. Winner bet (always ON)
  const winnerOptions = [
    {
      optionId: generateOptionId(),
      label: match.teamA?.shortName || match.teamA?.name || "Team A",
      referenceType: "TEAM",
      referenceId: match.teamA?.teamId,
      weight: 1,
    },
    {
      optionId: generateOptionId(),
      label: match.teamB?.shortName || match.teamB?.name || "Team B",
      referenceType: "TEAM",
      referenceId: match.teamB?.teamId,
      weight: 1,
    },
    {
      optionId: generateOptionId(),
      label: "Super Over",
      referenceType: "NONE",
      referenceId: null,
      weight: 5, // 5x multiplier for Super Over
    },
  ];

  questions.push({
    questionId: generateId(),
    matchId: match.matchId,
    eventId: match.eventId,
    section: "STANDARD",
    kind: "WINNER",
    type: "TEAM_PICK",
    text: "Who will win the match?",
    points: cfg.winnerPointsX,
    weight: 5, // Store Super Over weighting
    options: winnerOptions,
    createdAt: now,
  });

  // 2. Total Runs prediction (always ON) - numeric input
  questions.push({
    questionId: generateId(),
    matchId: match.matchId,
    eventId: match.eventId,
    section: "STANDARD",
    kind: "TOTAL_RUNS",
    type: "NUMERIC_INPUT",
    text: "Predict the total runs scored in the match (both innings combined)",
    points: cfg.totalRunsPointsX,
    options: [], // No options for numeric input
    createdAt: now,
  });

  // 3. Player picks (always ON)
  // Build player options from squads
  const playerOptions = buildPlayerOptions(match, squads);

  for (let i = 0; i < cfg.playerPickSlots; i++) {
    const slotNum = i + 1;
    const multiplier = cfg.multiplierPreset[i] || 1;

    questions.push({
      questionId: generateId(),
      matchId: match.matchId,
      eventId: match.eventId,
      section: "STANDARD",
      kind: "PLAYER_PICK",
      type: "PLAYER_PICK",
      text: cfg.playerPickSlots === 1
        ? "Pick your player of the match"
        : `Player pick slot ${slotNum} of ${cfg.playerPickSlots}`,
      points: cfg.winnerPointsX, // Base points, multiplied by slot multiplier
      slot: { index: i, multiplier },
      options: playerOptions,
      createdAt: now,
    });
  }

  // 4. Runner bet (optional)
  if (cfg.runnersEnabled) {
    questions.push({
      questionId: generateId(),
      matchId: match.matchId,
      eventId: match.eventId,
      section: "STANDARD",
      kind: "RUNNER_PICK",
      type: "RUNNER_PICK",
      text: `Select up to ${cfg.runnerConfig.maxRunners} runner(s) - ${cfg.runnerConfig.percent}% of points pool`,
      points: 0, // Runner points are derived from pool percentage
      runnerConfig: { ...cfg.runnerConfig },
      options: [], // Options loaded from group membership; empty placeholder for now
      createdAt: now,
    });
  }

  return questions;
}

/**
 * Build player options from match squads.
 */
function buildPlayerOptions(match, squads) {
  const options = [];
  const teamAId = match.teamA?.teamId;
  const teamBId = match.teamB?.teamId;

  // Get player IDs from squads
  const teamAPlayers = squads?.[teamAId] || [];
  const teamBPlayers = squads?.[teamBId] || [];

  // Also check match.squads format
  if (match.squads && Array.isArray(match.squads)) {
    for (const squad of match.squads) {
      const teamId = squad.teamId;
      const playerIds = squad.playerIds || squad.players || [];

      for (const playerId of playerIds) {
        // Use playerId as both id and label (UI can enhance with player names)
        options.push({
          optionId: generateOptionId(),
          label: playerId,
          referenceType: "PLAYER",
          referenceId: playerId,
        });
      }
    }
  } else {
    // Fallback to squads object format
    for (const playerId of teamAPlayers) {
      options.push({
        optionId: generateOptionId(),
        label: playerId,
        referenceType: "PLAYER",
        referenceId: playerId,
      });
    }
    for (const playerId of teamBPlayers) {
      options.push({
        optionId: generateOptionId(),
        label: playerId,
        referenceType: "PLAYER",
        referenceId: playerId,
      });
    }
  }

  return options;
}

/**
 * Apply side bets from library to a match.
 *
 * @param {string} matchId - Match ID
 * @param {Object} match - Match object with teamA, teamB
 * @param {Array} templates - Side bet templates to apply
 * @param {number} count - Number of side bets to create (min 1)
 * @param {Object} overridePoints - Optional map of templateId -> points override
 * @returns {Array} Array of side bet questions
 */
export function applySideBets(matchId, match, templates, count = 1, overridePoints = {}) {
  const questions = [];
  const now = new Date().toISOString();

  // Ensure at least 1 side bet
  const actualCount = Math.max(1, count);
  const templatesToUse = templates.slice(0, actualCount);

  for (const template of templatesToUse) {
    const points = overridePoints[template.templateId] !== undefined
      ? overridePoints[template.templateId]
      : template.defaultPoints;

    // Process template options (replace placeholders)
    const processedOptions = template.options.map((opt) => ({
      optionId: generateOptionId(),
      label: processLabel(opt.label, match),
      referenceType: opt.referenceType || "NONE",
      referenceId: processReferenceId(opt.referenceId, match),
    }));

    questions.push({
      questionId: generateId(),
      matchId,
      eventId: match.eventId,
      section: "SIDE",
      kind: "SIDE_BET",
      type: template.type,
      text: processLabel(template.text, match),
      points,
      templateId: template.templateId,
      tags: template.tags || [],
      options: processedOptions,
      createdAt: now,
    });
  }

  return questions;
}

/**
 * Process label placeholders.
 */
function processLabel(label, match) {
  if (!label) return label;
  return label
    .replace(/\{\{teamA\}\}/g, match.teamA?.shortName || match.teamA?.name || "Team A")
    .replace(/\{\{teamB\}\}/g, match.teamB?.shortName || match.teamB?.name || "Team B")
    .replace(/\{\{teamAId\}\}/g, match.teamA?.teamId || "")
    .replace(/\{\{teamBId\}\}/g, match.teamB?.teamId || "");
}

/**
 * Process referenceId placeholders.
 */
function processReferenceId(refId, match) {
  if (!refId) return null;
  return refId
    .replace(/\{\{teamAId\}\}/g, match.teamA?.teamId || "")
    .replace(/\{\{teamBId\}\}/g, match.teamB?.teamId || "");
}

/**
 * Get templates by IDs or auto-select first N.
 */
export function selectTemplates(library, templateIds, count) {
  if (templateIds && templateIds.length > 0) {
    // Select specific templates
    return templateIds
      .map((id) => library.templates.find((t) => t.templateId === id))
      .filter(Boolean);
  }
  // Auto-select first N templates
  return library.templates.slice(0, count);
}

/**
 * Get all available tags from library.
 */
export function getAllTags(library) {
  const tags = new Set();
  for (const template of library.templates) {
    for (const tag of template.tags || []) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

/**
 * Filter templates by tags.
 */
export function filterTemplatesByTags(library, tags) {
  if (!tags || tags.length === 0) return library.templates;
  return library.templates.filter((t) =>
    tags.some((tag) => t.tags?.includes(tag))
  );
}

/**
 * Clear library cache (for testing).
 */
export function clearLibraryCache() {
  _sideBetLibrary = null;
  _libraryLoadPromise = null;
}
