import { useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

/**
 * Admin state management hook.
 * Provides save functions for match config, slots, side bets, player stats.
 */
export function useAdmin() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const saveMatchConfig = useCallback(async (matchId, configData) => {
    if (!supabase || !isSupabaseConfigured()) throw new Error("Supabase not configured");
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from("match_config")
        .upsert({
          match_id: matchId,
          event_id: configData.eventId || "t20wc_2026",
          winner_base_points: configData.winnerBasePoints,
          super_over_multiplier: configData.superOverMultiplier,
          total_runs_base_points: configData.totalRunsBasePoints,
          player_slots_enabled: configData.playerSlotsEnabled,
          player_slot_count: configData.playerSlotCount,
          runners_enabled: configData.runnersEnabled,
          runner_count: configData.runnerCount,
          lock_time: configData.lockTime || null,
          team_a: configData.teamA,
          team_b: configData.teamB,
          status: configData.status || "DRAFT",
        }, { onConflict: "match_id" });
      if (err) throw err;
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const savePlayerSlots = useCallback(async (matchId, slots) => {
    if (!supabase || !isSupabaseConfigured()) throw new Error("Supabase not configured");
    setSaving(true);
    setError(null);
    try {
      // Delete existing slots for this match
      await supabase.from("player_slots").delete().eq("match_id", matchId);

      if (slots.length > 0) {
        const rows = slots.map((s) => ({
          match_id: matchId,
          slot_number: s.slotNumber,
          multiplier: s.multiplier,
          is_enabled: s.isEnabled !== false,
        }));
        const { error: err } = await supabase.from("player_slots").insert(rows);
        if (err) throw err;
      }
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveSideBets = useCallback(async (matchId, sideBets) => {
    if (!supabase || !isSupabaseConfigured()) throw new Error("Supabase not configured");
    setSaving(true);
    setError(null);
    try {
      // Delete existing side bets for this match
      await supabase.from("side_bets").delete().eq("match_id", matchId);

      if (sideBets.length > 0) {
        const rows = sideBets.map((sb, i) => ({
          match_id: matchId,
          question_text: sb.questionText,
          options: sb.options || [],
          points_correct: sb.pointsCorrect,
          points_wrong: sb.pointsWrong || 0,
          correct_answer: sb.correctAnswer || null,
          display_order: i,
          status: sb.status || "OPEN",
        }));
        const { error: err } = await supabase.from("side_bets").insert(rows);
        if (err) throw err;
      }
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const savePlayerStats = useCallback(async (matchId, statsMap) => {
    if (!supabase || !isSupabaseConfigured()) throw new Error("Supabase not configured");
    setSaving(true);
    setError(null);
    try {
      const rows = Object.entries(statsMap)
        .filter(([_, s]) => s && Object.keys(s).length > 0)
        .map(([playerId, s]) => {
          const ballsFaced = s.balls_faced || 0;
          const runs = s.runs || 0;
          const oversB = s.overs_bowled || 0;
          const runsConceded = s.runs_conceded || 0;

          return {
            match_id: matchId,
            player_id: playerId,
            runs,
            balls_faced: ballsFaced,
            fours: s.fours || 0,
            sixes: s.sixes || 0,
            strike_rate: ballsFaced > 0 ? Math.round((runs / ballsFaced) * 10000) / 100 : 0,
            wickets: s.wickets || 0,
            overs_bowled: oversB,
            runs_conceded: runsConceded,
            economy_rate: oversB > 0 ? Math.round((runsConceded / oversB) * 100) / 100 : 0,
            catches: s.catches || 0,
            run_outs: s.run_outs || 0,
            stumpings: s.stumpings || 0,
            is_man_of_match: s.is_man_of_match || false,
            has_century: s.has_century || false,
            has_five_wicket_haul: s.has_five_wicket_haul || false,
            has_hat_trick: s.has_hat_trick || false,
          };
        });

      if (rows.length > 0) {
        const { error: err } = await supabase
          .from("player_match_stats")
          .upsert(rows, { onConflict: "match_id,player_id" });
        if (err) throw err;
      }
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const calculatePlayerPoints = useCallback(async (matchId) => {
    if (!supabase || !isSupabaseConfigured()) throw new Error("Supabase not configured");
    const { data, error: err } = await supabase.rpc("calculate_all_player_points", {
      p_match_id: matchId,
    });
    if (err) throw err;
    return data;
  }, []);

  const saveLongTermConfig = useCallback(async (configData) => {
    if (!supabase || !isSupabaseConfigured()) throw new Error("Supabase not configured");
    setSaving(true);
    setError(null);
    try {
      const payload = {
        event_id: configData.eventId || "t20wc_2026",
        winner_points: configData.winnerPoints,
        finalist_points: configData.finalistPoints,
        final_four_points: configData.finalFourPoints,
        orange_cap_points: configData.orangeCapPoints,
        purple_cap_points: configData.purpleCapPoints,
        lock_time: configData.lockTime || null,
        is_locked: configData.isLocked || false,
        change_cost_percent: configData.changeCostPercent || 10,
        allow_changes: configData.allowChanges || false,
      };
      // Include actual_* fields if present
      if (configData.actualWinner !== undefined) payload.actual_winner = configData.actualWinner || null;
      if (configData.actualFinalists !== undefined) payload.actual_finalists = configData.actualFinalists || [];
      if (configData.actualFinalFour !== undefined) payload.actual_final_four = configData.actualFinalFour || [];
      if (configData.actualOrangeCap !== undefined) payload.actual_orange_cap = configData.actualOrangeCap || null;
      if (configData.actualPurpleCap !== undefined) payload.actual_purple_cap = configData.actualPurpleCap || null;

      const { error: err } = await supabase
        .from("long_term_bets_config")
        .upsert(payload, { onConflict: "event_id" });
      if (err) throw err;
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const setMatchCorrectAnswers = useCallback(async (matchId, results) => {
    if (!supabase || !isSupabaseConfigured()) throw new Error("Supabase not configured");
    setSaving(true);
    setError(null);
    try {
      // Save match results
      const { error: resErr } = await supabase
        .from("match_results")
        .upsert({
          match_id: matchId,
          winner: results.winner,
          total_runs: results.totalRuns,
          side_bet_answers: results.sideBetAnswers || {},
          man_of_match: results.manOfMatch || null,
          completed_at: new Date().toISOString(),
        }, { onConflict: "match_id" });
      if (resErr) throw resErr;

      // Set correct_answer on side_bets
      if (results.sideBetAnswers) {
        for (const [sideBetId, answer] of Object.entries(results.sideBetAnswers)) {
          await supabase
            .from("side_bets")
            .update({ correct_answer: answer })
            .eq("side_bet_id", sideBetId);
        }
      }

      // Update match_config status
      await supabase
        .from("match_config")
        .update({ status: "LOCKED" })
        .eq("match_id", matchId);

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const triggerScoring = useCallback(async (matchId, eventId = "t20wc_2026") => {
    if (!supabase || !isSupabaseConfigured()) throw new Error("Supabase not configured");
    setSaving(true);
    setError(null);
    try {
      // First calculate all player fantasy points
      await supabase.rpc("calculate_all_player_points", { p_match_id: matchId });

      // Then score all bets
      const { data, error: err } = await supabase.rpc("calculate_match_scores", {
        p_match_id: matchId,
        p_event_id: eventId,
      });
      if (err) throw err;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const triggerLongTermScoring = useCallback(async (eventId = "t20wc_2026") => {
    if (!supabase || !isSupabaseConfigured()) throw new Error("Supabase not configured");
    setSaving(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.rpc("calculate_long_term_scores", {
        p_event_id: eventId,
      });
      if (err) throw err;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    saving,
    error,
    saveMatchConfig,
    savePlayerSlots,
    saveSideBets,
    savePlayerStats,
    calculatePlayerPoints,
    saveLongTermConfig,
    setMatchCorrectAnswers,
    triggerScoring,
    triggerLongTermScoring,
  };
}
