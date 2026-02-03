/**
 * bettingData.js — System-generated and user-generated mock data.
 *
 * IMPORTANT: This file contains ONLY data that is NOT externally owned.
 * Teams, Players, Matches, Squads are provided by ExternalDataAdapter.
 * This file provides: BettingQuestions, LongTermBets, Groups, Profiles, Leaderboards.
 *
 * Note: Since ExternalDataAdapter is now async, betting questions are
 * generated dynamically when needed rather than at module load time.
 */

import * as Ext from "./ExternalDataAdapter";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPlayerOptions(matchId) {
  const playerIds = Ext.getMatchPlayerIds(matchId);
  return playerIds.map((pid) => {
    const p = Ext.getPlayer(pid);
    return {
      optionId: `${matchId}_opt_${pid}`,
      label: p ? p.name : pid,
      referenceType: "PLAYER",
      referenceId: pid,
    };
  });
}

function buildTeamOptions(match) {
  const teamA = Ext.getTeam(match.teamA);
  const teamB = Ext.getTeam(match.teamB);
  const options = [];

  if (teamA) {
    options.push({
      optionId: `${match.matchId}_opt_${teamA.teamId}`,
      label: teamA.shortName,
      referenceType: "TEAM",
      referenceId: teamA.teamId,
    });
  }
  if (teamB) {
    options.push({
      optionId: `${match.matchId}_opt_${teamB.teamId}`,
      label: teamB.shortName,
      referenceType: "TEAM",
      referenceId: teamB.teamId,
    });
  }

  return options;
}

function questionStatus(match) {
  switch (match.status) {
    case "UPCOMING":
      return "OPEN";
    case "LIVE":
      return "LOCKED";
    case "COMPLETED":
      return "RESOLVED";
    case "ABANDONED":
      return "RESOLVED";
    case "NO_RESULT":
      return "RESOLVED";
    default:
      return "DRAFT";
  }
}

// ─── Betting Questions (system-generated, per match) ─────────────────────────

