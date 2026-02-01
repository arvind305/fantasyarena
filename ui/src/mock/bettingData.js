/**
 * bettingData.js — System-generated and user-generated mock data.
 *
 * IMPORTANT: This file contains ONLY data that is NOT externally owned.
 * Teams, Players, Matches, Squads are provided by ExternalDataAdapter.
 * This file provides: BettingQuestions, LongTermBets, Groups, Profiles, Leaderboards.
 *
 * All entities conform to DOMAIN_MODEL_AND_DATA_CONTRACTS.md.
 */

import * as Ext from "./ExternalDataAdapter";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPlayerOptions(matchId) {
  const playerIds = Ext.getMatchPlayerIds(matchId);
  return playerIds.map((pid) => {
    const p = Ext.getPlayer(pid);
    return {
      optionId: `${matchId}_opt_${pid}`,
      label: p.name,
      referenceType: "PLAYER",
      referenceId: pid,
    };
  });
}

function buildTeamOptions(match) {
  const teamA = Ext.getTeam(match.teamA);
  const teamB = Ext.getTeam(match.teamB);
  return [
    { optionId: `${match.matchId}_opt_${teamA.teamId}`, label: teamA.shortName, referenceType: "TEAM", referenceId: teamA.teamId },
    { optionId: `${match.matchId}_opt_${teamB.teamId}`, label: teamB.shortName, referenceType: "TEAM", referenceId: teamB.teamId },
  ];
}

