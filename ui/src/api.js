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
    console.log("[api] Submitting bet to Supabase:", matchId, userId);
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
      }, { onConflict: 'bet_id' })
      .select()
      .single();
    if (error) {
      console.error("[api] Supabase bet submission failed:", error.message);
      throw new Error(error.message);
    }
    console.log("[api] Bet saved to Supabase successfully");
    return data;
  }

  // WARNING: Supabase not configured - bets go to localStorage only!
  console.warn("[api] WARNING: Supabase not configured! Bet going to localStorage only - may be lost!");
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

// ── V2 Betting (match_config-based) ─────────────────────────────────────────

/**
 * Fetch match_config, player_slots, and side_bets for a match.
 * Returns { config, slots, sideBets } or null if no config exists.
 */
export async function apiGetMatchConfig(matchId) {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const [configRes, slotsRes, sideBetsRes] = await Promise.all([
      supabase.from('match_config').select('*').eq('match_id', matchId).maybeSingle(),
      supabase.from('player_slots').select('*').eq('match_id', matchId).order('slot_number', { ascending: true }),
      supabase.from('side_bets').select('*').eq('match_id', matchId).order('display_order', { ascending: true }),
    ]);

    if (configRes.error) throw configRes.error;
    if (!configRes.data) return null;

    return {
      config: {
        configId: configRes.data.config_id,
        matchId: configRes.data.match_id,
        eventId: configRes.data.event_id,
        winnerBasePoints: configRes.data.winner_base_points,
        superOverMultiplier: parseFloat(configRes.data.super_over_multiplier),
        totalRunsBasePoints: configRes.data.total_runs_base_points,
        playerSlotsEnabled: configRes.data.player_slots_enabled,
        playerSlotCount: configRes.data.player_slot_count,
        runnersEnabled: configRes.data.runners_enabled,
        runnerCount: configRes.data.runner_count,
        lockTime: configRes.data.lock_time,
        teamA: configRes.data.team_a,
        teamB: configRes.data.team_b,
        status: configRes.data.status,
      },
      slots: (slotsRes.data || []).map(s => ({
        slotId: s.slot_id,
        matchId: s.match_id,
        slotNumber: s.slot_number,
        multiplier: parseFloat(s.multiplier),
        isEnabled: s.is_enabled,
      })),
      sideBets: (sideBetsRes.data || []).map(sb => ({
        sideBetId: sb.side_bet_id,
        matchId: sb.match_id,
        questionText: sb.question_text,
        options: sb.options || [],
        correctAnswer: sb.correct_answer,
        pointsCorrect: sb.points_correct,
        pointsWrong: sb.points_wrong,
        displayOrder: sb.display_order,
        status: sb.status,
      })),
    };
  } catch (err) {
    console.warn('[api] Error fetching match config:', err);
    return null;
  }
}

/**
 * Fetch players for a team by team_code and event_id.
 * Returns array of { playerId, playerName, playerRole, isCaptain }.
 */
export async function apiGetSquadPlayers(teamCode, eventId = 't20wc_2026') {
  if (!supabase || !isSupabaseConfigured()) return [];

  try {
    // First get squad_id for this team
    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .select('squad_id')
      .eq('team_code', teamCode.toUpperCase())
      .eq('event_id', eventId)
      .maybeSingle();

    if (squadError || !squad) return [];

    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('player_id, player_name, player_role, is_captain, is_active')
      .eq('squad_id', squad.squad_id)
      .eq('is_active', true)
      .order('player_name', { ascending: true });

    if (playersError) return [];

    return (players || []).map(p => ({
      playerId: p.player_id,
      playerName: p.player_name,
      playerRole: p.player_role,
      isCaptain: p.is_captain,
    }));
  } catch (err) {
    console.warn('[api] Error fetching squad players:', err);
    return [];
  }
}

/**
 * Search users for runner selection. Searches leaderboard and user_profiles.
 * Returns array of { userId, displayName }.
 */
export async function apiSearchUsers(query) {
  if (!supabase || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('user_id, display_name')
      .ilike('display_name', `%${query}%`)
      .limit(20);

    if (error) throw error;

    return (data || []).map(u => ({
      userId: u.user_id,
      displayName: u.display_name,
    }));
  } catch (err) {
    console.warn('[api] Error searching users:', err);
    return [];
  }
}

/**
 * Submit a V2 bet (with player_picks, side_bet_answers, runner_picks).
 */
