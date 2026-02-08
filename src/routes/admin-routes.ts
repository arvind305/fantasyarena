import express from "express";
import { scoreBetsForMatch, getMatchResult, type MatchResult } from "../services/scoring-service";
import { updateLeaderboardForMatch } from "../services/leaderboard-service";
import { supabaseAdmin } from "../db/supabase";

const router = express.Router();

// =============================================================================
// ADMIN AUTH MIDDLEWARE
// =============================================================================

/**
 * Simple admin authentication middleware
 * - In development mode (NODE_ENV !== 'production'), allows all requests
 * - In production, requires 'x-admin-key' header to match ADMIN_API_KEY env var
 */
const adminAuthMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Skip auth in development mode
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const adminKey = req.headers["x-admin-key"];
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({ error: "Admin API key not configured" });
  }

  if (!adminKey || adminKey !== expectedKey) {
    return res.status(401).json({ error: "Unauthorized: Invalid admin key" });
  }

  next();
};

// Apply admin auth middleware to all routes
router.use(adminAuthMiddleware);

// =============================================================================
// MATCH RESULTS ENDPOINTS
// =============================================================================

/**
 * POST /match/:matchId/results - Save match results
 *
 * Body:
 * - result: string (winner team name or 'SUPER_OVER', etc.)
 * - teamAScore: number
 * - teamBScore: number
 * - totalRuns: number
 * - manOfMatch: string (optional)
 * - playerStats: object (player_id -> stats object)
 * - sideBetAnswers: object (question_id -> answer)
 */
router.post("/:matchId/results", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const { matchId } = req.params;
    const {
      result,
      teamAScore,
      teamBScore,
      totalRuns,
      manOfMatch,
      playerStats,
      sideBetAnswers,
    } = req.body;

    // Validate required fields
    if (!matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }

    // Transform to match_results table format
    const matchResultData = {
      match_id: matchId,
      winner: result || null,
      total_runs: totalRuns ?? (teamAScore || 0) + (teamBScore || 0),
      player_stats: playerStats || {},
      side_bet_answers: sideBetAnswers || {},
      man_of_match: manOfMatch || null,
      completed_at: new Date().toISOString(),
    };

    // Upsert to match_results table
    const { data, error } = await supabaseAdmin
      .from("match_results")
      .upsert(matchResultData, { onConflict: "match_id" })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: `Failed to save match results: ${error.message}` });
    }

    res.json({
      success: true,
      message: "Match results saved successfully",
      matchId,
      data,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

/**
 * GET /match/:matchId/results - Get match results
 *
 * Returns the match results or 404 if not found
 */
router.get("/:matchId/results", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const { matchId } = req.params;

    const matchResult = await getMatchResult(matchId);

    if (!matchResult) {
      return res.status(404).json({ error: "Match results not found" });
    }

    res.json({
      success: true,
      data: matchResult,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// =============================================================================
// SCORING ENDPOINTS
// =============================================================================

/**
 * POST /match/:matchId/score - Calculate and apply scores
 *
 * Body:
 * - eventId: string (required for leaderboard update)
 *
 * This endpoint:
 * 1. Fetches the match result from the database
 * 2. Calls scoreBetsForMatch() to calculate and save scores
 * 3. Updates the leaderboard using updateLeaderboardForMatch()
 * 4. Returns score breakdowns and summary
 */
router.post("/:matchId/score", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const { matchId } = req.params;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: "eventId is required for leaderboard update" });
    }

    // Fetch match result
    const matchResult = await getMatchResult(matchId);

    if (!matchResult) {
      return res.status(404).json({ error: "Match results not found. Please save results first." });
    }

    // Score all bets for this match
    const scoreBreakdowns = await scoreBetsForMatch(matchId, matchResult);

    // Update the leaderboard with the score breakdowns
    await updateLeaderboardForMatch(matchId, eventId, scoreBreakdowns);

    // Calculate summary statistics
    const totalBetsScored = scoreBreakdowns.length;
    const totalPoints = scoreBreakdowns.reduce((sum, b) => sum + b.total_score, 0);
    const averageScore = totalBetsScored > 0 ? Math.round(totalPoints / totalBetsScored) : 0;
    const highestScore = totalBetsScored > 0 ? Math.max(...scoreBreakdowns.map((b) => b.total_score)) : 0;
    const lowestScore = totalBetsScored > 0 ? Math.min(...scoreBreakdowns.map((b) => b.total_score)) : 0;

    res.json({
      success: true,
      message: `Scored ${totalBetsScored} bets for match ${matchId}`,
      matchId,
      eventId,
      summary: {
        totalBetsScored,
        totalPoints,
        averageScore,
        highestScore,
        lowestScore,
      },
      scoreBreakdowns,
      leaderboardUpdated: true,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// =============================================================================
// BET LOCKING ENDPOINTS
// =============================================================================

/**
 * POST /match/:matchId/lock-bets - Lock all bets for a match before scoring
 *
 * This prevents users from modifying their bets after match starts.
 * Should be called before or at match start time.
 */
router.post("/:matchId/lock-bets", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const { matchId } = req.params;

    // First, count how many bets will be locked
    const { count: totalBets, error: countError } = await supabaseAdmin
      .from("bets")
      .select("*", { count: "exact", head: true })
      .eq("match_id", matchId)
      .eq("is_locked", false);

    if (countError) {
      return res.status(400).json({ error: `Failed to count bets: ${countError.message}` });
    }

    // Update all bets for this match to set is_locked = true
    const { error: updateError } = await supabaseAdmin
      .from("bets")
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
      })
      .eq("match_id", matchId)
      .eq("is_locked", false);

    if (updateError) {
      return res.status(400).json({ error: `Failed to lock bets: ${updateError.message}` });
    }

    res.json({
      success: true,
      message: `Locked ${totalBets || 0} bets for match ${matchId}`,
      matchId,
      lockedCount: totalBets || 0,
      lockedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
