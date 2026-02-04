/**
 * QuestionStore.js — Admin-defined betting questions store.
 *
 * Questions are loaded from /data/questions.json and cached in memory.
 * In shadow/simulation mode, saves update memory only (no file writes).
 *
 * Extended schema for Standard Bets + Side Bets:
 *
 * Question: {
 *   questionId: string,
 *   matchId: string,
 *   section: "STANDARD" | "SIDE",
 *   kind: "WINNER" | "TOTAL_RUNS" | "PLAYER_PICK" | "RUNNER_PICK" | "SIDE_BET",
 *   type: "TEAM_PICK" | "NUMERIC_INPUT" | "PLAYER_PICK" | "RUNNER_PICK" | "YES_NO" | "MULTI_CHOICE",
 *   text: string,
 *   points: number,          // base points
 *   weight?: number,         // for winner bet SuperOver weighting (store 5 for SuperOver option)
 *   slot?: { index: number, multiplier: number },  // for player pick slots
 *   runnerConfig?: { maxRunners: number, percent: number },  // for runner section
 *   options: Array<{
 *     optionId: string,
 *     label: string,
 *     referenceType?: "TEAM" | "PLAYER" | "NONE",
 *     referenceId?: string,
 *     weight?: number       // for SuperOver option multiplier
 *   }>
 * }
 *
 * Match Config (stored alongside questions):
 * {
 *   winnerPointsX: number,
 *   totalRunsPointsX: number,
 *   playerPickSlots: number,
 *   multiplierPreset: number[],
 *   runnersEnabled: boolean,
 *   runnerConfig: { maxRunners: number, percent: number },
 *   sideBetCount: number,
 *   sideBetPointsDefault: number,
 *   sideBetTemplateIds?: string[]
 * }
 */

let _questionsCache = null;
let _loadPromise = null;

// Store match configs in memory (matchId -> config)
let _matchConfigs = {};

async function loadQuestions() {
  if (_questionsCache) return _questionsCache;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    try {
      const res = await fetch("/data/questions.json");
      if (!res.ok) {
        console.warn("[QuestionStore] Failed to load questions.json, using empty store");
        _questionsCache = { questionsByMatch: {}, configsByMatch: {} };
        return _questionsCache;
      }
      const data = await res.json();
      // Migrate old schema if needed
      _questionsCache = {
        questionsByMatch: data.questionsByMatch || {},
        configsByMatch: data.configsByMatch || {},
      };
      _matchConfigs = _questionsCache.configsByMatch;
      console.log("[QuestionStore] Loaded questions store");
      return _questionsCache;
    } catch (err) {
      console.warn("[QuestionStore] Error loading questions.json:", err);
      _questionsCache = { questionsByMatch: {}, configsByMatch: {} };
      return _questionsCache;
    }
  })();

  return _loadPromise;
}

/**
 * Initialize the question store. Call at app startup.
 */
export async function initializeQuestionStore() {
  await loadQuestions();
}

/**
 * Get questions for a match. Returns empty array if none defined.
 */
export function getQuestions(matchId) {
  if (!_questionsCache) {
    console.warn("[QuestionStore] Not initialized, returning empty array");
    return [];
  }
  return _questionsCache.questionsByMatch[matchId] || [];
}

/**
 * Get questions by section.
 */
export function getQuestionsBySection(matchId, section) {
  const questions = getQuestions(matchId);
  return questions.filter((q) => q.section === section);
}

/**
 * Get standard questions only.
 */
export function getStandardQuestions(matchId) {
  return getQuestionsBySection(matchId, "STANDARD");
}

/**
 * Get side bet questions only.
 */
export function getSideBetQuestions(matchId) {
  return getQuestionsBySection(matchId, "SIDE");
}

/**
 * Get match config.
 */
export function getMatchConfig(matchId) {
  return _matchConfigs[matchId] || null;
}

/**
 * Save match config.
 */
export function saveMatchConfig(matchId, config) {
  _matchConfigs[matchId] = config;
  if (_questionsCache) {
    _questionsCache.configsByMatch[matchId] = config;
  }
  console.log(`[QuestionStore] Saved config for match ${matchId} (in-memory)`);
  return { success: true };
}

/**
 * Save questions for a match. Updates in-memory only (shadow mode).
 */
export function saveQuestions(matchId, questions) {
  if (!_questionsCache) {
    _questionsCache = { questionsByMatch: {}, configsByMatch: {} };
  }
  _questionsCache.questionsByMatch[matchId] = questions;
  console.log(`[QuestionStore] Saved ${questions.length} questions for match ${matchId} (in-memory)`);
  return { success: true, count: questions.length };
}

/**
 * Save questions for a specific section only (preserves other section).
 */
export function saveQuestionsBySection(matchId, section, questions) {
  const existing = getQuestions(matchId);
  const otherSection = existing.filter((q) => q.section !== section);
  const combined = [...otherSection, ...questions];
  return saveQuestions(matchId, combined);
}

/**
 * Save standard questions (preserves side bets).
 */
export function saveStandardQuestions(matchId, questions) {
  return saveQuestionsBySection(matchId, "STANDARD", questions);
}

/**
 * Save side bet questions (preserves standard).
 */
export function saveSideBetQuestions(matchId, questions) {
  return saveQuestionsBySection(matchId, "SIDE", questions);
}

/**
 * Check if match has standard pack generated.
 */
export function hasStandardPack(matchId) {
  const questions = getQuestions(matchId);
  return questions.some((q) => q.section === "STANDARD");
}

/**
 * Check if match has side bets.
 */
export function hasSideBets(matchId) {
  const questions = getQuestions(matchId);
  return questions.some((q) => q.section === "SIDE");
}

/**
 * Clear the cache (useful for testing).
 */
export function clearQuestionStoreCache() {
  _questionsCache = null;
  _loadPromise = null;
  _matchConfigs = {};
}

/**
 * Get all stored data (for debugging).
 */
export function getStoreSnapshot() {
  return {
    questionsByMatch: _questionsCache?.questionsByMatch || {},
    configsByMatch: _matchConfigs,
  };
}