export async function apiSubmitBetV2(matchId, userId, betData) {
  const blocked = shadowGuard("Bet submission");
  if (blocked) return blocked;

  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Cannot submit bets.');
  }

  const now = new Date().toISOString();
  const betId = `bet_${userId}_${matchId}`;

  const { data, error } = await supabase
    .from('bets')
    .upsert({
      bet_id: betId,
      user_id: userId,
      match_id: matchId,
      answers: betData.answers || {},
      player_picks: betData.playerPicks || [],
      runner_picks: betData.runnerPicks || [],
      side_bet_answers: betData.sideBetAnswers || {},
      submitted_at: now,
      is_locked: false,
      score: null,
    }, { onConflict: 'bet_id' })
    .select()
    .single();

  if (error) {
    console.error("[api] V2 bet submission failed:", error.message);
    throw new Error(error.message);
  }

  return data;
}

// ── Long-term Bets ─────────────────────────────────────────────────────────

/**
 * Fetch long_term_bets_config from Supabase. Falls back to mock engine.
 */
export async function apiGetLongTermConfig(eventId = 't20wc_2026') {
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('long_term_bets_config')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        configId: data.config_id,
        eventId: data.event_id,
        winnerPoints: data.winner_points,
        finalistPoints: data.finalist_points,
        finalFourPoints: data.final_four_points,
        orangeCapPoints: data.orange_cap_points,
        purpleCapPoints: data.purple_cap_points,
        lockTime: data.lock_time,
        isLocked: data.is_locked,
        changeCostPercent: parseFloat(data.change_cost_percent),
        allowChanges: data.allow_changes,
      };
    } catch (err) {
      console.warn('[api] Error fetching long-term config:', err);
      return null;
    }
  }
  return null;
}

/**
 * Submit or update long-term bets to Supabase.
 */
export async function apiSubmitLongTermBet(eventId, userId, predictions) {
  const blocked = shadowGuard("Long-term prediction submission");
  if (blocked) return blocked;

  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Cannot submit long-term bets.');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('long_term_bets')
    .upsert({
      event_id: eventId,
      user_id: userId,
      winner_team: predictions.winnerTeam || null,
      finalist_teams: predictions.finalistTeams || [],
      final_four_teams: predictions.finalFourTeams || [],
      orange_cap_players: predictions.orangeCapPlayers || [],
      purple_cap_players: predictions.purpleCapPlayers || [],
      updated_at: now,
    }, { onConflict: 'event_id,user_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return { success: true, submittedAt: data.updated_at };
}

/**
 * Fetch user's existing long-term bet.
 */
export async function apiGetUserLongTermBet(eventId, userId) {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('long_term_bets')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      betId: data.bet_id,
      winnerTeam: data.winner_team,
      finalistTeams: data.finalist_teams || [],
      finalFourTeams: data.final_four_teams || [],
      orangeCapPlayers: data.orange_cap_players || [],
      purpleCapPlayers: data.purple_cap_players || [],
      isScored: data.is_scored,
      totalPoints: data.total_points,
      pointsBreakdown: data.points_breakdown,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('[api] Error fetching user long-term bet:', err);
    return null;
  }
}

/**
 * Fetch all squads (teams) from Supabase.
 * Returns array of { squadId, teamCode, teamName }.
 */
export async function apiGetSquads(eventId = 't20wc_2026') {
  if (!supabase || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('squads')
      .select('squad_id, team_code, team_name')
      .eq('event_id', eventId)
      .order('team_name', { ascending: true });

    if (error) throw error;

    return (data || []).map(s => ({
      squadId: s.squad_id,
      teamCode: s.team_code,
      teamName: s.team_name,
    }));
  } catch (err) {
    console.warn('[api] Error fetching squads:', err);
    return [];
  }
}

/**
 * Fetch all players across all squads for a given event.
 * Returns array of { playerId, playerName, playerRole, teamCode }.
 */
export async function apiGetAllPlayers(eventId = 't20wc_2026') {
  if (!supabase || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, player_name, player_role, is_captain, squads!inner(team_code)')
      .eq('is_active', true)
      .eq('squads.event_id', eventId)
      .order('player_name', { ascending: true });

    if (error) throw error;

    return (data || []).map(p => ({
      playerId: p.player_id,
      playerName: p.player_name,
      playerRole: p.player_role,
      isCaptain: p.is_captain,
      teamCode: p.squads?.team_code,
    }));
  } catch (err) {
    console.warn('[api] Error fetching all players:', err);
    return [];
  }
}

// Legacy long-term bets (mock engine, kept for backward compatibility)

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
