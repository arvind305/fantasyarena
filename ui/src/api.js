/**
 * api.js — Centralised API layer.
 *
 * All data comes from Supabase. Match schedule data (venue, time, stage) is loaded
 * from static JSON files and merged with Supabase match_config for live status.
 */

import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { buildTeamObject, TEAM_NAMES, TEAM_CODE_TO_ID } from "./data/teams";
import { authenticatedPost } from "./lib/apiClient";
import { mapDbStatusToUiStatus } from "./utils/matchStatus";
import { CURRENT_TOURNAMENT } from "./config/tournament";

// ── Static match schedule cache ────────────────────────────────────────────
// Venue, scheduledTime, stage etc. come from the static JSON. This data never
// changes — it's the tournament fixture list.

let _scheduleCache = null;
let _schedulePromise = null;

async function getMatchSchedule() {
  if (_scheduleCache) return _scheduleCache;
  if (_schedulePromise) return _schedulePromise;

  _schedulePromise = (async () => {
    try {
      const res = await fetch(CURRENT_TOURNAMENT.dataFile);
      if (!res.ok) throw new Error(`Failed to load schedule: ${res.status}`);
      const data = await res.json();

      const map = {};
      const super8 = data.super8_seeding || {};

      data.matches.forEach((m) => {
        const matchId = `${CURRENT_TOURNAMENT.matchIdPrefix}${m.match_id}`;
        let teamA = m.teams[0];
        let teamB = m.teams[1];
        if (super8[teamA]) teamA = super8[teamA];
        if (super8[teamB]) teamB = super8[teamB];

        map[matchId] = {
          matchId,
          teamA,
          teamB,
          scheduledTime: new Date(`${m.date}T${m.time_gmt}:00Z`).toISOString(),
          venue: `${m.venue}, ${m.city}`,
          stage: m.stage,
          group: m.group,
          isTbc: m.is_tbc,
        };
      });

      _scheduleCache = { map, tournament: data.tournament };
      return _scheduleCache;
    } catch (err) {
      console.warn("[api] Failed to load match schedule:", err);
      _schedulePromise = null;
      return { map: {}, tournament: null };
    }
  })();

  return _schedulePromise;
}

// ── Events / Matches ───────────────────────────────────────────────────────

export async function apiGetEvents() {
  const schedule = await getMatchSchedule();
  const t = schedule.tournament;
  return [{
    eventId: t?.id || CURRENT_TOURNAMENT.id,
    name: t?.name || CURRENT_TOURNAMENT.name,
    sport: "cricket",
    format: "t20",
    status: "Ongoing",
    startDate: "2026-02-07T00:00:00Z",
    endDate: "2026-03-08T00:00:00Z",
  }];
}

/**
 * Returns all matches with schedule + live status from Supabase.
 */
export async function apiGetMatches() {
  const schedule = await getMatchSchedule();
  const matchMap = schedule.map;

  // Get live status + results from Supabase
  let statusMap = {};
  let resultMap = {};

  if (supabase && isSupabaseConfigured()) {
    const [configRes, resultsRes] = await Promise.all([
      supabase.from("match_config").select("match_id, team_a, team_b, status, lock_time"),
      supabase.from("match_results").select("match_id, winner"),
    ]);
    if (configRes.data) {
      configRes.data.forEach((c) => {
        statusMap[c.match_id] = { status: c.status, teamA: c.team_a, teamB: c.team_b, lockTime: c.lock_time };
      });
    }
    if (resultsRes.data) {
      resultsRes.data.forEach((r) => { resultMap[r.match_id] = r.winner; });
    }
  }

  // Merge schedule + live data
  return Object.values(matchMap).map((m) => {
    const live = statusMap[m.matchId];
    const winner = resultMap[m.matchId];
    const teamA = live?.teamA || m.teamA;
    const teamB = live?.teamB || m.teamB;

    const dbStatus = live?.status;
    const status = mapDbStatusToUiStatus(dbStatus);

    // Build result text (suppress for OPEN matches — they've been re-opened for editing)
    let result = null;
    if (dbStatus !== "OPEN" && winner && winner !== "NO_RESULT") {
      if (winner === "TIE") {
        result = "Match Tied";
      } else {
        // Handle both team codes (e.g. "PAK") and option IDs (e.g. "opt_wc_m1_winner_teamA")
        let winnerCode = winner;
        const optMatch = winner.match(/^opt_[^_]+_[^_]+_winner_(.+)$/);
        if (optMatch) {
          const suffix = optMatch[1];
          if (suffix === "teamA") winnerCode = teamA;
          else if (suffix === "teamB") winnerCode = teamB;
          else if (suffix === "tie") { result = "Match Tied"; }
          else if (suffix === "no_result") { result = "No Result"; }
          else if (suffix.includes("super") && suffix.includes("over")) { result = "Super Over"; }
          else winnerCode = winner;
        }
        if (!result) {
          const winnerName = TEAM_NAMES[TEAM_CODE_TO_ID[winnerCode]] || winnerCode;
          result = `${winnerName} won`;
        }
      }
    } else if (dbStatus !== "OPEN" && winner === "NO_RESULT") {
      result = "No Result";
    }

    return {
      matchId: m.matchId,
      eventId: CURRENT_TOURNAMENT.id,
      teamA,
      teamB,
      scheduledTime: m.scheduledTime,
      venue: m.venue,
      status,
      dbStatus: dbStatus || null,
      lockTime: live?.lockTime || null,
      result,
      stage: m.stage,
      group: m.group,
      isTbc: m.isTbc,
    };
  });
}

