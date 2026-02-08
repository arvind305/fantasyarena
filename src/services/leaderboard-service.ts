/**
 * Fantasy Sports Game - Leaderboard Service
 *
 * Authority: Constitution.md v1.0
 *
 * This service handles:
 * - Aggregating scores across matches per user
 * - Recalculating ranks
 * - Updating the leaderboard table/cache
 * - Tracking rank changes (previous_rank)
 */

import { supabaseAdmin } from '../db/supabase';
import type { BetScoreBreakdown } from './scoring-service';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Leaderboard entry from the leaderboard table
 */
export interface LeaderboardEntry {
  id: string;
  event_id: string;
  user_id: string;
  display_name: string;
  total_score: number;
  matches_played: number;
  last_match_score: number;
  rank: number;
  previous_rank: number;
  updated_at: string;
}

/**
 * Leaderboard entry with rank change information
 */
export interface LeaderboardEntryWithChange extends LeaderboardEntry {
  rank_change: number; // Positive = moved up, Negative = moved down, 0 = no change
  is_new: boolean; // True if this is their first entry
}

/**
 * Group leaderboard entry (from group_members)
 */
export interface GroupLeaderboardEntry {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  score: number;
  rank: number;
  joined_at: string;
}

/**
 * User score summary for aggregation
 */
interface UserScoreSummary {
  user_id: string;
  display_name: string;
  total_score: number;
  matches_played: number;
  last_match_score: number;
}

// =============================================================================
// CORE LEADERBOARD FUNCTIONS
// =============================================================================

/**
 * Ensure user exists in leaderboard (create if not exists)
 *
 * This function uses upsert to either create a new leaderboard entry
 * or update the display name if the entry already exists.
 *
 * @param eventId - The event ID for the leaderboard
 * @param userId - The user's UUID
 * @param displayName - The user's display name
 */
export async function ensureUserInLeaderboard(
  eventId: string,
  userId: string,
  displayName: string
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabaseAdmin
    .from('leaderboard')
    .upsert(
      {
        event_id: eventId,
        user_id: userId,
        display_name: displayName,
        total_score: 0,
        matches_played: 0,
        last_match_score: 0,
        rank: 0,
        previous_rank: 0,
      },
      {
        onConflict: 'event_id,user_id',
        ignoreDuplicates: true, // Don't update if already exists
      }
    );

  if (error) {
    throw new Error(`Failed to ensure user in leaderboard: ${error.message}`);
  }
}

/**
 * Recalculate ranks for all users in an event
 *
 * Uses the SQL function update_leaderboard_ranks if available.
 * Falls back to manual ranking calculation if the SQL function fails.
 *
 * @param eventId - The event ID to recalculate ranks for
 */
