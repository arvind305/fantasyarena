/**
 * api.js — Centralised API layer with mode-based routing.
 *
 * Modes (see config.js for full documentation):
 *   simulation — in-browser mock engine, full read/write
 *   shadow     — in-browser mock engine for reads, writes BLOCKED
 *   live       — real backend API for all operations
 *
 * Supabase Integration:
 *   When Supabase is configured (env vars set), live mode uses Supabase.
 *   When Supabase is not configured, falls back to mock engine.
 *
 * The shadow guard is enforced here at the API boundary so that
 * no UI component needs to know about modes. Components call
 * apiSubmitBets() and get either a result or a clear error.
 */

import * as engine from "./mock/engine";
import { USE_LOCAL_ENGINE, IS_SHADOW_MODE, API_BASE_URL } from "./config";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

// ── Transport helpers ──────────────────────────────────────────────────────

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function realPost(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function realGet(path) {
  const res = await fetch(apiUrl(path));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function mock(fn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try { resolve(fn()); } catch (err) { reject(err); }
    }, 150 + Math.random() * 200);
  });
}

// ── Shadow guard ───────────────────────────────────────────────────────────

/**
 * Rejects mutation calls in shadow mode with a clear, user-facing message.
 * This is the single safeguard: if IS_SHADOW_MODE is true, no bet or
 * long-term prediction submission will succeed, regardless of engine state.
 */
function shadowGuard(operationName) {
  if (IS_SHADOW_MODE) {
    return Promise.reject(
      new Error(`[SHADOW MODE] ${operationName} is disabled. The platform is running in observation mode — no predictions are accepted.`)
    );
  }
  return null; // not blocked
}

// ── Events / Matches ───────────────────────────────────────────────────────
// These always use the mock engine (static data from JSON files, not in Supabase)

export function apiGetEvents() {
  return mock(() => engine.getEvents());
}

export function apiGetMatches(filters) {
  return mock(() => engine.getMatches(filters));
}

/**
 * Returns a match with teamA, teamB (full objects) and squads array.
 * Contract: teamA and teamB are never null. squads is always an array.
 */
export function apiGetMatch(matchId) {
  return mock(() => engine.getMatch(matchId));
}

// ── Betting ────────────────────────────────────────────────────────────────

export async function apiGetBettingQuestions(matchId) {
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('match_questions')
        .select('*')
        .eq('match_id', matchId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('[api] Supabase error fetching questions, falling back to mock:', error.message);
        return mock(() => engine.getBettingQuestions(matchId));
      }

      // If no questions in Supabase, fall back to mock engine
      if (!data || data.length === 0) {
        return mock(() => engine.getBettingQuestions(matchId));
      }

      // Transform to match expected format
      return data.map(q => ({
        questionId: q.question_id,
        matchId: q.match_id,
        section: q.section,
        kind: q.kind,
        type: q.type,
        text: q.text,
        points: q.points,
        pointsWrong: q.points_wrong,
        options: q.options || [],
        slot: q.slot,
        status: q.status,
        disabled: q.disabled
      }));
    } catch (err) {
      console.warn('[api] Error fetching questions from Supabase:', err);
      return mock(() => engine.getBettingQuestions(matchId));
    }
  }
  return mock(() => engine.getBettingQuestions(matchId));
}