/**
 * Returns a single match with full teamA/teamB objects and squads.
 * Contract: teamA and teamB are never null. squads is always an array.
 */
export async function apiGetMatch(matchId) {
  const schedule = await getMatchSchedule();
  const sched = schedule.map[matchId];
  if (!sched) throw new Error("Match not found");

  // Get live data from Supabase
  let teamACode = sched.teamA;
  let teamBCode = sched.teamB;
  let status = "UPCOMING";
  let result = null;

  if (supabase && isSupabaseConfigured()) {
    const [configRes, resultRes] = await Promise.all([
      supabase.from("match_config").select("team_a, team_b, status").eq("match_id", matchId).maybeSingle(),
      supabase.from("match_results").select("winner").eq("match_id", matchId).maybeSingle(),
    ]);
    if (configRes.data) {
      teamACode = configRes.data.team_a || teamACode;
      teamBCode = configRes.data.team_b || teamBCode;
      status = mapDbStatusToUiStatus(configRes.data.status);
    }
    if (resultRes.data?.winner) {
      const w = resultRes.data.winner;
      if (w === "TIE") result = "Match Tied";
      else if (w === "NO_RESULT") result = "No Result";
      else result = `${TEAM_NAMES[TEAM_CODE_TO_ID[w]] || w} won`;
    }
  }

  return {
    matchId: sched.matchId,
    eventId: CURRENT_TOURNAMENT.id,
    teamA: buildTeamObject(teamACode),
    teamB: buildTeamObject(teamBCode),
    scheduledTime: sched.scheduledTime,
    venue: sched.venue,
    status,
    result,
    stage: sched.stage,
    group: sched.group,
    squads: [],
  };
}

// ── Betting ────────────────────────────────────────────────────────────────

