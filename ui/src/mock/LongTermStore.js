/**
 * LongTermStore.js — In-memory persistence for long-term bets.
 *
 * Handles:
 * - Submissions per user
 * - Lock state derived from config + time + reopenEnabled
 * - Audit entries for paid edits
 * - Points ledger for tracking user points
 */

let _config = null;
let _configLoadPromise = null;

// In-memory state
let _submissions = {}; // userId -> { answers, submittedAt, isLocked, editCount }
let _auditLog = []; // Array of { userId, ts, action, cost, details }
let _pointsLedger = {}; // userId -> { balance, transactions }

const STORAGE_KEY = "long_term_bets_state";

/**
 * Load state from localStorage.
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      _submissions = data.submissions || {};
      _auditLog = data.auditLog || [];
      _pointsLedger = data.pointsLedger || {};
    }
  } catch (err) {
    console.warn("[LongTermStore] Error loading state:", err);
  }
}

/**
 * Save state to localStorage.
 */
function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        submissions: _submissions,
        auditLog: _auditLog,
        pointsLedger: _pointsLedger,
      })
    );
  } catch (err) {
    console.warn("[LongTermStore] Error saving state:", err);
  }
}

// Initialize on module load
loadState();

/**
 * Load long-term config from JSON.
 */
export async function loadLongTermConfig() {
  if (_config) return _config;
  if (_configLoadPromise) return _configLoadPromise;

  _configLoadPromise = (async () => {
    try {
      const res = await fetch("/data/longTermConfig.json");
      if (!res.ok) {
        console.warn("[LongTermStore] Failed to load longTermConfig.json");
        _config = getDefaultConfig();
        return _config;
      }
      _config = await res.json();
      console.log("[LongTermStore] Loaded long-term config");
      return _config;
    } catch (err) {
      console.warn("[LongTermStore] Error loading config:", err);
      _config = getDefaultConfig();
      return _config;
    }
  })();

  return _configLoadPromise;
}

/**
 * Get default config.
 */
function getDefaultConfig() {
  return {
    longTermLockAt: "2026-02-07T00:00:00Z",
    reopenEnabled: false,
    reopenCostPoints: 50,
    questions: [],
  };
}

/**
 * Get config (sync, must be loaded first).
 */
export function getConfig() {
  return _config || getDefaultConfig();
}

/**
 * Check if submissions are locked based on config and time.
 */
export function isLocked() {
  const config = getConfig();
  const now = Date.now();
  const lockTime = new Date(config.longTermLockAt).getTime();
  return now >= lockTime;
}

/**
 * Check if editing is allowed (after lock but with reopen enabled).
 */
export function isReopenedForEdits() {
  const config = getConfig();
  return isLocked() && config.reopenEnabled;
}

/**
 * Get lock status info.
 */
export function getLockStatus() {
  const config = getConfig();
  const locked = isLocked();
  const reopened = isReopenedForEdits();

  return {
    isLocked: locked,
    isReopened: reopened,
    canEdit: !locked || reopened,
    editCost: reopened ? config.reopenCostPoints : 0,
    lockAt: config.longTermLockAt,
  };
}

/**
 * Get or initialize user's points balance.
 */
export function getUserPoints(userId) {
  if (!_pointsLedger[userId]) {
    _pointsLedger[userId] = {
      balance: 1000, // Default starting points
      transactions: [],
    };
    saveState();
  }
  return _pointsLedger[userId].balance;
}

/**
 * Deduct points from user.
 */
export function deductPoints(userId, amount, reason) {
  if (!_pointsLedger[userId]) {
    _pointsLedger[userId] = { balance: 1000, transactions: [] };
  }

  const ledger = _pointsLedger[userId];
  if (ledger.balance < amount) {
    throw new Error("INSUFFICIENT_POINTS");
  }

  ledger.balance -= amount;
  ledger.transactions.push({
    ts: new Date().toISOString(),
    type: "DEDUCT",
    amount,
    reason,
    balanceAfter: ledger.balance,
  });

  saveState();
  return ledger.balance;
}

/**
 * Add points to user.
 */
export function addPoints(userId, amount, reason) {
  if (!_pointsLedger[userId]) {
    _pointsLedger[userId] = { balance: 1000, transactions: [] };
  }

  const ledger = _pointsLedger[userId];
  ledger.balance += amount;
  ledger.transactions.push({
    ts: new Date().toISOString(),
    type: "ADD",
    amount,
    reason,
    balanceAfter: ledger.balance,
  });

  saveState();
  return ledger.balance;
}

/**
 * Log audit entry.
 */
export function logAudit(userId, action, cost = 0, details = {}) {
  const entry = {
    userId,
    ts: new Date().toISOString(),
    action,
    cost,
    details,
  };
  _auditLog.push(entry);
  saveState();
  return entry;
}

/**
 * Get audit log entries (optionally filtered by userId).
 */
export function getAuditLog(userId = null) {
  if (userId) {
    return _auditLog.filter((e) => e.userId === userId);
  }
  return [..._auditLog];
}

/**
 * Get user's long-term bet submission.
 */
export function getSubmission(userId) {
  return _submissions[userId] || null;
}

/**
 * Submit or update long-term bets.
 */
export function submitLongTermBets(userId, answers) {
  const status = getLockStatus();
  const existing = _submissions[userId];

  // Validate answers (basic check)
  if (!answers || Object.keys(answers).length === 0) {
    throw new Error("EMPTY_SUBMISSION");
  }

  // Check if editing is allowed
  if (!status.canEdit) {
    throw new Error("SUBMISSIONS_LOCKED");
  }

  // If reopened and user already submitted, charge for edit
  if (status.isReopened && existing) {
    const cost = status.editCost;
    const currentBalance = getUserPoints(userId);

    if (currentBalance < cost) {
      throw new Error(`INSUFFICIENT_POINTS: Need ${cost} points, have ${currentBalance}`);
    }

    // Deduct points
    deductPoints(userId, cost, "Long-term bet edit after reopen");

    // Log audit
    logAudit(userId, "LONG_TERM_EDIT", cost, {
      previousAnswers: existing.answers,
      newAnswers: answers,
    });
  }

  const now = new Date().toISOString();
  const editCount = existing ? (existing.editCount || 0) + 1 : 0;

  _submissions[userId] = {
    answers,
    submittedAt: now,
    originalSubmittedAt: existing?.originalSubmittedAt || now,
    isLocked: status.isLocked && !status.isReopened,
    editCount,
  };

  saveState();

  return {
    success: true,
    submittedAt: now,
    isLocked: _submissions[userId].isLocked,
    editCount,
    pointsDeducted: status.isReopened && existing ? status.editCost : 0,
  };
}

/**
 * Get all submissions (admin view).
 */
export function getAllSubmissions() {
  return { ..._submissions };
}

/**
 * Clear all state (for testing).
 */
export function clearLongTermStore() {
  _submissions = {};
  _auditLog = [];
  _pointsLedger = {};
  _config = null;
  _configLoadPromise = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Admin: Toggle reopen status.
 */
export function setReopenEnabled(enabled) {
  if (_config) {
    _config.reopenEnabled = enabled;
  }
  return getConfig();
}

/**
 * Admin: Update reopen cost.
 */
export function setReopenCost(cost) {
  if (_config) {
    _config.reopenCostPoints = cost;
  }
  return getConfig();
}

/**
 * Get long-term questions from config.
 */
export function getLongTermQuestions() {
  const config = getConfig();
  return config.questions || [];
}