export async function apiSubmitBets(matchId, userId, answers) {
  const blocked = shadowGuard("Bet submission");
  if (blocked) return blocked;

  if (supabase && isSupabaseConfigured()) {
    const now = new Date().toISOString();
    const betId = `bet_${userId}_${matchId}`;
    const { data, error } = await supabase
      .from('bets')
      .upsert({
        bet_id: betId,
        user_id: userId,
        match_id: matchId,
        answers: answers,
        submitted_at: now,
        is_locked: false,
        score: null
      }, { onConflict: 'user_id,match_id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { success: true, submittedAt: data.submitted_at, isLocked: data.is_locked };
  }

  if (USE_LOCAL_ENGINE) return mock(() => engine.submitBets(matchId, userId, answers));
  return realPost(`/match/${matchId}/bets`, { userId, answers });
}

export async function apiGetUserBets(matchId, userId) {
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }
  if (USE_LOCAL_ENGINE) return mock(() => engine.getUserBets(matchId, userId));
  return realGet(`/match/${matchId}/bets/${userId}`);
}

// ── Long-term Bets ─────────────────────────────────────────────────────────
// These use mock engine for now (can migrate to Supabase later)

export function apiGetLongTermBets(eventId) {
  return mock(() => engine.getLongTermBets(eventId));
}

export function apiSubmitLongTermBets(userId, answers) {
  const blocked = shadowGuard("Long-term prediction submission");
  if (blocked) return blocked;
  return mock(() => engine.submitLongTermBets(userId, answers));
}

export function apiGetUserLongTermBets(userId) {
  return mock(() => engine.getUserLongTermBets(userId));
}

// ── Teams ──────────────────────────────────────────────────────────────────
// These always use mock engine (static data from JSON files)

export function apiGetTeams() {
  return mock(() => engine.getTeams());
}

export function apiGetTeamDetail(teamId) {
  return mock(() => engine.getTeamDetail(teamId));
}

// ── Players ────────────────────────────────────────────────────────────────
// These always use mock engine (static data from JSON files)

export function apiGetPlayers(filters) {
  return mock(() => engine.getPlayers(filters));
}

export function apiGetPlayerProfile(playerId) {
  return mock(() => engine.getPlayerProfile(playerId));
}

// ── Leaderboard ────────────────────────────────────────────────────────────

export async function apiGetLeaderboard(scope, scopeId) {
  if (supabase && isSupabaseConfigured()) {
    try {
      if (scope === 'group') {
        // Get group leaderboard - members with their scores
        const { data, error } = await supabase
          .from('group_members')
          .select('user_id, display_name, score')
          .eq('group_id', scopeId)
          .order('score', { ascending: false });
        if (error) throw error;
        return data.map((m, i) => ({
          userId: m.user_id,
          displayName: m.display_name,
          score: m.score || 0,
          totalScore: m.score || 0,
          rank: i + 1,
          matchesPlayed: 0
        }));
      } else {
        // Global leaderboard from leaderboard table
        const { data, error } = await supabase
          .from('leaderboard')
          .select('user_id, display_name, total_score, matches_played, rank, previous_rank, last_match_score')
          .order('rank', { ascending: true })
          .limit(100);

        // If empty or error, return empty leaderboard (no users yet)
        if (error || !data || data.length === 0) {
          return [];
        }

        return data.map((u, i) => ({
          userId: u.user_id,
          displayName: u.display_name,
          score: u.total_score || 0,
          totalScore: u.total_score || 0,
          total_score: u.total_score || 0,
          rank: u.rank || i + 1,
          previous_rank: u.previous_rank,
          last_match_score: u.last_match_score,
          matchesPlayed: u.matches_played || 0,
          matches_played: u.matches_played || 0
        }));
      }
    } catch (err) {
      console.warn('[api] Error fetching leaderboard from Supabase:', err);
      return mock(() => engine.getLeaderboard(scope, scopeId));
    }
  }
  return mock(() => engine.getLeaderboard(scope, scopeId));
}

// ── Groups ─────────────────────────────────────────────────────────────────

export async function apiGetGroups(userId) {
  if (supabase && isSupabaseConfigured()) {
    try {
      // First get group_ids where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);
      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        return [];
      }

      const groupIds = memberships.map(m => m.group_id);

      // Then get those groups with all their members
      const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('*, group_members(user_id, display_name, score)')
        .in('group_id', groupIds);
      if (groupError) throw groupError;

      // Transform to expected format
      return groups.map(g => ({
        groupId: g.group_id,
        name: g.name,
        joinCode: g.join_code,
        createdBy: g.created_by,
        eventId: g.event_id,
        createdAt: g.created_at,
        memberIds: g.group_members?.map(m => m.user_id) || [],
        members: g.group_members?.map(m => ({
          userId: m.user_id,
          displayName: m.display_name,
          score: m.score || 0
        })) || []
      }));
    } catch (err) {
      console.warn('[api] Error fetching groups from Supabase, falling back to mock:', err);
      return mock(() => engine.getGroups(userId));
    }
  }
  return mock(() => engine.getGroups(userId));
}

