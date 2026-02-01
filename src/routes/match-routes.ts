import express from "express";
import * as matchService from "../api/match-service";

const router = express.Router();

// Create a match
router.post("/create", async (req, res) => {
  try {
    const result = await matchService.createMatch(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Pick/lock team
router.post("/:matchId/team", async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId, teamData } = req.body;
    const result = await matchService.pickTeam(matchId, userId, teamData);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Submit stats
router.post("/:matchId/stats", async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId, statsData } = req.body;
    const result = await matchService.submitStats(matchId, userId, statsData);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update score
router.post("/:matchId/score", async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await matchService.updateScore(matchId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get leaderboard
router.get("/:matchId/leaderboard", async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await matchService.getLeaderboard(matchId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user audit
router.get("/:matchId/audit/:userId", async (req, res) => {
  try {
    const { matchId, userId } = req.params;
    const result = await matchService.getUserAudit(matchId, userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
