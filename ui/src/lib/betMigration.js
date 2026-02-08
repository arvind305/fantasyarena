/**
 * betMigration.js — Silent migration of localStorage bets to Supabase.
 *
 * This runs automatically when users visit the site. It checks for any
 * bets stored in localStorage (from when the app was in simulation mode)
 * and syncs them to Supabase without user intervention.
 *
 * The migration is idempotent - it won't duplicate bets that already exist.
 */

import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = "betting_arena_state";
const MIGRATION_FLAG = "betting_arena_migrated";

/**
 * Get all bets from localStorage (mock engine format)
 */
function getLocalStorageBets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const state = JSON.parse(raw);
    if (!state.bets) return [];

    const allBets = [];

    // Structure: state.bets[userId][matchId] = betObject
    for (const [userId, userBets] of Object.entries(state.bets)) {
      for (const [matchId, bet] of Object.entries(userBets)) {
        if (bet && bet.answers && Object.keys(bet.answers).length > 0) {
          allBets.push({
            bet_id: bet.betId || `bet_${userId}_${matchId}`,
            user_id: userId,
            match_id: matchId,
            answers: bet.answers,
            submitted_at: bet.submittedAt || new Date().toISOString(),
            is_locked: bet.isLocked || false,
            locked_at: bet.lockedAt || null,
            score: bet.score || null
          });
        }
      }
    }

    return allBets;
  } catch (err) {
    console.warn('[betMigration] Error reading localStorage:', err);
    return [];
  }
}

/**
 * Check if we've already migrated for a specific user
 */
function getMigratedUsers() {
  try {
    const raw = localStorage.getItem(MIGRATION_FLAG);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Mark a user as migrated
 */
function markUserMigrated(userId) {
  try {
    const migrated = getMigratedUsers();
    if (!migrated.includes(userId)) {
      migrated.push(userId);
      localStorage.setItem(MIGRATION_FLAG, JSON.stringify(migrated));
    }
  } catch {}
}

/**
 * Migrate a single bet to Supabase (upsert to avoid duplicates)
 */
async function migrateBet(bet) {
  if (!supabase || !isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('bets')
      .upsert(bet, { onConflict: 'user_id,match_id' });

    if (error) {
      console.warn('[betMigration] Failed to migrate bet:', bet.bet_id, error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[betMigration] Error migrating bet:', err);
    return false;
  }
}

/**
 * Run the migration for a specific user.
 * Call this when a user signs in or when the app loads with an authenticated user.
 *
 * IMPORTANT: This also migrates bets from "dev_user_001" (the old shared dev ID)
 * and reassigns them to the user's real Google ID.
 */
export async function migrateUserBets(userId) {
  if (!userId) return { migrated: 0, total: 0 };
  if (!supabase || !isSupabaseConfigured()) return { migrated: 0, total: 0 };

  // Check if already migrated
  const migratedUsers = getMigratedUsers();
  if (migratedUsers.includes(userId)) {
    return { migrated: 0, total: 0, alreadyMigrated: true };
  }

  const localBets = getLocalStorageBets();

  // Get bets for this user OR for dev_user_001 (legacy shared ID)
  // Reassign dev_user_001 bets to the real user
  const userBets = localBets
    .filter(b => b.user_id === userId || b.user_id === 'dev_user_001')
    .map(bet => ({
      ...bet,
      user_id: userId, // Reassign to real user ID
      bet_id: `bet_${userId}_${bet.match_id}` // Update bet_id too
    }));

  if (userBets.length === 0) {
    markUserMigrated(userId);
    return { migrated: 0, total: 0 };
  }

  let migrated = 0;
  for (const bet of userBets) {
    const success = await migrateBet(bet);
    if (success) migrated++;
  }

  // Mark as migrated even if some failed (we'll log failures)
  markUserMigrated(userId);

  console.log(`[betMigration] Migrated ${migrated}/${userBets.length} bets for user ${userId.substring(0, 8)}...`);

  return { migrated, total: userBets.length };
}

/**
 * Run migration for ALL users found in localStorage.
 * This is useful for admin recovery or batch migration.
 */
export async function migrateAllBets() {
  if (!supabase || !isSupabaseConfigured()) {
    return { migrated: 0, total: 0, error: 'Supabase not configured' };
  }

  const localBets = getLocalStorageBets();

  if (localBets.length === 0) {
    return { migrated: 0, total: 0 };
  }

  let migrated = 0;
  for (const bet of localBets) {
    const success = await migrateBet(bet);
    if (success) migrated++;
  }

  console.log(`[betMigration] Batch migrated ${migrated}/${localBets.length} bets`);

  return { migrated, total: localBets.length };
}

/**
 * Get stats about localStorage bets (for debugging/admin)
 */
export function getLocalBetStats() {
  const localBets = getLocalStorageBets();

  const byUser = {};
  const byMatch = {};

  for (const bet of localBets) {
    byUser[bet.user_id] = (byUser[bet.user_id] || 0) + 1;
    byMatch[bet.match_id] = (byMatch[bet.match_id] || 0) + 1;
  }

  return {
    totalBets: localBets.length,
    uniqueUsers: Object.keys(byUser).length,
    byUser,
    byMatch,
    bets: localBets
  };
}