export async function apiCreateGroup(name, userId, displayName) {
  if (supabase && isSupabaseConfigured()) {
    try {
      const groupId = "g" + Date.now(); // Generate unique group_id
      const joinCode = name.slice(0, 3).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      const now = new Date().toISOString();

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          group_id: groupId,
          name,
          join_code: joinCode,
          created_by: userId,
          event_id: 't20wc_2026',
          created_at: now
        })
        .select()
        .single();
      if (groupError) throw groupError;

      // Add creator as first member (use group_id TEXT, not id UUID)
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          display_name: displayName,
          score: 0,
          joined_at: now
        });
      if (memberError) throw memberError;

      return {
        groupId: groupId,
        name: group.name,
        joinCode: group.join_code,
        createdBy: group.created_by,
        createdAt: group.created_at,
        memberIds: [userId],
        members: [{ userId, displayName, score: 0 }]
      };
    } catch (err) {
      console.error('[api] Error creating group in Supabase:', err);
      throw new Error(err.message || 'Failed to create group');
    }
  }
  return mock(() => engine.createGroup(name, userId, displayName));
}

export async function apiJoinGroup(joinCode, userId, displayName) {
  if (supabase && isSupabaseConfigured()) {
    // Find group by join code
    const { data: group, error: findError } = await supabase
      .from('groups')
      .select('*')
      .eq('join_code', joinCode)
      .single();
    if (findError) throw new Error('INVALID_GROUP_CODE');

    // Check if already a member (use group_id TEXT)
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.group_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (existingMember) throw new Error('ALREADY_A_MEMBER');

    // Add user to group (use group_id TEXT)
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.group_id,
        user_id: userId,
        display_name: displayName,
        score: 0,
        joined_at: new Date().toISOString()
      });
    if (joinError) throw new Error(joinError.message);

    // Return group with updated members
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, display_name, score')
      .eq('group_id', group.group_id);

    return {
      groupId: group.group_id,
      name: group.name,
      joinCode: group.join_code,
      createdBy: group.created_by,
      createdAt: group.created_at,
      memberIds: members.map(m => m.user_id),
      members: members.map(m => ({ userId: m.user_id, displayName: m.display_name, score: m.score }))
    };
  }
  if (USE_LOCAL_ENGINE) return mock(() => engine.joinGroup(joinCode, userId, displayName));
  return realPost("/groups/join", { joinCode, userId, displayName });
}

export async function apiGetGroupDetail(groupId) {
  if (supabase && isSupabaseConfigured()) {
    // Query by group_id (TEXT), not id (UUID)
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('group_id', groupId)
      .single();
    if (groupError) throw new Error('Group not found');

    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, display_name, score')
      .eq('group_id', groupId)
      .order('score', { ascending: false });
    if (membersError) throw new Error(membersError.message);

    return {
      groupId: group.group_id,
      name: group.name,
      joinCode: group.join_code,
      createdBy: group.created_by,
      createdAt: group.created_at,
      memberIds: members.map(m => m.user_id),
      members: members.map(m => ({ userId: m.user_id, displayName: m.display_name, score: m.score })),
      leaderboard: members.map((m, i) => ({
        userId: m.user_id,
        displayName: m.display_name,
        score: m.score || 0,
        rank: i + 1
      }))
    };
  }
  if (USE_LOCAL_ENGINE) return mock(() => engine.getGroupDetail(groupId));
  return realGet(`/groups/${groupId}`);
}

// ── Profile ────────────────────────────────────────────────────────────────
// Uses mock engine for now (can migrate to Supabase later)

export function apiGetProfile(userId) {
  return mock(() => engine.getProfile(userId));
}

// ── Admin: Question Management ─────────────────────────────────────────────

