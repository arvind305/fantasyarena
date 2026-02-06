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

// Cached squads and players data
let _squadsData = null;
let _playersData = null;
let _squadsLoadPromise = null;
let _playersLoadPromise = null;

/**
 * Load squads data from JSON.
 */
export async function loadSquadsData() {
  if (_squadsData) return _squadsData;
  if (_squadsLoadPromise) return _squadsLoadPromise;

  _squadsLoadPromise = (async () => {
    try {
      const res = await fetch("/data/squads.json");
      if (!res.ok) {
        console.warn("[MatchTemplateGenerator] Failed to load squads.json");
        _squadsData = [];
        return _squadsData;
      }
      _squadsData = await res.json();
      console.log(`[MatchTemplateGenerator] Loaded ${_squadsData.length} team squads`);
      return _squadsData;
    } catch (err) {
      console.warn("[MatchTemplateGenerator] Error loading squads.json:", err);
      _squadsData = [];
      return _squadsData;
    }
  })();

  return _squadsLoadPromise;
}

/**
 * Load players data from JSON.
 */
export async function loadPlayersData() {
  if (_playersData) return _playersData;
  if (_playersLoadPromise) return _playersLoadPromise;

  _playersLoadPromise = (async () => {
    try {
      const res = await fetch("/data/players.json");
      if (!res.ok) {
        console.warn("[MatchTemplateGenerator] Failed to load players.json");
        _playersData = [];
        return _playersData;
      }
      _playersData = await res.json();
      console.log(`[MatchTemplateGenerator] Loaded ${_playersData.length} players`);
      return _playersData;
    } catch (err) {
      console.warn("[MatchTemplateGenerator] Error loading players.json:", err);
      _playersData = [];
      return _playersData;
    }
  })();

  return _playersLoadPromise;
}

/**
 * Get squads data (sync, must be loaded first).
 */
export function getSquadsData() {
  return _squadsData || [];
}

/**
 * Get players data (sync, must be loaded first).
 */
export function getPlayersData() {
  return _playersData || [];
}

/**
 * Preload all data needed for question generation.
 * Call this before generateStandardPack for populated PLAYER_PICK options.
 */
export async function preloadGeneratorData() {
  await Promise.all([
    loadSquadsData(),
    loadPlayersData(),
    loadSideBetLibrary(),
  ]);
}

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
 * Mapping from short team codes to full team IDs used in squads.json
 */
const TEAM_CODE_TO_ID = {
  pak: "pakistan",
  ind: "india",
  aus: "australia",
  eng: "england",
  nz: "new_zealand",
  sa: "south_africa",
  rsa: "south_africa",
  wi: "west_indies",
  sl: "sri_lanka",
  ban: "bangladesh",
  afg: "afghanistan",
  zim: "zimbabwe",
  ire: "ireland",
  ned: "netherlands",
  sco: "scotland",
  nam: "namibia",
  usa: "usa",
  uae: "uae",
  oman: "oman",
  nep: "nepal",
  can: "canada",
  ita: "italy",
};

/**
 * Resolve short team code to full team ID.
 */
function resolveTeamId(code) {
  if (!code) return code;
  const lower = code.toLowerCase();
  return TEAM_CODE_TO_ID[lower] || lower;
}

/**
 * First N matches get a simplified betting sheet.
 * These are the first 3 matches in chronological order from the tournament schedule.
 * matchIds follow the pattern: wc_m1, wc_m2, wc_m3, etc.
 */
export const EARLY_MATCH_IDS = ["wc_m1", "wc_m2", "wc_m3"];

/**
 * Check if a matchId is one of the first N simplified matches.
 */
export function isEarlyMatch(matchId) {
  return EARLY_MATCH_IDS.includes(matchId);
}

/**
 * Config for early matches (simplified 3-question sheet + 1 side bet):
 * - Winner: +1000 correct, 0 wrong (Super Over +5000)
 * - Total Runs: +1000 correct, 0 wrong
 * - Side Bet: +1000 correct, -1000 wrong
 */
export const EARLY_MATCH_CONFIG = {
  winnerPoints: 1000,
  superOverMultiplier: 5,
  totalRunsPoints: 1000,
  sideBetPointsCorrect: 1000,
  sideBetPointsWrong: -1000,
};

/**
 * Specific side bet for each early match.
 */
export const EARLY_MATCH_SIDE_BETS = {
  wc_m1: {
    text: "How many wides will be bowled in the match?",
    type: "MULTI_CHOICE",
    options: [
      { label: "0-5", value: "0-5" },
      { label: "6-10", value: "6-10" },
      { label: "11-15", value: "11-15" },
      { label: ">15", value: "gt15" },
    ],
  },
  wc_m2: {
    text: "How many runs will be scored in the powerplay of both innings combined?",
    type: "MULTI_CHOICE",
    options: [
      { label: "0-50", value: "0-50" },
      { label: "51-100", value: "51-100" },
      { label: "100-150", value: "100-150" },
      { label: "150-200", value: "150-200" },
    ],
  },
  wc_m3: {
    text: "Who will take more wickets in the match?",
    type: "MULTI_CHOICE",
    options: [
      { label: "Pacers", value: "pacers" },
      { label: "Spinners", value: "spinners" },
    ],
  },
};

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
  const now = new Date().toISOString();
  const matchId = match.matchId;

  // Check if this is an early match (simplified 3-question pack)
  if (isEarlyMatch(matchId)) {
    return generateEarlyMatchPack(match, squads, now);
  }

  // Standard full pack for regular matches
  return generateFullPack(match, squads, cfg, now);
}