export async function recalculateRanks(eventId: string): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Try using the database function for atomic rank updates
  const { error } = await supabaseAdmin.rpc('update_leaderboard_ranks', {
    p_event_id: eventId,
  });

  if (error) {
    console.error(`SQL function failed, falling back to manual ranking: ${error.message}`);

    // Fallback: Manual rank calculation
    const { data: entries, error: fetchError } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('event_id', eventId)
      .order('total_score', { ascending: false })
      .order('matches_played', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch leaderboard entries: ${fetchError.message}`);
    }

    if (!entries || entries.length === 0) {
      return;
    }

    // Assign ranks with tie handling
    let currentRank = 1;
    let previousScore = -1;
    let previousMatches = -1;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      if (entry.total_score !== previousScore || entry.matches_played !== previousMatches) {
        currentRank = i + 1;
      }

      const { error: updateError } = await supabaseAdmin
        .from('leaderboard')
        .update({
          previous_rank: entry.rank,
          rank: currentRank,
        })
        .eq('id', entry.id);

      if (updateError) {
        console.error(`Failed to update rank for entry ${entry.id}: ${updateError.message}`);
      }

      previousScore = entry.total_score;
      previousMatches = entry.matches_played;
    }
  }
}

/**
 * Update leaderboard after a match is scored
 *
 * For each user who placed a bet:
 * 1. Add their match score to total_score
 * 2. Increment matches_played
 * 3. Store last_match_score
 * 4. Recalculate ranks
 *
 * @param matchId - The match ID that was scored
 * @param eventId - The event ID for the leaderboard
 * @param scoreBreakdowns - Array of score breakdowns from scoring-service
 */
export async function updateLeaderboardForMatch(
  matchId: string,
  eventId: string,
  scoreBreakdowns: BetScoreBreakdown[]
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  if (!scoreBreakdowns || scoreBreakdowns.length === 0) {
    console.log(`No score breakdowns provided for match ${matchId}`);
    return;
  }

  // Update each user's leaderboard entry based on their score breakdown
  for (const breakdown of scoreBreakdowns) {
    const { user_id, total_score } = breakdown;

    // Get current leaderboard entry
    const { data: currentEntry, error: getError } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user_id)
      .single();

    if (getError && getError.code !== 'PGRST116') {
      console.error(`Failed to get leaderboard entry for ${user_id}: ${getError.message}`);
      continue;
    }

    if (currentEntry) {
      // Update existing entry: add match score to total, increment matches played
      const { error: updateError } = await supabaseAdmin
        .from('leaderboard')
        .update({
          total_score: currentEntry.total_score + total_score,
          matches_played: currentEntry.matches_played + 1,
          last_match_score: total_score,
          previous_rank: currentEntry.rank,
        })
        .eq('id', currentEntry.id);

      if (updateError) {
        console.error(`Failed to update leaderboard entry for ${user_id}: ${updateError.message}`);
      }
    } else {
      // Create new entry for user
      // First, try to get display name from profiles or use default
      let displayName = `User ${user_id.slice(0, 8)}`;

      // Try to fetch display name from profiles table if it exists
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('display_name')
        .eq('id', user_id)
        .single();

      if (profile?.display_name) {
        displayName = profile.display_name;
      }

      const { error: insertError } = await supabaseAdmin
        .from('leaderboard')
        .insert({
          event_id: eventId,
          user_id: user_id,
          display_name: displayName,
          total_score: total_score,
          matches_played: 1,
          last_match_score: total_score,
          rank: 0,
          previous_rank: 0,
        });

      if (insertError) {
        console.error(`Failed to insert leaderboard entry for ${user_id}: ${insertError.message}`);
      }
    }
  }

  // Recalculate all ranks after updates
  await recalculateRanks(eventId);
}

// =============================================================================
// LEADERBOARD UPDATE FUNCTIONS (LEGACY)
// =============================================================================

/**
 * Update the leaderboard for an event
 *
 * This function:
 * 1. Aggregates all bet scores per user for matches in the event
 * 2. Updates or inserts leaderboard entries
 * 3. Recalculates ranks
 * 4. Tracks rank changes (previous_rank)
 *
 * @param eventId - The event ID to update leaderboard for
 * @returns Updated leaderboard entries
 */
export async function updateLeaderboard(
  eventId: string
): Promise<LeaderboardEntry[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Step 1: Get all bets for this event with scores
  // We need to join with users/profiles to get display names
  // For now, we'll aggregate from the bets table directly
  const { data: bets, error: betsError } = await supabaseAdmin
    .from('bets')
    .select('user_id, match_id, score, is_locked')
    .eq('is_locked', true);

  if (betsError) {
    throw new Error(`Failed to fetch bets: ${betsError.message}`);
  }

  // Filter bets by event (match_id should contain event info, or we need match metadata)
  // For simplicity, assume match_id format includes event or we process all matches
  const eventBets = bets?.filter((bet) =>
    bet.match_id.includes(eventId) || true // TODO: Implement proper event filtering
  ) || [];

  // Step 2: Aggregate scores per user
  const userScores = new Map<string, UserScoreSummary>();

  for (const bet of eventBets) {
    const existing = userScores.get(bet.user_id);
    if (existing) {
      existing.total_score += bet.score || 0;
      existing.matches_played += 1;
      existing.last_match_score = bet.score || 0;
    } else {
      userScores.set(bet.user_id, {
        user_id: bet.user_id,
        display_name: '', // Will be fetched/updated later
        total_score: bet.score || 0,
        matches_played: 1,
        last_match_score: bet.score || 0,
      });
    }
  }

  // Step 3: Get current leaderboard entries to preserve previous_rank
  const { data: currentLeaderboard, error: currentError } = await supabaseAdmin
    .from('leaderboard')
    .select('*')
    .eq('event_id', eventId);

  if (currentError && currentError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch current leaderboard: ${currentError.message}`);
  }

  const currentRanks = new Map<string, number>();
  const currentDisplayNames = new Map<string, string>();
  for (const entry of currentLeaderboard || []) {
    currentRanks.set(entry.user_id, entry.rank);
    currentDisplayNames.set(entry.user_id, entry.display_name);
  }

  // Step 4: Prepare leaderboard entries with previous ranks
  const leaderboardEntries: Omit<LeaderboardEntry, 'id' | 'updated_at'>[] = [];

  for (const [userId, summary] of userScores) {
    leaderboardEntries.push({
      event_id: eventId,
      user_id: userId,
      display_name: currentDisplayNames.get(userId) || summary.display_name || `User ${userId.slice(0, 8)}`,
      total_score: summary.total_score,
      matches_played: summary.matches_played,
      last_match_score: summary.last_match_score,
      rank: 0, // Will be calculated
      previous_rank: currentRanks.get(userId) || 0,
    });
  }

  // Step 5: Sort and assign ranks
  leaderboardEntries.sort((a, b) => {
    // Primary: total_score descending
    if (b.total_score !== a.total_score) {
      return b.total_score - a.total_score;
    }
    // Secondary: matches_played descending (more consistent player)
    return b.matches_played - a.matches_played;
  });

  let currentRank = 1;
  let previousScore = -1;
  let previousMatches = -1;
  let sameRankCount = 0;

  for (let i = 0; i < leaderboardEntries.length; i++) {
    const entry = leaderboardEntries[i];
    if (entry.total_score === previousScore && entry.matches_played === previousMatches) {
      // Same rank as previous (tie)
      sameRankCount++;
    } else {
      // New rank
      currentRank = i + 1;
      sameRankCount = 0;
    }
    entry.rank = currentRank;
    previousScore = entry.total_score;
    previousMatches = entry.matches_played;
  }

  // Step 6: Upsert leaderboard entries
  for (const entry of leaderboardEntries) {
    const { error: upsertError } = await supabaseAdmin
      .from('leaderboard')
      .upsert(
        {
          event_id: entry.event_id,
          user_id: entry.user_id,
          display_name: entry.display_name,
          total_score: entry.total_score,
          matches_played: entry.matches_played,
          last_match_score: entry.last_match_score,
          rank: entry.rank,
          previous_rank: entry.previous_rank,
        },
        { onConflict: 'event_id,user_id' }
      );

    if (upsertError) {
      console.error(`Failed to upsert leaderboard entry for ${entry.user_id}: ${upsertError.message}`);
    }
  }

  // Step 7: Fetch and return updated leaderboard
  const { data: updatedLeaderboard, error: fetchError } = await supabaseAdmin
    .from('leaderboard')
    .select('*')
    .eq('event_id', eventId)
    .order('rank', { ascending: true });

  if (fetchError) {
    throw new Error(`Failed to fetch updated leaderboard: ${fetchError.message}`);
  }

  return updatedLeaderboard as LeaderboardEntry[];
}