export async function apiSaveMatchQuestions(matchId, questions) {
  if (supabase && isSupabaseConfigured()) {
    // Delete existing questions for this match
    const { error: deleteError } = await supabase
      .from('match_questions')
      .delete()
      .eq('match_id', matchId);
    if (deleteError) throw new Error(deleteError.message);

    // Insert new questions
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q, idx) => ({
        question_id: q.questionId,
        match_id: matchId,
        section: q.section,
        kind: q.kind,
        type: q.type,
        text: q.text,
        points: q.points || 10,
        points_wrong: q.pointsWrong || 0,
        options: q.options || [],
        slot: q.slot || null,
        status: 'OPEN',
        sort_order: idx,
        disabled: q.disabled || false
      }));

      const { error: insertError } = await supabase
        .from('match_questions')
        .insert(questionsToInsert);
      if (insertError) throw new Error(insertError.message);
    }

    return { success: true, count: questions.length };
  }
  if (USE_LOCAL_ENGINE) return mock(() => engine.saveMatchQuestions(matchId, questions));
  return realPost(`/admin/${matchId}/questions`, { questions });
}

// ── Admin: Match Results & Scoring ──────────────────────────────────────────

/**
 * Save match results including winner, runs, player stats, and side bet answers.
 */
export async function apiSaveMatchResults(matchId, resultsPayload) {
  if (supabase && isSupabaseConfigured()) {
    // Determine winner from result
    let winner = null;
    if (resultsPayload.result === 'TEAM_A') {
      winner = resultsPayload.teamA?.id || resultsPayload.teamAId;
    } else if (resultsPayload.result === 'TEAM_B') {
      winner = resultsPayload.teamB?.id || resultsPayload.teamBId;
    } else if (resultsPayload.result === 'TIE') {
      winner = 'TIE';
    } else if (resultsPayload.result === 'NO_RESULT') {
      winner = 'NO_RESULT';
    }

    const { error } = await supabase
      .from('match_results')
      .upsert({
        match_id: matchId,
        winner: winner,
        total_runs: resultsPayload.totalRuns,
        player_stats: resultsPayload.playerStats,
        side_bet_answers: resultsPayload.sideBetAnswers,
        man_of_match: resultsPayload.manOfMatch,
        completed_at: new Date().toISOString()
      }, { onConflict: 'match_id' });

    if (error) throw new Error(error.message);
    return { success: true, matchId };
  }

  return realPost(`/admin/${matchId}/results`, resultsPayload);
}

/**
 * Calculate scores for a match using Supabase RPC (no backend required).
 * @param {string} matchId - The match ID to score
 * @param {string} eventId - The event ID for leaderboard update (defaults to 't20wc_2026')
 */
export async function apiCalculateMatchScores(matchId, eventId = 't20wc_2026') {
  if (supabase && isSupabaseConfigured()) {
    // First, lock all bets for this match
    const { error: lockError } = await supabase
      .from('bets')
      .update({ is_locked: true })
      .eq('match_id', matchId);

    if (lockError) {
      console.warn('[api] Failed to lock bets:', lockError.message);
    }

    // Use Supabase RPC function directly (no backend needed)
    const { data, error } = await supabase.rpc('calculate_match_scores', {
      p_match_id: matchId,
      p_event_id: eventId
    });

    if (error) {
      // If RPC doesn't exist, provide helpful error message
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        throw new Error(
          'Scoring function not installed. Go to Supabase Dashboard > SQL Editor and run the SQL from src/db/admin-scoring-function.sql'
        );
      }
      throw new Error(error.message);
    }

    if (data && data.success === false) {
      throw new Error(data.error || 'Scoring failed');
    }

    return {
      success: true,
      message: `Scored ${data?.betsScored || 0} bets for match ${matchId}`,
      ...data
    };
  }

  throw new Error('Supabase not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
}

/**
 * Get match results by match ID.
 */
export async function apiGetMatchResults(matchId) {
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('match_results')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    // Transform to camelCase
    return {
      matchId: data.match_id,
      winner: data.winner,
      totalRuns: data.total_runs,
      playerStats: data.player_stats,
      sideBetAnswers: data.side_bet_answers,
      manOfMatch: data.man_of_match,
      completedAt: data.completed_at
    };
  }

  return realGet(`/admin/${matchId}/results`);
}

/**
 * Lock all bets for a specific match.
 */
export async function apiLockMatchBets(matchId) {
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('bets')
      .update({ is_locked: true })
      .eq('match_id', matchId)
      .select('bet_id');

    if (error) throw new Error(error.message);

    return {
      success: true,
      lockedCount: data ? data.length : 0
    };
  }

  return realPost(`/admin/${matchId}/lock-bets`, {});
}
