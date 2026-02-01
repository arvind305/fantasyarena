// Stub match service — in-memory store for testing

interface Match {
  id: string;
  name: string;
  teams: Record<string, any>;
  stats: Record<string, any>;
  scores: Record<string, number>;
}

const matches: Record<string, Match> = {};
let nextId = 1;

export async function createMatch(body: any) {
  const id = String(nextId++);
  matches[id] = { id, name: body.name || "Unnamed", teams: {}, stats: {}, scores: {} };
  return matches[id];
}

export async function pickTeam(matchId: string, userId: string, teamData: any) {
  const match = matches[matchId];
  if (!match) throw new Error("Match not found");
  match.teams[userId] = teamData;
  return { matchId, userId, teamData };
}

export async function submitStats(matchId: string, userId: string, statsData: any) {
  const match = matches[matchId];
  if (!match) throw new Error("Match not found");
  match.stats[userId] = statsData;
  return { matchId, userId, statsData };
}

export async function updateScore(matchId: string) {
  const match = matches[matchId];
  if (!match) throw new Error("Match not found");
  for (const userId of Object.keys(match.teams)) {
    match.scores[userId] = Math.floor(Math.random() * 100);
  }
  return { matchId, scores: match.scores };
}

export async function getLeaderboard(matchId: string) {
  const match = matches[matchId];
  if (!match) throw new Error("Match not found");
  const entries = Object.entries(match.scores)
    .map(([userId, score]) => ({ userId, score }))
    .sort((a, b) => b.score - a.score);
  return { matchId, leaderboard: entries };
}

export async function getUserAudit(matchId: string, userId: string) {
  const match = matches[matchId];
  if (!match) throw new Error("Match not found");
  return {
    matchId,
    userId,
    team: match.teams[userId] || null,
    stats: match.stats[userId] || null,
    score: match.scores[userId] ?? null,
  };
}