/**
 * Generate simplified pack for first 3 matches.
 * 2 questions only: WINNER, TOTAL_RUNS
 * - Winner: +1000 correct, 0 wrong (Super Over = 5x = +5000)
 * - Total Runs: +1000 correct, 0 wrong
 */
function generateEarlyMatchPack(match, squads, now) {
  const questions = [];
  const matchId = match.matchId;
  const earlyCfg = EARLY_MATCH_CONFIG;

  // 1. Winner bet with Super Over option
  const superOverMultiplier = earlyCfg.superOverMultiplier;
  const winnerOptions = [
    {
      optionId: `opt_${matchId}_winner_teamA`,
      label: match.teamA?.shortName || match.teamA?.name || "Team A",
      referenceType: "TEAM",
      referenceId: match.teamA?.teamId,
      weight: 1,
    },
    {
      optionId: `opt_${matchId}_winner_teamB`,
      label: match.teamB?.shortName || match.teamB?.name || "Team B",
      referenceType: "TEAM",
      referenceId: match.teamB?.teamId,
      weight: 1,
    },
    {
      optionId: `opt_${matchId}_winner_superover`,
      label: `Super Over (${superOverMultiplier}x)`,
      referenceType: "NONE",
      referenceId: null,
      weight: superOverMultiplier,
    },
  ];

  questions.push({
    questionId: `q_${matchId}_winner`,
    matchId,
    eventId: match.eventId,
    section: "STANDARD",
    kind: "WINNER",
    type: "TEAM_PICK",
    text: "Who will win the match?",
    points: earlyCfg.winnerPoints,
    superOverMultiplier,
    options: winnerOptions,
    createdAt: now,
  });

  // 2. Total Runs prediction
  questions.push({
    questionId: `q_${matchId}_total_runs`,
    matchId,
    eventId: match.eventId,
    section: "STANDARD",
    kind: "TOTAL_RUNS",
    type: "NUMERIC_INPUT",
    text: "Predict the total runs scored in the match (both innings combined)",
    points: earlyCfg.totalRunsPoints,
    options: [],
    createdAt: now,
  });

  return questions;
}

/**
 * Generate full standard pack for regular matches (match #4 onwards).
 */
function generateFullPack(match, squads, cfg, now) {
  const questions = [];

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
 * Uses deterministic optionIds and resolves player names.
 */
function buildPlayerOptions(match, squads) {
  const options = [];
  const matchId = match.matchId;
  // Resolve short team codes (e.g., "pak") to full IDs (e.g., "pakistan")
  const teamAId = resolveTeamId(match.teamA?.teamId);
  const teamBId = resolveTeamId(match.teamB?.teamId);

  // Build player name lookup from cached players data
  const playersData = getPlayersData();
  const playerNameMap = new Map(playersData.map((p) => [p.playerId, p.name]));

  // Collect all player IDs for both teams
  let allPlayerIds = [];

  // Priority 1: Check match.squads array format
  if (match.squads && Array.isArray(match.squads)) {
    for (const squad of match.squads) {
      const playerIds = squad.playerIds || squad.players || [];
      allPlayerIds.push(...playerIds);
    }
  }

  // Priority 2: Check squads parameter (object format: { teamId: [playerIds] })
  if (allPlayerIds.length === 0 && squads) {
    const teamAPlayers = squads[teamAId] || squads[match.teamA?.teamId] || [];
    const teamBPlayers = squads[teamBId] || squads[match.teamB?.teamId] || [];
    allPlayerIds.push(...teamAPlayers, ...teamBPlayers);
  }

  // Priority 3: Fall back to cached squads.json data
  if (allPlayerIds.length === 0) {
    const squadsData = getSquadsData();
    const teamASquad = squadsData.find((s) => s.teamId === teamAId);
    const teamBSquad = squadsData.find((s) => s.teamId === teamBId);
    if (teamASquad) allPlayerIds.push(...(teamASquad.players || []));
    if (teamBSquad) allPlayerIds.push(...(teamBSquad.players || []));
  }

  // Build options with deterministic IDs and resolved names
  for (const playerId of allPlayerIds) {
    const playerName = playerNameMap.get(playerId) || playerId;
    options.push({
      // Deterministic optionId: same on every rerun for same match+player
      optionId: `opt_${matchId}_${playerId}`,
      label: playerName,
      referenceType: "PLAYER",
      referenceId: playerId,
    });
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

  // For early matches, enforce exactly 1 side bet with fixed points
  const earlyMatch = isEarlyMatch(matchId);
  const maxCount = earlyMatch ? EARLY_MATCH_CONFIG.maxSideBets : count;
  const defaultPoints = earlyMatch ? EARLY_MATCH_CONFIG.sideBetPoints : null;

  // Ensure at least 1 side bet, but cap at maxCount
  const actualCount = Math.min(Math.max(1, count), maxCount);
  const templatesToUse = templates.slice(0, actualCount);

  for (const template of templatesToUse) {
    // For early matches, use fixed points; otherwise use override or default
    const points = earlyMatch
      ? defaultPoints
      : (overridePoints[template.templateId] !== undefined
          ? overridePoints[template.templateId]
          : template.defaultPoints);

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

/**
 * Clear all cached data (for testing).
 */
export function clearAllCaches() {
  _sideBetLibrary = null;
  _libraryLoadPromise = null;
  _squadsData = null;
  _playersData = null;
  _squadsLoadPromise = null;
  _playersLoadPromise = null;
}