function questionStatus(match) {
  switch (match.status) {
    case "UPCOMING":   return "OPEN";
    case "LIVE":       return "LOCKED";
    case "COMPLETED":  return "RESOLVED";
    case "ABANDONED":  return "RESOLVED";
    case "NO_RESULT":  return "RESOLVED";
    default:           return "DRAFT";
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

  return [
    {
      questionId: `${match.matchId}_q1`, matchId: match.matchId, eventId: match.eventId,
      type: "MATCH_WINNER", text: "Who will win the match?",
      optionType: "TEAM_PICK",
      options: [
        ...teamOptions,
        { optionId: `${match.matchId}_opt_tie`, label: "Tie / No Result", referenceType: "NONE", referenceId: null },
      ],
      status, correctOptionId: null, resolvedAt: null, createdAt: now,
    },
    {
      questionId: `${match.matchId}_q2`, matchId: match.matchId, eventId: match.eventId,
      type: "TOSS_WINNER", text: "Who will win the toss?",
      optionType: "TEAM_PICK",
      options: teamOptions,
      status, correctOptionId: null, resolvedAt: null, createdAt: now,
    },
    {
      questionId: `${match.matchId}_q3`, matchId: match.matchId, eventId: match.eventId,
      type: "TOP_SCORER", text: "Who will be the top scorer?",
      optionType: "PLAYER_PICK",
      options: allPlayerOptions,
      status, correctOptionId: null, resolvedAt: null, createdAt: now,
    },
    {
      questionId: `${match.matchId}_q4`, matchId: match.matchId, eventId: match.eventId,
      type: "PLAYER_PERFORMANCE", text: "Who will take the most wickets?",
      optionType: "PLAYER_PICK",
      options: bowlerPlayerOptions,
      status, correctOptionId: null, resolvedAt: null, createdAt: now,
    },
    {
      questionId: `${match.matchId}_q5`, matchId: match.matchId, eventId: match.eventId,
      type: "MILESTONE", text: "Total runs in the match: Over or Under 350?",
      optionType: "MULTIPLE_CHOICE",
      options: [
        { optionId: `${match.matchId}_opt_over350`,  label: "Over 350",  referenceType: "NONE", referenceId: null },
        { optionId: `${match.matchId}_opt_under350`, label: "Under 350", referenceType: "NONE", referenceId: null },
      ],
      status, correctOptionId: null, resolvedAt: null, createdAt: now,
    },
    {
      questionId: `${match.matchId}_q6`, matchId: match.matchId, eventId: match.eventId,
      type: "MILESTONE", text: "Will there be a century scored?",
      optionType: "YES_NO",
      options: [
        { optionId: `${match.matchId}_opt_century_yes`, label: "Yes", referenceType: "NONE", referenceId: null },
        { optionId: `${match.matchId}_opt_century_no`,  label: "No",  referenceType: "NONE", referenceId: null },
      ],
      status, correctOptionId: null, resolvedAt: null, createdAt: now,
    },
    {
      questionId: `${match.matchId}_q7`, matchId: match.matchId, eventId: match.eventId,
      type: "PLAYER_PERFORMANCE", text: "Who will hit the most sixes?",
      optionType: "PLAYER_PICK",
      options: batterPlayerOptions,
      status, correctOptionId: null, resolvedAt: null, createdAt: now,
    },
    {
      questionId: `${match.matchId}_q8`, matchId: match.matchId, eventId: match.eventId,
      type: "MILESTONE", text: "Will there be a hat-trick?",
      optionType: "YES_NO",
      options: [
        { optionId: `${match.matchId}_opt_hattrick_yes`, label: "Yes", referenceType: "NONE", referenceId: null },
        { optionId: `${match.matchId}_opt_hattrick_no`,  label: "No",  referenceType: "NONE", referenceId: null },
      ],
      status, correctOptionId: null, resolvedAt: null, createdAt: now,
    },
    {
      questionId: `${match.matchId}_q9`, matchId: match.matchId, eventId: match.eventId,
      type: "CUSTOM", text: "Who will score more in the powerplay (first 6 overs)?",
      optionType: "TEAM_PICK",
      options: teamOptions,
      status, correctOptionId: null, resolvedAt: null, createdAt: now,
    },
    {
      questionId: `${match.matchId}_q10`, matchId: match.matchId, eventId: match.eventId,
      type: "PLAYER_PERFORMANCE", text: "Player of the Match?",
      optionType: "PLAYER_PICK",
      options: allPlayerOptions,
      status, correctOptionId: null, resolvedAt: null, createdAt: now,
    },
  ];
}

// Build questions for all matches from external source
const allMatches = Ext.getMatches();
export const BETTING_QUESTIONS = {};
allMatches.forEach((m) => {
  BETTING_QUESTIONS[m.matchId] = buildMatchQuestions(m);
});

// ─── Long-term Bets (system-generated, tournament-level) ─────────────────────

const allTeams = Ext.getTeams("cricket");
const allPlayers = Ext.getPlayers();

export const LONG_TERM_BETS = [
  {
    questionId: "lt1", matchId: null, eventId: "ipl2025",
    type: "CUSTOM", text: "Who will win IPL 2025?",
    optionType: "TEAM_PICK",
    options: allTeams.map((t) => ({
      optionId: `lt1_opt_${t.teamId}`, label: t.name, referenceType: "TEAM", referenceId: t.teamId,
    })),
    status: "OPEN", correctOptionId: null, resolvedAt: null,
    createdAt: "2025-03-01T00:00:00Z",
  },
  {
    questionId: "lt2", matchId: null, eventId: "ipl2025",
    type: "TOP_SCORER", text: "Who will be the Orange Cap holder (most runs)?",
    optionType: "PLAYER_PICK",
    options: allPlayers
      .filter((p) => p.role === "BAT" || p.role === "WK" || p.role === "AR")
      .map((p) => ({
        optionId: `lt2_opt_${p.playerId}`, label: p.name, referenceType: "PLAYER", referenceId: p.playerId,
      })),
    status: "OPEN", correctOptionId: null, resolvedAt: null,
    createdAt: "2025-03-01T00:00:00Z",
  },
  {
    questionId: "lt3", matchId: null, eventId: "ipl2025",
    type: "PLAYER_PERFORMANCE", text: "Who will be the Purple Cap holder (most wickets)?",
    optionType: "PLAYER_PICK",
    options: allPlayers
      .filter((p) => p.role === "BOWL" || p.role === "AR")
      .map((p) => ({
        optionId: `lt3_opt_${p.playerId}`, label: p.name, referenceType: "PLAYER", referenceId: p.playerId,
      })),
    status: "OPEN", correctOptionId: null, resolvedAt: null,
    createdAt: "2025-03-01T00:00:00Z",
  },
  {
    questionId: "lt4", matchId: null, eventId: "ipl2025",
    type: "MILESTONE", text: "Will any team remain unbeaten in the league stage?",
    optionType: "YES_NO",
    options: [
      { optionId: "lt4_opt_yes", label: "Yes", referenceType: "NONE", referenceId: null },
      { optionId: "lt4_opt_no",  label: "No",  referenceType: "NONE", referenceId: null },
    ],
    status: "OPEN", correctOptionId: null, resolvedAt: null,
    createdAt: "2025-03-01T00:00:00Z",
  },
  {
    questionId: "lt5", matchId: null, eventId: "ipl2025",
    type: "CUSTOM", text: "Which team will finish last in the league stage?",
    optionType: "TEAM_PICK",
    options: allTeams.map((t) => ({
      optionId: `lt5_opt_${t.teamId}`, label: t.name, referenceType: "TEAM", referenceId: t.teamId,
    })),
    status: "OPEN", correctOptionId: null, resolvedAt: null,
    createdAt: "2025-03-01T00:00:00Z",
  },
];

// ─── Groups (user-generated) ─────────────────────────────────────────────────

export const GROUPS = [
  {
    groupId: "g1", name: "Office Cricket Club", joinCode: "OCC-2025",
    createdBy: "user1", eventId: "ipl2025",
    memberIds: ["user1", "user2", "user3", "user4"],
    members: [
      { userId: "user1", displayName: "Rahul M.", score: 245 },
      { userId: "user2", displayName: "Priya S.", score: 210 },
      { userId: "user3", displayName: "Amit K.", score: 188 },
      { userId: "user4", displayName: "Sneha R.", score: 165 },
    ],
    createdAt: "2025-03-15T10:00:00Z",
  },
  {
    groupId: "g2", name: "College Friends", joinCode: "CLG-IPL",
    createdBy: "user2", eventId: "ipl2025",
    memberIds: ["user2", "user5", "user1"],
    members: [
      { userId: "user2", displayName: "Priya S.", score: 310 },
      { userId: "user5", displayName: "Vikram T.", score: 280 },
      { userId: "user1", displayName: "Rahul M.", score: 255 },
    ],
    createdAt: "2025-03-16T14:00:00Z",
  },
  {
    groupId: "g3", name: "Family League", joinCode: "FAM-25",
    createdBy: "user3", eventId: "ipl2025",
    memberIds: ["user3", "user6"],
    members: [
      { userId: "user3", displayName: "Amit K.", score: 190 },
      { userId: "user6", displayName: "Kavita K.", score: 175 },
    ],
    createdAt: "2025-03-17T09:00:00Z",
  },
];

// ─── User Profile (sample — user-generated) ─────────────────────────────────

export const SAMPLE_PROFILE = {
  userId: "user1",
  displayName: "Rahul M.",
  email: "rahul@example.com",
  avatarUrl: null,
  createdAt: "2025-03-10T08:00:00Z",
};

// ─── Global Leaderboard (derived view — server-computed) ─────────────────────

export const GLOBAL_LEADERBOARD = [
  { rank: 1, userId: "user7",  displayName: "Arjun D.",  totalScore: 520, matchesPlayed: 6 },
  { rank: 2, userId: "user2",  displayName: "Priya S.",  totalScore: 490, matchesPlayed: 6 },
  { rank: 3, userId: "user1",  displayName: "Rahul M.",  totalScore: 485, matchesPlayed: 6 },
  { rank: 4, userId: "user5",  displayName: "Vikram T.", totalScore: 460, matchesPlayed: 5 },
  { rank: 5, userId: "user8",  displayName: "Neha G.",   totalScore: 445, matchesPlayed: 6 },
  { rank: 6, userId: "user3",  displayName: "Amit K.",   totalScore: 430, matchesPlayed: 5 },
  { rank: 7, userId: "user9",  displayName: "Rohan P.",  totalScore: 410, matchesPlayed: 6 },
  { rank: 8, userId: "user4",  displayName: "Sneha R.",  totalScore: 395, matchesPlayed: 5 },
  { rank: 9, userId: "user6",  displayName: "Kavita K.", totalScore: 380, matchesPlayed: 5 },
  { rank: 10, userId: "user10", displayName: "Deepak V.", totalScore: 365, matchesPlayed: 4 },
];