function buildMatchQuestions(match) {
  const teamOptions = buildTeamOptions(match);
  const allPlayerOptions = buildPlayerOptions(match.matchId);
  const bowlerPlayerOptions = allPlayerOptions.filter((o) => {
    const p = Ext.getPlayer(o.referenceId);
    return p && (p.role === "BOWL" || p.role === "AR");
  });
  const batterPlayerOptions = allPlayerOptions.filter((o) => {
    const p = Ext.getPlayer(o.referenceId);
    return p && (p.role === "BAT" || p.role === "AR" || p.role === "WK");
  });

  const status = questionStatus(match);
  const now = new Date().toISOString();

  // For TBC matches (knockout stage), skip player-based questions
  if (match.isTbc || teamOptions.length < 2) {
    return [
      {
        questionId: `${match.matchId}_q1`,
        matchId: match.matchId,
        eventId: match.eventId,
        type: "MATCH_WINNER",
        text: "Who will win the match?",
        optionType: "TEAM_PICK",
        options: [
          ...teamOptions,
          {
            optionId: `${match.matchId}_opt_tie`,
            label: "Tie / No Result",
            referenceType: "NONE",
            referenceId: null,
          },
        ],
        status,
        correctOptionId: null,
        resolvedAt: null,
        createdAt: now,
      },
    ];
  }

  return [
    {
      questionId: `${match.matchId}_q1`,
      matchId: match.matchId,
      eventId: match.eventId,
      type: "MATCH_WINNER",
      text: "Who will win the match?",
      optionType: "TEAM_PICK",
      options: [
        ...teamOptions,
        {
          optionId: `${match.matchId}_opt_tie`,
          label: "Tie / No Result",
          referenceType: "NONE",
          referenceId: null,
        },
      ],
      status,
      correctOptionId: null,
      resolvedAt: null,
      createdAt: now,
    },
    {
      questionId: `${match.matchId}_q2`,
      matchId: match.matchId,
      eventId: match.eventId,
      type: "TOSS_WINNER",
      text: "Who will win the toss?",
      optionType: "TEAM_PICK",
      options: teamOptions,
      status,
      correctOptionId: null,
      resolvedAt: null,
      createdAt: now,
    },
    {
      questionId: `${match.matchId}_q3`,
      matchId: match.matchId,
      eventId: match.eventId,
      type: "TOP_SCORER",
      text: "Who will be the top scorer?",
      optionType: "PLAYER_PICK",
      options: allPlayerOptions,
      status,
      correctOptionId: null,
      resolvedAt: null,
      createdAt: now,
    },
    {
      questionId: `${match.matchId}_q4`,
      matchId: match.matchId,
      eventId: match.eventId,
      type: "PLAYER_PERFORMANCE",
      text: "Who will take the most wickets?",
      optionType: "PLAYER_PICK",
      options: bowlerPlayerOptions,
      status,
      correctOptionId: null,
      resolvedAt: null,
      createdAt: now,
    },
    {
      questionId: `${match.matchId}_q5`,
      matchId: match.matchId,
      eventId: match.eventId,
      type: "MILESTONE",
      text: "Total runs in the match: Over or Under 350?",
      optionType: "MULTIPLE_CHOICE",
      options: [
        {
          optionId: `${match.matchId}_opt_over350`,
          label: "Over 350",
          referenceType: "NONE",
          referenceId: null,
        },
        {
          optionId: `${match.matchId}_opt_under350`,
          label: "Under 350",
          referenceType: "NONE",
          referenceId: null,
        },
      ],
      status,
      correctOptionId: null,
      resolvedAt: null,
      createdAt: now,
    },
    {
      questionId: `${match.matchId}_q6`,
      matchId: match.matchId,
      eventId: match.eventId,
      type: "MILESTONE",
      text: "Will there be a century scored?",
      optionType: "YES_NO",
      options: [
        {
          optionId: `${match.matchId}_opt_century_yes`,
          label: "Yes",
          referenceType: "NONE",
          referenceId: null,
        },
        {
          optionId: `${match.matchId}_opt_century_no`,
          label: "No",
          referenceType: "NONE",
          referenceId: null,
        },
      ],
      status,
      correctOptionId: null,
      resolvedAt: null,
      createdAt: now,
    },
    {
      questionId: `${match.matchId}_q7`,
      matchId: match.matchId,
      eventId: match.eventId,
      type: "PLAYER_PERFORMANCE",
      text: "Who will hit the most sixes?",
      optionType: "PLAYER_PICK",
      options: batterPlayerOptions,
      status,
      correctOptionId: null,
      resolvedAt: null,
      createdAt: now,
    },
    {
      questionId: `${match.matchId}_q8`,
      matchId: match.matchId,
      eventId: match.eventId,
      type: "MILESTONE",
      text: "Will there be a hat-trick?",
      optionType: "YES_NO",
      options: [
        {
          optionId: `${match.matchId}_opt_hattrick_yes`,
          label: "Yes",
          referenceType: "NONE",
          referenceId: null,
        },
        {
          optionId: `${match.matchId}_opt_hattrick_no`,
          label: "No",
          referenceType: "NONE",
          referenceId: null,
        },
      ],
      status,
      correctOptionId: null,
      resolvedAt: null,
      createdAt: now,
    },
    {
      questionId: `${match.matchId}_q9`,
      matchId: match.matchId,
      eventId: match.eventId,
      type: "CUSTOM",
      text: "Who will score more in the powerplay (first 6 overs)?",
      optionType: "TEAM_PICK",
      options: teamOptions,
      status,
      correctOptionId: null,
      resolvedAt: null,
      createdAt: now,
    },
    {
      questionId: `${match.matchId}_q10`,
      matchId: match.matchId,
      eventId: match.eventId,
      type: "PLAYER_PERFORMANCE",
      text: "Player of the Match?",
      optionType: "PLAYER_PICK",
      options: allPlayerOptions,
      status,
      correctOptionId: null,
      resolvedAt: null,
      createdAt: now,
    },
  ];
}

// Cache for generated questions
const _questionsCache = {};

/**
 * Get betting questions for a match. Generated on demand and cached.
 */
export function getBettingQuestions(matchId) {
  if (_questionsCache[matchId]) {
    return _questionsCache[matchId];
  }

  const match = Ext.getMatch(matchId);
  if (!match) return [];

  const questions = buildMatchQuestions(match);
  _questionsCache[matchId] = questions;
  return questions;
}

// Legacy export for compatibility (returns empty object, use getBettingQuestions instead)
export const BETTING_QUESTIONS = {};

// ─── Long-term Bets (system-generated, tournament-level) ─────────────────────

/**
 * Build long-term bets dynamically based on loaded data.
 */