export async function apiGetUserBets(matchId, userId) {
  if (!supabase || !isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// ── V2 Betting (match_config-based) ─────────────────────────────────────────

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
        winnerWrongPoints: configRes.data.winner_wrong_points || 0,
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

export async function apiGetSquadPlayers(teamCode, eventId = CURRENT_TOURNAMENT.id) {
  if (!supabase || !isSupabaseConfigured()) return [];

  try {
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

export async function apiSearchUsers(query) {
  if (!supabase || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('user_id, display_name')
      .eq('event_id', CURRENT_TOURNAMENT.id)
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

export async function apiSubmitBetV2(matchId, userId, betData) {
  const result = await authenticatedPost('/api/submit-bet', {
    matchId,
    answers: betData.answers || {},
    playerPicks: betData.playerPicks || [],
    runnerPicks: betData.runnerPicks || [],
    sideBetAnswers: betData.sideBetAnswers || {},
    version: 'v2',
  });
  return result.data;
}

// ── Long-term Bets ─────────────────────────────────────────────────────────

export async function apiGetLongTermConfig(eventId = CURRENT_TOURNAMENT.id) {
  if (!supabase || !isSupabaseConfigured()) return null;

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
      actualWinner: data.actual_winner || null,
      actualFinalists: data.actual_finalists || [],
      actualFinalFour: data.actual_final_four || [],
      actualOrangeCap: data.actual_orange_cap || null,
      actualPurpleCap: data.actual_purple_cap || null,
    };
  } catch (err) {
    console.warn('[api] Error fetching long-term config:', err);
    return null;
  }
}

export async function apiSubmitLongTermBet(eventId, userId, predictions) {
  const result = await authenticatedPost('/api/submit-long-term-bet', {
    eventId,
    predictions,
  });
  return result;
}

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

// ── Teams / Squads ──────────────────────────────────────────────────────────

export async function apiGetSquads(eventId = CURRENT_TOURNAMENT.id) {
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

// ── Players ────────────────────────────────────────────────────────────────

export async function apiGetAllPlayers(eventId = CURRENT_TOURNAMENT.id) {
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

/**
 * Get a single player profile from Supabase.
 * Returns { name, role, nationality, team, playerId }.
 */
export async function apiGetPlayerProfile(playerId) {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error("Player not found");
  }

  const { data, error } = await supabase
    .from('players')
    .select('player_id, player_name, player_role, is_captain, squads!inner(team_code, team_name)')
    .eq('player_id', playerId)
    .maybeSingle();

  if (error || !data) throw new Error("Player not found");

  const teamCode = data.squads?.team_code;
  const teamId = TEAM_CODE_TO_ID[teamCode] || teamCode?.toLowerCase();

  return {
    playerId: data.player_id,
    name: data.player_name,
    role: data.player_role,
    isCaptain: data.is_captain,
    nationality: data.squads?.team_name || teamCode,
    teamId,
    team: buildTeamObject(teamCode),
  };
}

// ── Leaderboard ────────────────────────────────────────────────────────────

export async function apiGetLeaderboard(scope, scopeId, { page = 1, pageSize = 50 } = {}) {
  if (!supabase || !isSupabaseConfigured()) return { data: [], total: 0 };

  try {
    if (scope === 'group') {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, display_name, score')
        .eq('group_id', scopeId)
        .order('score', { ascending: false });
      if (error) throw error;
      return {
        data: data.map((m, i) => ({
          userId: m.user_id,
          displayName: m.display_name,
          score: m.score || 0,
          totalScore: m.score || 0,
          rank: i + 1,
          matchesPlayed: 0
        })),
        total: data.length,
      };
    } else {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Try with all columns first, fall back if optional columns are missing
      let data, error, count;
      const baseQuery = () => supabase
        .from('leaderboard')
        .select('user_id, display_name, total_score, matches_played, rank, previous_rank, last_match_score', { count: 'exact' })
        .eq('event_id', CURRENT_TOURNAMENT.id)
        .order('total_score', { ascending: false })
        .range(from, to);

      const result = await baseQuery();
      data = result.data;
      error = result.error;
      count = result.count;

      // If optional columns don't exist, retry without them
      if (error && (error.code === '42703' || error.message?.includes('column'))) {
        console.warn('[api] Retrying leaderboard query without optional columns');
        const retry = await supabase
          .from('leaderboard')
          .select('user_id, display_name, total_score, matches_played, rank', { count: 'exact' })
          .eq('event_id', CURRENT_TOURNAMENT.id)
          .order('total_score', { ascending: false })
          .range(from, to);
        if (retry.error || !retry.data) return { data: [], total: 0 };
        return {
          data: retry.data.map((u, i) => ({
            userId: u.user_id, displayName: u.display_name,
            score: u.total_score || 0, totalScore: u.total_score || 0, total_score: u.total_score || 0,
            rank: u.rank || from + i + 1, previous_rank: null, last_match_score: null,
            matchesPlayed: u.matches_played || 0, matches_played: u.matches_played || 0
          })),
          total: retry.count || 0,
        };
      }

      if (error) {
        console.error('[api] Leaderboard query error:', error.message, error.code);
        return { data: [], total: 0 };
      }

      if (!data || data.length === 0) return { data: [], total: count || 0 };

      return {
        data: data.map((u, i) => ({
          userId: u.user_id,
          displayName: u.display_name,
          score: u.total_score || 0,
          totalScore: u.total_score || 0,
          total_score: u.total_score || 0,
          rank: u.rank || from + i + 1,
          previous_rank: u.previous_rank,
          last_match_score: u.last_match_score,
          matchesPlayed: u.matches_played || 0,
          matches_played: u.matches_played || 0
        })),
        total: count || 0,
      };
    }
  } catch (err) {
    console.warn('[api] Error fetching leaderboard:', err);
    return { data: [], total: 0 };
  }
}

// ── Groups ─────────────────────────────────────────────────────────────────

export async function apiGetGroups(userId) {
  if (!userId) return [];
  if (!supabase || !isSupabaseConfigured()) return [];

  try {
    const { data: memberships, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
    if (memberError) throw memberError;
    if (!memberships || memberships.length === 0) return [];

    const groupIds = memberships.map(m => m.group_id);
    const { data: groups, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .in('group_id', groupIds);
    if (groupError) throw groupError;

    // Fetch members separately (no FK relationship in schema)
    const { data: allMembers } = await supabase
      .from('group_members')
      .select('group_id, user_id, display_name')
      .in('group_id', groupIds);

    // Pull actual scores from the main leaderboard
    const allUserIds = [...new Set((allMembers || []).map(m => m.user_id))];
    const { data: lbRows } = allUserIds.length > 0
      ? await supabase.from('leaderboard').select('user_id, total_score').eq('event_id', CURRENT_TOURNAMENT.id).in('user_id', allUserIds)
      : { data: [] };
    const scoreMap = {};
    (lbRows || []).forEach(r => { scoreMap[r.user_id] = r.total_score || 0; });

    const membersByGroup = {};
    (allMembers || []).forEach(m => {
      if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
      membersByGroup[m.group_id].push(m);
    });

    return groups.map(g => {
      const gMembers = membersByGroup[g.group_id] || [];
      return {
        groupId: g.group_id,
        name: g.name,
        joinCode: g.join_code,
        createdBy: g.created_by,
        eventId: g.event_id,
        createdAt: g.created_at,
        memberIds: gMembers.map(m => m.user_id),
        members: gMembers.map(m => ({
          userId: m.user_id,
          displayName: m.display_name,
          score: scoreMap[m.user_id] || 0
        }))
      };
    });
  } catch (err) {
    console.warn('[api] Error fetching groups:', err);
    return [];
  }
}

export async function apiCreateGroup(name, userId, displayName) {
  const result = await authenticatedPost('/api/groups', {
    action: 'create',
    name,
    displayName,
  });
  return result.group;
}

export async function apiJoinGroup(joinCode, userId, displayName) {
  const result = await authenticatedPost('/api/groups', {
    action: 'join',
    joinCode,
    displayName,
  });
  return result.group;
}

export async function apiGetGroupDetail(groupId) {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error("Supabase not configured.");
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('group_id', groupId)
    .single();
  if (groupError) throw new Error('Group not found');

  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id, display_name')
    .eq('group_id', groupId);
  if (membersError) throw new Error(membersError.message);

  // Pull actual scores from the main leaderboard table
  const memberIds = members.map(m => m.user_id);
  const { data: lbRows } = await supabase
    .from('leaderboard')
    .select('user_id, total_score, matches_played')
    .eq('event_id', CURRENT_TOURNAMENT.id)
    .in('user_id', memberIds);
  const scoreMap = {};
  (lbRows || []).forEach(r => { scoreMap[r.user_id] = r.total_score || 0; });

  // Merge and sort by score descending
  const merged = members.map(m => ({
    userId: m.user_id,
    displayName: m.display_name,
    score: scoreMap[m.user_id] || 0,
  })).sort((a, b) => b.score - a.score);

  return {
    groupId: group.group_id,
    name: group.name,
    joinCode: group.join_code,
    createdBy: group.created_by,
    createdAt: group.created_at,
    memberIds: merged.map(m => m.userId),
    members: merged,
    leaderboard: merged.map((m, i) => ({
      userId: m.userId,
      displayName: m.displayName,
      score: m.score,
      rank: i + 1
    }))
  };
}

// ── Admin: Match Results & Scoring ──────────────────────────────────────────

export async function apiSaveMatchResults(matchId, resultsPayload) {
  // Translate result codes to winner team code (client-side translation)
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

  return authenticatedPost('/api/admin/operations', {
    action: 'setMatchResults',
    matchId,
    results: {
      winner,
      totalRuns: resultsPayload.totalRuns,
      sideBetAnswers: resultsPayload.sideBetAnswers,
      manOfMatch: resultsPayload.manOfMatch,
    },
  });
}

export async function apiCalculateMatchScores(matchId, eventId = CURRENT_TOURNAMENT.id) {
  return authenticatedPost('/api/admin/operations', {
    action: 'triggerScoring',
    matchId,
    eventId,
  });
}

export async function apiGetMatchResults(matchId) {
  if (!supabase || !isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('match_results')
    .select('*')
    .eq('match_id', matchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

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

// ── Match Report & Bet Viewing ──────────────────────────────────────────────

/**
 * Fetch everything needed for the admin match report.
 * Returns { config, results, bets[], playerStats[], sideBets[], slots[], userNames{} }
 */
export async function apiGetMatchReport(matchId) {
  if (!supabase || !isSupabaseConfigured()) return null;

  const [configRes, resultsRes, betsRes, statsRes, sideBetsRes, slotsRes, lbRes] = await Promise.all([
    supabase.from('match_config').select('*').eq('match_id', matchId).maybeSingle(),
    supabase.from('match_results').select('*').eq('match_id', matchId).maybeSingle(),
    supabase.from('bets').select('*').eq('match_id', matchId),
    supabase.from('player_match_stats')
      .select('*, players!inner(player_name, squads!inner(team_code))')
      .eq('match_id', matchId)
      .order('total_fantasy_points', { ascending: false }),
    supabase.from('side_bets').select('*').eq('match_id', matchId).order('display_order', { ascending: true }),
    supabase.from('player_slots').select('*').eq('match_id', matchId).order('slot_number', { ascending: true }),
    supabase.from('leaderboard').select('user_id, display_name').eq('event_id', CURRENT_TOURNAMENT.id),
  ]);

  if (configRes.error) throw new Error(configRes.error.message);

  // Build user display name map
  const userNames = {};
  (lbRes.data || []).forEach(u => { userNames[u.user_id] = u.display_name; });

  return {
    config: configRes.data,
    results: resultsRes.data,
    bets: (betsRes.data || []).sort((a, b) => (b.score || 0) - (a.score || 0)),
    playerStats: (statsRes.data || []).map(s => ({
      ...s,
      player_name: s.players?.player_name,
      team_code: s.players?.squads?.team_code,
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
    slots: (slotsRes.data || []).map(s => ({
      slotId: s.slot_id,
      slotNumber: s.slot_number,
      multiplier: parseFloat(s.multiplier),
    })),
    userNames,
  };
}

/**
 * Fetch a single user's bet details for a match (only if LOCKED or SCORED).
 */
export async function apiGetUserMatchBet(matchId, userId) {
  if (!supabase || !isSupabaseConfigured()) return null;

  // Check match status
  const { data: cfg } = await supabase
    .from('match_config')
    .select('status, team_a, team_b, winner_base_points, winner_wrong_points, total_runs_base_points')
    .eq('match_id', matchId)
    .maybeSingle();

  if (!cfg || (cfg.status !== 'LOCKED' && cfg.status !== 'SCORED')) return null;

  const [betRes, resultsRes, statsRes, sideBetsRes, slotsRes] = await Promise.all([
    supabase.from('bets').select('*').eq('match_id', matchId).eq('user_id', userId).maybeSingle(),
    supabase.from('match_results').select('*').eq('match_id', matchId).maybeSingle(),
    supabase.from('player_match_stats')
      .select('*, players!inner(player_name, squads!inner(team_code))')
      .eq('match_id', matchId)
      .order('total_fantasy_points', { ascending: false }),
    supabase.from('side_bets').select('*').eq('match_id', matchId).order('display_order', { ascending: true }),
    supabase.from('player_slots').select('*').eq('match_id', matchId).order('slot_number', { ascending: true }),
  ]);

  if (!betRes.data) return null;

  return {
    config: cfg,
    results: resultsRes.data,
    bet: betRes.data,
    playerStats: (statsRes.data || []).map(s => ({
      ...s,
      player_name: s.players?.player_name,
      team_code: s.players?.squads?.team_code,
    })),
    sideBets: (sideBetsRes.data || []).map(sb => ({
      sideBetId: sb.side_bet_id,
      questionText: sb.question_text,
      options: sb.options || [],
      correctAnswer: sb.correct_answer,
      pointsCorrect: sb.points_correct,
      pointsWrong: sb.points_wrong,
    })),
    slots: (slotsRes.data || []).map(s => ({
      slotNumber: s.slot_number,
      multiplier: parseFloat(s.multiplier),
    })),
  };
}

export async function apiLockMatchBets(matchId) {
  return authenticatedPost('/api/admin/operations', {
    action: 'lockBets',
    matchId,
  });
}