// =============================================================================
// LEADERBOARD RETRIEVAL FUNCTIONS
// =============================================================================

/**
 * Get the leaderboard for an event
 *
 * @param eventId - Event ID
 * @param limit - Optional limit on number of entries (default: all)
 * @returns Leaderboard entries ordered by rank
 */
export async function getLeaderboard(
  eventId: string,
  limit?: number
): Promise<LeaderboardEntryWithChange[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  let query = supabaseAdmin
    .from('leaderboard')
    .select('*')
    .eq('event_id', eventId)
    .order('rank', { ascending: true });

  if (limit && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  }

  // Add rank change information
  return (data || []).map((entry) => ({
    ...entry,
    rank_change: entry.previous_rank > 0
      ? entry.previous_rank - entry.rank
      : 0,
    is_new: entry.previous_rank === 0,
  })) as LeaderboardEntryWithChange[];
}

/**
 * Get a user's position on the leaderboard
 *
 * @param eventId - Event ID
 * @param userId - User ID
 * @returns User's leaderboard entry or null if not found
 */
export async function getUserLeaderboardPosition(
  eventId: string,
  userId: string
): Promise<LeaderboardEntryWithChange | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('leaderboard')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch user position: ${error.message}`);
  }

  return {
    ...data,
    rank_change: data.previous_rank > 0
      ? data.previous_rank - data.rank
      : 0,
    is_new: data.previous_rank === 0,
  } as LeaderboardEntryWithChange;
}

// =============================================================================
// GROUP LEADERBOARD FUNCTIONS
// =============================================================================

/**
 * Get the leaderboard for a group
 *
 * Uses the group_members table which has its own score tracking.
 *
 * @param groupId - Group ID (UUID or group_id string)
 * @param limit - Optional limit on number of entries (default: all)
 * @returns Group leaderboard entries ordered by score
 */
export async function getGroupLeaderboard(
  groupId: string,
  limit?: number
): Promise<GroupLeaderboardEntry[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // First, try to find the group by UUID
  let groupUuid = groupId;

  // If the groupId is not a UUID format, look it up
  if (!groupId.includes('-') || groupId.length < 36) {
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('group_id', groupId)
      .single();

    if (groupError) {
      if (groupError.code === 'PGRST116') {
        return [];
      }
      throw new Error(`Failed to fetch group: ${groupError.message}`);
    }
    groupUuid = group.id;
  }

  let query = supabaseAdmin
    .from('group_members')
    .select('*')
    .eq('group_id', groupUuid)
    .order('score', { ascending: false });

  if (limit && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch group leaderboard: ${error.message}`);
  }

  // Add rank based on position
  return (data || []).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  })) as GroupLeaderboardEntry[];
}