export function buildLongTermBets() {
  const allTeams = Ext.getTeams("cricket");
  const allPlayers = Ext.getPlayers();
  const tournaments = Ext.getTournaments();
  const eventId = tournaments.length > 0 ? tournaments[0].eventId : "t20wc_2026";

  return [
    {
      questionId: "lt1",
      matchId: null,
      eventId,
      type: "CUSTOM",
      text: "Who will win the T20 World Cup 2026?",
      optionType: "TEAM_PICK",
      options: allTeams.map((t) => ({
        optionId: `lt1_opt_${t.teamId}`,
        label: t.name,
        referenceType: "TEAM",
        referenceId: t.teamId,
      })),
      status: "OPEN",
      correctOptionId: null,
      resolvedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      questionId: "lt2",
      matchId: null,
      eventId,
      type: "TOP_SCORER",
      text: "Who will be the tournament's top scorer?",
      optionType: "PLAYER_PICK",
      options: allPlayers
        .filter((p) => p.role === "BAT" || p.role === "WK" || p.role === "AR")
        .map((p) => ({
          optionId: `lt2_opt_${p.playerId}`,
          label: p.name,
          referenceType: "PLAYER",
          referenceId: p.playerId,
        })),
      status: "OPEN",
      correctOptionId: null,
      resolvedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      questionId: "lt3",
      matchId: null,
      eventId,
      type: "PLAYER_PERFORMANCE",
      text: "Who will be the tournament's top wicket-taker?",
      optionType: "PLAYER_PICK",
      options: allPlayers
        .filter((p) => p.role === "BOWL" || p.role === "AR")
        .map((p) => ({
          optionId: `lt3_opt_${p.playerId}`,
          label: p.name,
          referenceType: "PLAYER",
          referenceId: p.playerId,
        })),
      status: "OPEN",
      correctOptionId: null,
      resolvedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      questionId: "lt4",
      matchId: null,
      eventId,
      type: "MILESTONE",
      text: "Will any team remain unbeaten in the group stage?",
      optionType: "YES_NO",
      options: [
        {
          optionId: "lt4_opt_yes",
          label: "Yes",
          referenceType: "NONE",
          referenceId: null,
        },
        {
          optionId: "lt4_opt_no",
          label: "No",
          referenceType: "NONE",
          referenceId: null,
        },
      ],
      status: "OPEN",
      correctOptionId: null,
      resolvedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      questionId: "lt5",
      matchId: null,
      eventId,
      type: "CUSTOM",
      text: "Who will be the Player of the Tournament?",
      optionType: "PLAYER_PICK",
      options: allPlayers.map((p) => ({
        optionId: `lt5_opt_${p.playerId}`,
        label: p.name,
        referenceType: "PLAYER",
        referenceId: p.playerId,
      })),
      status: "OPEN",
      correctOptionId: null,
      resolvedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];
}

// Legacy export - returns empty array before initialization
export const LONG_TERM_BETS = [];

// ─── Groups (user-generated) ─────────────────────────────────────────────────

export const GROUPS = [
  {
    groupId: "g1",
    name: "Office Cricket Club",
    joinCode: "OCC-2026",
    createdBy: "user1",
    eventId: "t20wc_2026",
    memberIds: ["user1", "user2", "user3", "user4"],
    members: [
      { userId: "user1", displayName: "Rahul M.", score: 0 },
      { userId: "user2", displayName: "Priya S.", score: 0 },
      { userId: "user3", displayName: "Amit K.", score: 0 },
      { userId: "user4", displayName: "Sneha R.", score: 0 },
    ],
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    groupId: "g2",
    name: "College Friends",
    joinCode: "CLG-WC26",
    createdBy: "user2",
    eventId: "t20wc_2026",
    memberIds: ["user2", "user5", "user1"],
    members: [
      { userId: "user2", displayName: "Priya S.", score: 0 },
      { userId: "user5", displayName: "Vikram T.", score: 0 },
      { userId: "user1", displayName: "Rahul M.", score: 0 },
    ],
    createdAt: "2026-01-16T14:00:00Z",
  },
  {
    groupId: "g3",
    name: "Family League",
    joinCode: "FAM-26",
    createdBy: "user3",
    eventId: "t20wc_2026",
    memberIds: ["user3", "user6"],
    members: [
      { userId: "user3", displayName: "Amit K.", score: 0 },
      { userId: "user6", displayName: "Kavita K.", score: 0 },
    ],
    createdAt: "2026-01-17T09:00:00Z",
  },
];

// ─── User Profile (sample — user-generated) ─────────────────────────────────

export const SAMPLE_PROFILE = {
  userId: "user1",
  displayName: "Rahul M.",
  email: "rahul@example.com",
  avatarUrl: null,
  createdAt: "2026-01-10T08:00:00Z",
};

// ─── Global Leaderboard (derived view — server-computed) ─────────────────────

export const GLOBAL_LEADERBOARD = [
  { rank: 1, userId: "user7", displayName: "Arjun D.", totalScore: 0, matchesPlayed: 0 },
  { rank: 2, userId: "user2", displayName: "Priya S.", totalScore: 0, matchesPlayed: 0 },
  { rank: 3, userId: "user1", displayName: "Rahul M.", totalScore: 0, matchesPlayed: 0 },
  { rank: 4, userId: "user5", displayName: "Vikram T.", totalScore: 0, matchesPlayed: 0 },
  { rank: 5, userId: "user8", displayName: "Neha G.", totalScore: 0, matchesPlayed: 0 },
  { rank: 6, userId: "user3", displayName: "Amit K.", totalScore: 0, matchesPlayed: 0 },
  { rank: 7, userId: "user9", displayName: "Rohan P.", totalScore: 0, matchesPlayed: 0 },
  { rank: 8, userId: "user4", displayName: "Sneha R.", totalScore: 0, matchesPlayed: 0 },
  { rank: 9, userId: "user6", displayName: "Kavita K.", totalScore: 0, matchesPlayed: 0 },
  { rank: 10, userId: "user10", displayName: "Deepak V.", totalScore: 0, matchesPlayed: 0 },
];
