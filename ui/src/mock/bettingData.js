/**
 * bettingData.js — System-generated and user-generated mock data.
 *
 * IMPORTANT: This file contains ONLY data that is NOT externally owned.
 * Teams, Players, Matches, Squads are provided by ExternalDataAdapter.
 * Questions are provided by QuestionStore (admin-defined).
 * This file provides: LongTermBets, Groups, Profiles, Leaderboards.
 */

import * as Ext from "./ExternalDataAdapter";

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
// Start with empty array - groups are created by real users
export const GROUPS = [];

// ─── User Profile (sample — user-generated) ─────────────────────────────────

export const SAMPLE_PROFILE = {
  userId: "user1",
  displayName: "Rahul M.",
  email: "rahul@example.com",
  avatarUrl: null,
  createdAt: "2026-01-10T08:00:00Z",
};

// ─── Global Leaderboard (derived view — server-computed) ─────────────────────
// Start with empty array - populated by real user bets
export const GLOBAL_LEADERBOARD = [];
