const { verifyGoogleToken, isAdmin, createServiceClient, unauthorized, forbidden, badRequest } = require('../_lib/auth');
const { CURRENT_TOURNAMENT } = require('../_lib/tournament');

/**
 * POST /api/admin/operations
 *
 * Authenticated admin-only operations. Routes by action parameter.
 * Each operation verifies the user is admin before proceeding.
 *
 * Actions:
 *   saveConfig — Save match config (upsert match_config)
 *   saveSlots — Save player slots for a match
 *   saveSideBets — Save side bets for a match
 *   savePlayerStats — Save player match stats
 *   calculatePlayerPoints — Run calculate_all_player_points RPC
 *   triggerScoring — Run calculate_match_scores RPC
 *   triggerLongTermScoring — Run calculate_long_term_scores RPC
 *   setMatchResults — Save match results + side bet answers
 *   saveLongTermConfig — Save long-term bets config
 *   saveMatchQuestions — Save match questions
 *   lockBets — Lock all bets for a match
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify user identity
  const user = await verifyGoogleToken(req);
  if (!user) return unauthorized(res, 'Invalid or expired token');

  // Verify admin
  if (!isAdmin(user.email)) {
    return forbidden(res, 'Admin access required');
  }

  const { action } = req.body;
  if (!action) return badRequest(res, 'action is required');

  const sb = createServiceClient();

  try {
    switch (action) {

      case 'saveConfig': {
        const { matchId, configData } = req.body;
        if (!matchId) return badRequest(res, 'matchId required');

        const { error } = await sb
          .from('match_config')
          .upsert({
            match_id: matchId,
            event_id: configData.eventId || CURRENT_TOURNAMENT.id,
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
            status: configData.status || 'DRAFT',
            winner_wrong_points: configData.winnerWrongPoints || 0,
          }, { onConflict: 'match_id' });
        if (error) throw new Error(error.message);
        return res.status(200).json({ success: true });
      }

      case 'saveSlots': {
        const { matchId, slots } = req.body;
        if (!matchId) return badRequest(res, 'matchId required');

        await sb.from('player_slots').delete().eq('match_id', matchId);
        if (slots && slots.length > 0) {
          const rows = slots.map((s) => ({
            match_id: matchId,
            slot_number: s.slotNumber,
            multiplier: s.multiplier,
            is_enabled: s.isEnabled !== false,
          }));
          const { error } = await sb.from('player_slots').insert(rows);
          if (error) throw new Error(error.message);
        }
        return res.status(200).json({ success: true });
      }

      case 'saveSideBets': {
        const { matchId, sideBets } = req.body;
        if (!matchId) return badRequest(res, 'matchId required');

        await sb.from('side_bets').delete().eq('match_id', matchId);
        if (sideBets && sideBets.length > 0) {
          const rows = sideBets.map((sb_item, i) => ({
            match_id: matchId,
            question_text: sb_item.questionText,
            options: sb_item.options || [],
            points_correct: sb_item.pointsCorrect,
            points_wrong: sb_item.pointsWrong || 0,
            correct_answer: sb_item.correctAnswer || null,
            display_order: i,
            status: sb_item.status || 'OPEN',
          }));
          const { error } = await sb.from('side_bets').insert(rows);
          if (error) throw new Error(error.message);
        }
        return res.status(200).json({ success: true });
      }

      case 'savePlayerStats': {
        const { matchId, statsMap } = req.body;
        if (!matchId) return badRequest(res, 'matchId required');

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
          const { error } = await sb
            .from('player_match_stats')
            .upsert(rows, { onConflict: 'match_id,player_id' });
          if (error) throw new Error(error.message);
        }
        return res.status(200).json({ success: true });
      }

      case 'calculatePlayerPoints': {
        const { matchId } = req.body;
        if (!matchId) return badRequest(res, 'matchId required');
        const { data, error } = await sb.rpc('calculate_all_player_points', { p_match_id: matchId });
        if (error) throw new Error(error.message);
        return res.status(200).json({ success: true, data });
      }

      case 'triggerScoring': {
        const { matchId, eventId = CURRENT_TOURNAMENT.id } = req.body;
        if (!matchId) return badRequest(res, 'matchId required');

        // Calculate player fantasy points first
        await sb.rpc('calculate_all_player_points', { p_match_id: matchId });

        // Score all bets
        const { data, error } = await sb.rpc('calculate_match_scores', {
          p_match_id: matchId,
          p_event_id: eventId,
        });
        if (error) throw new Error(error.message);
        return res.status(200).json({ success: true, data });
      }

      case 'triggerLongTermScoring': {
        const { eventId = CURRENT_TOURNAMENT.id } = req.body;
        const { data, error } = await sb.rpc('calculate_long_term_scores', { p_event_id: eventId });
        if (error) throw new Error(error.message);
        return res.status(200).json({ success: true, data });
      }

      case 'setMatchResults': {
        const { matchId, results } = req.body;
        if (!matchId) return badRequest(res, 'matchId required');

        // Save match results
        const { error: resErr } = await sb
          .from('match_results')
          .upsert({
            match_id: matchId,
            winner: results.winner,
            total_runs: results.totalRuns,
            side_bet_answers: results.sideBetAnswers || {},
            man_of_match: results.manOfMatch || null,
            completed_at: new Date().toISOString(),
          }, { onConflict: 'match_id' });
        if (resErr) throw new Error(resErr.message);

        // Set correct_answer on side_bets
        if (results.sideBetAnswers) {
          for (const [sideBetId, answer] of Object.entries(results.sideBetAnswers)) {
            await sb
              .from('side_bets')
              .update({ correct_answer: answer })
              .eq('side_bet_id', sideBetId);
          }
        }

        // Update match_config status to LOCKED
        await sb
          .from('match_config')
          .update({ status: 'LOCKED' })
          .eq('match_id', matchId);

        return res.status(200).json({ success: true });
      }

      case 'saveLongTermConfig': {
        const { configData } = req.body;
        const payload = {
          event_id: configData.eventId || CURRENT_TOURNAMENT.id,
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
        if (configData.actualWinner !== undefined) payload.actual_winner = configData.actualWinner || null;
        if (configData.actualFinalists !== undefined) payload.actual_finalists = configData.actualFinalists || [];
        if (configData.actualFinalFour !== undefined) payload.actual_final_four = configData.actualFinalFour || [];
        if (configData.actualOrangeCap !== undefined) payload.actual_orange_cap = configData.actualOrangeCap || null;
        if (configData.actualPurpleCap !== undefined) payload.actual_purple_cap = configData.actualPurpleCap || null;

        const { error } = await sb
          .from('long_term_bets_config')
          .upsert(payload, { onConflict: 'event_id' });
        if (error) throw new Error(error.message);
        return res.status(200).json({ success: true });
      }

      case 'saveMatchQuestions': {
        const { matchId, questions } = req.body;
        if (!matchId) return badRequest(res, 'matchId required');

        await sb.from('match_questions').delete().eq('match_id', matchId);
        if (questions && questions.length > 0) {
          const rows = questions.map((q, idx) => ({
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
            disabled: q.disabled || false,
          }));
          const { error } = await sb.from('match_questions').insert(rows);
          if (error) throw new Error(error.message);
        }
        return res.status(200).json({ success: true, count: (questions || []).length });
      }

      case 'lockBets': {
        const { matchId } = req.body;
        if (!matchId) return badRequest(res, 'matchId required');

        const { data, error } = await sb
          .from('bets')
          .update({ is_locked: true })
          .eq('match_id', matchId)
          .select('bet_id');
        if (error) throw new Error(error.message);
        return res.status(200).json({ success: true, lockedCount: data ? data.length : 0 });
      }

      default:
        return badRequest(res, `Unknown action: ${action}`);
    }
  } catch (err) {
    console.error(`[admin/${action}]`, err.message);
    return res.status(500).json({ error: err.message });
  }
};