/**
 * Update a user's score in a group
 *
 * @param groupId - Group UUID
 * @param userId - User UUID
 * @param scoreDelta - Points to add (can be negative)
 */
export async function updateGroupMemberScore(
  groupId: string,
  userId: string,
  scoreDelta: number
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Use the database function for atomic update
  const { error } = await supabaseAdmin.rpc('update_group_member_score', {
    p_group_id: groupId,
    p_user_id: userId,
    p_score_delta: scoreDelta,
  });

  if (error) {
    throw new Error(`Failed to update group member score: ${error.message}`);
  }
}

/**
 * Sync group members' scores from the main leaderboard
 *
 * Updates all group members' scores based on their event leaderboard totals.
 *
 * @param groupId - Group UUID
 * @param eventId - Event ID to pull scores from
 */
export async function syncGroupScoresFromLeaderboard(
  groupId: string,
  eventId: string
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Get all group members
  const { data: members, error: membersError } = await supabaseAdmin
    .from('group_members')
    .select('id, user_id')
    .eq('group_id', groupId);

  if (membersError) {
    throw new Error(`Failed to fetch group members: ${membersError.message}`);
  }

  // Get leaderboard scores for event
  const { data: leaderboard, error: leaderboardError } = await supabaseAdmin
    .from('leaderboard')
    .select('user_id, total_score')
    .eq('event_id', eventId);

  if (leaderboardError) {
    throw new Error(`Failed to fetch leaderboard: ${leaderboardError.message}`);
  }

  // Create score lookup
  const scoreMap = new Map<string, number>();
  for (const entry of leaderboard || []) {
    scoreMap.set(entry.user_id, entry.total_score);
  }

  // Update each member's score
  for (const member of members || []) {
    const score = scoreMap.get(member.user_id) || 0;
    const { error: updateError } = await supabaseAdmin
      .from('group_members')
      .update({ score })
      .eq('id', member.id);

    if (updateError) {
      console.error(`Failed to update member score: ${updateError.message}`);
    }
  }
}

// =============================================================================
// STATISTICS FUNCTIONS
// =============================================================================

/**
 * Get leaderboard statistics for an event
 *
 * @param eventId - Event ID
 * @returns Statistics object
 */
export async function getLeaderboardStats(
  eventId: string
): Promise<{
  totalPlayers: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalMatchesScored: number;
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('leaderboard')
    .select('total_score, matches_played')
    .eq('event_id', eventId);

  if (error) {
    throw new Error(`Failed to fetch leaderboard stats: ${error.message}`);
  }

  const entries = data || [];

  if (entries.length === 0) {
    return {
      totalPlayers: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalMatchesScored: 0,
    };
  }

  const scores = entries.map((e) => e.total_score);
  const totalScore = scores.reduce((sum, s) => sum + s, 0);
  const totalMatches = entries.reduce((sum, e) => sum + e.matches_played, 0);

  return {
    totalPlayers: entries.length,
    averageScore: Math.round(totalScore / entries.length),
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    totalMatchesScored: Math.max(...entries.map((e) => e.matches_played)),
  };
}

/**
 * Get top movers (users who moved up the most in ranking)
 *
 * @param eventId - Event ID
 * @param limit - Number of top movers to return
 * @returns Array of top movers with their rank changes
 */
export async function getTopMovers(
  eventId: string,
  limit: number = 5
): Promise<LeaderboardEntryWithChange[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('leaderboard')
    .select('*')
    .eq('event_id', eventId)
    .gt('previous_rank', 0); // Only users who have a previous rank

  if (error) {
    throw new Error(`Failed to fetch top movers: ${error.message}`);
  }

  // Calculate rank changes and sort
  const withChanges = (data || [])
    .map((entry) => ({
      ...entry,
      rank_change: entry.previous_rank - entry.rank,
      is_new: false,
    }))
    .filter((entry) => entry.rank_change > 0) // Only those who moved up
    .sort((a, b) => b.rank_change - a.rank_change)
    .slice(0, limit);

  return withChanges as LeaderboardEntryWithChange[];
}
