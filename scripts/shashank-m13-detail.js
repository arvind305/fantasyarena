/**
 * Shashank's wc_m13 (RSA vs AFG) — Full Scoring Breakdown
 *
 * Pulls all data from Supabase and walks through the scoring logic step by step.
 */

// 1. Load env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const { createClient } = require('@supabase/supabase-js');

// 2. Create Supabase client
const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing env vars. Need REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key);
const MATCH_ID = 'wc_m13';

(async () => {
  try {
    // -------------------------------------------------------
    // 3. Find Shashank's user_id from leaderboard
    // -------------------------------------------------------
    const { data: shashankRows, error: shErr } = await sb
      .from('leaderboard')
      .select('user_id, display_name, total_score, matches_played')
      .ilike('display_name', '%shashank%');

    if (shErr) { console.error('Error finding Shashank:', shErr.message); process.exit(1); }
    if (!shashankRows || shashankRows.length === 0) { console.error('Shashank not found in leaderboard'); process.exit(1); }

    const shashank = shashankRows[0];
    console.log('Found user: ' + shashank.display_name + ' (ID: ' + shashank.user_id + ')');
    console.log('Leaderboard: ' + shashank.total_score + ' pts, ' + shashank.matches_played + ' matches\n');

    // -------------------------------------------------------
    // 4. Get his bet for wc_m13
    // -------------------------------------------------------
    const { data: betRows, error: betErr } = await sb
      .from('bets')
      .select('*')
      .eq('user_id', shashank.user_id)
      .eq('match_id', MATCH_ID);

    if (betErr) { console.error('Error fetching bet:', betErr.message); process.exit(1); }
    if (!betRows || betRows.length === 0) { console.error('No bet found for Shashank on ' + MATCH_ID); process.exit(1); }

    const bet = betRows[0];
    console.log('--- Shashank\'s Bet (raw) ---');
    console.log('  answers:', JSON.stringify(bet.answers, null, 2));
    console.log('  player_picks:', JSON.stringify(bet.player_picks, null, 2));
    console.log('  runner_picks:', JSON.stringify(bet.runner_picks, null, 2));
    console.log('  side_bet_answers:', JSON.stringify(bet.side_bet_answers, null, 2));
    console.log('  score:', bet.score);
    console.log('  winner_points:', bet.winner_points);
    console.log('  total_runs_points:', bet.total_runs_points);
    console.log('  player_pick_points:', bet.player_pick_points);
    console.log('  side_bet_points:', bet.side_bet_points);
    console.log('  runner_points:', bet.runner_points);
    console.log('');

    // -------------------------------------------------------
    // 5. Get match_results for wc_m13
    // -------------------------------------------------------
    const { data: matchResult, error: mrErr } = await sb
      .from('match_results')
      .select('*')
      .eq('match_id', MATCH_ID)
      .single();

    if (mrErr) { console.error('Error fetching match_results:', mrErr.message); process.exit(1); }

    console.log('--- match_results ---');
    console.log('  winner:', matchResult.winner);
    console.log('  total_runs:', matchResult.total_runs);
    console.log('  man_of_match:', matchResult.man_of_match);
    console.log('  side_bet_answers:', JSON.stringify(matchResult.side_bet_answers, null, 2));
    console.log('  completed_at:', matchResult.completed_at);
    console.log('');

    // -------------------------------------------------------
    // 6. Get match_questions for wc_m13
    // -------------------------------------------------------
    const { data: questions, error: qErr } = await sb
      .from('match_questions')
      .select('*')
      .eq('match_id', MATCH_ID)
      .order('kind');

    if (qErr) { console.error('Error fetching match_questions:', qErr.message); process.exit(1); }

    console.log('--- match_questions ---');
    for (const q of (questions || [])) {
      console.log('  [' + q.kind + '] question_id: ' + q.question_id);
      console.log('    text: ' + (q.question_text || q.text || '(no text)'));
      console.log('    points: ' + q.points + ', points_wrong: ' + (q.points_wrong || 0));
      console.log('    section: ' + (q.section || 'N/A') + ', status: ' + (q.status || 'N/A'));
      console.log('    correct_answer: ' + (q.correct_answer || 'N/A'));
      if (q.options && Array.isArray(q.options)) {
        console.log('    options:');
        for (const opt of q.options) {
          const id = opt.optionId || opt.option_id;
          const label = opt.label || opt.text || id;
          const marker = id === q.correct_answer ? ' <-- CORRECT' : '';
          console.log('      optionId: "' + id + '" | label: "' + label + '"' + marker);
        }
      }
    }
    console.log('');

    // -------------------------------------------------------
    // 7. Get match_config for wc_m13
    // -------------------------------------------------------
    const { data: matchConfig, error: mcErr } = await sb
      .from('match_config')
      .select('*')
      .eq('match_id', MATCH_ID)
      .single();

    if (mcErr) { console.error('Error fetching match_config:', mcErr.message); process.exit(1); }

    console.log('--- match_config ---');
    console.log('  team_a:', matchConfig.team_a, ', team_b:', matchConfig.team_b);
    console.log('  status:', matchConfig.status);
    console.log('  winner_base_points:', matchConfig.winner_base_points);
    console.log('  total_runs_base_points:', matchConfig.total_runs_base_points);
    console.log('  super_over_multiplier:', matchConfig.super_over_multiplier);
    console.log('');

    // -------------------------------------------------------
    // 8. Get side_bets for wc_m13
    // -------------------------------------------------------
    const { data: sideBets, error: sbErr } = await sb
      .from('side_bets')
      .select('*')
      .eq('match_id', MATCH_ID);

    if (sbErr) { console.error('Error fetching side_bets:', sbErr.message); process.exit(1); }

    console.log('--- side_bets ---');
    for (const sb2 of (sideBets || [])) {
      console.log('  side_bet_id: ' + sb2.side_bet_id);
      console.log('    question_text: ' + sb2.question_text);
      console.log('    options: ' + JSON.stringify(sb2.options));
      console.log('    correct_answer: ' + sb2.correct_answer);
      console.log('    points_correct: ' + sb2.points_correct + ', points_wrong: ' + sb2.points_wrong);
    }
    console.log('');

    // -------------------------------------------------------
    // 9. Get player_slots for wc_m13
    // -------------------------------------------------------
    const { data: playerSlots, error: psErr } = await sb
      .from('player_slots')
      .select('*')
      .eq('match_id', MATCH_ID)
      .order('slot_number');

    if (psErr) { console.error('Error fetching player_slots:', psErr.message); process.exit(1); }

    console.log('--- player_slots ---');
    for (const ps of (playerSlots || [])) {
      console.log('  Slot ' + ps.slot_number + ': multiplier=' + ps.multiplier + ', is_enabled=' + ps.is_enabled);
    }
    console.log('');

    // -------------------------------------------------------
    // 10. Player picks — resolve names + stats
    // -------------------------------------------------------
    const playerPicks = bet.player_picks || [];
    const playerDetails = [];

    for (const pick of playerPicks) {
      const playerId = pick.player_id;
      const slotNum = pick.slot;

      // Get player name from players table
      const { data: playerRow } = await sb
        .from('players')
        .select('player_id, name, team')
        .eq('player_id', playerId)
        .maybeSingle();

      // Use the name stored in the bet as fallback (bet stores player_name)
      const playerName = playerRow ? playerRow.name : (pick.player_name || '(unknown)');
      const playerTeam = playerRow ? playerRow.team : (pick.team || '?');

      // Get player match stats — first try by player_id from bet
      let { data: statsRow } = await sb
        .from('player_match_stats')
        .select('*')
        .eq('match_id', MATCH_ID)
        .eq('player_id', playerId)
        .maybeSingle();

      // If not found and we have a name, the bet may use a different UUID than player_match_stats.
      // Look for the player by name in player_match_stats via a join through players table.
      if (!statsRow && pick.player_name) {
        // Find the canonical player_id from the players table by name
        const { data: canonicalPlayer } = await sb
          .from('players')
          .select('player_id')
          .ilike('name', '%' + pick.player_name.split(' ').pop() + '%')
          .limit(5);

        if (canonicalPlayer && canonicalPlayer.length > 0) {
          for (const cp of canonicalPlayer) {
            const { data: altStats } = await sb
              .from('player_match_stats')
              .select('*')
              .eq('match_id', MATCH_ID)
              .eq('player_id', cp.player_id)
              .maybeSingle();
            if (altStats) {
              statsRow = altStats;
              break;
            }
          }
        }
      }

      // Get slot multiplier
      const slot = (playerSlots || []).find(s => s.slot_number === slotNum);

      playerDetails.push({
        slot: slotNum,
        playerId,
        name: playerName,
        team: playerTeam,
        fantasyPoints: statsRow ? statsRow.total_fantasy_points : null,
        multiplier: slot ? slot.multiplier : null,
        isEnabled: slot ? slot.is_enabled : false,
        stats: statsRow,
        statsPlayerId: statsRow ? statsRow.player_id : null,
        betPlayerId: playerId,
      });
    }

    // -------------------------------------------------------
    // 11. Runner picks — resolve names + scores
    // -------------------------------------------------------
    const runnerPicks = bet.runner_picks || [];
    const runnerDetails = [];

    for (const rp of runnerPicks) {
      const runnerId = rp.user_id;

      // Get runner name from leaderboard
      const { data: runnerRow } = await sb
        .from('leaderboard')
        .select('user_id, display_name')
        .eq('user_id', runnerId)
        .maybeSingle();

      // Get runner's bet for this match
      const { data: runnerBet } = await sb
        .from('bets')
        .select('score, winner_points, total_runs_points, player_pick_points, side_bet_points')
        .eq('user_id', runnerId)
        .eq('match_id', MATCH_ID)
        .maybeSingle();

      runnerDetails.push({
        userId: runnerId,
        name: runnerRow ? runnerRow.display_name : '(unknown)',
        betScore: runnerBet ? runnerBet.score : null,
        runnerBet,
      });
    }

    // =======================================================
    // DETAILED SCORING WALKTHROUGH
    // =======================================================

    console.log('');
    console.log('='.repeat(70));
    console.log("=== SHASHANK's wc_m13 (RSA vs AFG) SCORING DETAIL ===");
    console.log('='.repeat(70));

    // --- Build option label map ---
    const optionLabelMap = {};
    for (const q of (questions || [])) {
      if (q.options && Array.isArray(q.options)) {
        for (const opt of q.options) {
          const id = opt.optionId || opt.option_id;
          if (id) optionLabelMap[id] = opt.label || opt.text || id;
        }
      }
    }

    // -------------------------------------------------------
    // SECTION 1: WINNER
    // -------------------------------------------------------
    console.log('\n--- 1. WINNER ---');
    const winnerQ = (questions || []).find(q => q.kind === 'WINNER');
    if (winnerQ) {
      console.log('Question: ' + (winnerQ.question_text || winnerQ.text || '(no text)'));
      console.log('Question ID: ' + winnerQ.question_id);

      // Find Shashank's answer
      const userWinnerAnswer = bet.answers ? bet.answers[winnerQ.question_id] : undefined;
      const userWinnerLabel = userWinnerAnswer ? (optionLabelMap[userWinnerAnswer] || userWinnerAnswer) : '(no answer)';

      console.log('Shashank\'s answer: ' + (userWinnerAnswer || '(none)') + ' -> ' + userWinnerLabel);

      // Correct answer
      const correctWinner = matchResult.winner;
      const correctWinnerLabel = optionLabelMap[correctWinner] || correctWinner;
      console.log('Correct answer (match_results.winner): ' + correctWinner + ' -> ' + correctWinnerLabel);

      // Compare using the normalized logic from RPC
      const normalize = (s) => (s || '').toLowerCase().replace(/_/g, '');
      const userNorm = normalize(userWinnerAnswer);
      const correctNorm = normalize(correctWinner);

      // Check each option like the RPC does
      let isCorrect = false;
      let isSuperOver = false;
      if (winnerQ.options && Array.isArray(winnerQ.options)) {
        for (const opt of winnerQ.options) {
          const optId = opt.optionId || opt.option_id;
          const optNorm = normalize(optId);
          if (optNorm === userNorm) {
            // Check if this option matches the winner
            if (optNorm === correctNorm
                || normalize(opt.label || '') === correctNorm
                || normalize(opt.referenceId || '') === correctNorm) {
              isCorrect = true;
            }
            // Check super over
            if (optNorm.includes('superover') || (opt.label || '').toLowerCase().includes('super') && (opt.label || '').toLowerCase().includes('over')) {
              isSuperOver = true;
            }
          }
        }
      }

      const winnerBase = matchConfig.winner_base_points || winnerQ.points;
      const soMultiplier = matchConfig.super_over_multiplier || 5;
      let calculatedWinnerPts = 0;

      if (isCorrect) {
        if (isSuperOver) {
          calculatedWinnerPts = winnerBase * soMultiplier;
          console.log('Result: CORRECT (Super Over) -> ' + winnerBase + ' base * ' + soMultiplier + 'x super over multiplier = ' + calculatedWinnerPts + ' points');
        } else {
          calculatedWinnerPts = winnerBase;
          console.log('Result: CORRECT -> ' + calculatedWinnerPts + ' points (base: ' + winnerBase + ')');
        }
      } else {
        console.log('Result: WRONG -> 0 points');
        console.log('  (base points would have been: ' + winnerBase + ', super over multiplier: ' + soMultiplier + 'x)');
      }
      console.log('Stored winner_points: ' + bet.winner_points);
    } else {
      console.log('  No WINNER question found for this match!');
    }

    // -------------------------------------------------------
    // SECTION 2: TOTAL RUNS
    // -------------------------------------------------------
    console.log('\n--- 2. TOTAL RUNS ---');
    const runsQ = (questions || []).find(q => q.kind === 'TOTAL_RUNS');
    if (runsQ) {
      console.log('Question: ' + (runsQ.question_text || runsQ.text || '(no text)'));
      console.log('Question ID: ' + runsQ.question_id);

      const userRunsAnswer = bet.answers ? bet.answers[runsQ.question_id] : undefined;
      const actualRuns = matchResult.total_runs;
      const runsBase = matchConfig.total_runs_base_points || runsQ.points;

      console.log('Shashank\'s answer: ' + (userRunsAnswer || '(none)'));
      console.log('Actual total runs: ' + actualRuns);

      let calculatedRunsPts = 0;
      if (userRunsAnswer && String(userRunsAnswer).match(/^\d+$/)) {
        const distance = Math.abs(parseInt(userRunsAnswer) - actualRuns);
        console.log('Distance: ' + distance);

        let bracket = '';
        if (distance === 0) {
          calculatedRunsPts = runsBase * 5;
          bracket = 'exact (5x base)';
        } else if (distance === 1) {
          calculatedRunsPts = runsBase;
          bracket = 'off-by-1 (1x base)';
        } else if (distance <= 5) {
          calculatedRunsPts = Math.round(runsBase * 0.5);
          bracket = 'off-by-2-to-5 (0.5x base)';
        } else if (distance <= 10) {
          calculatedRunsPts = Math.round(runsBase * 0.25);
          bracket = 'off-by-6-to-10 (0.25x base)';
        } else if (distance <= 15) {
          calculatedRunsPts = Math.round(runsBase * 0.1);
          bracket = 'off-by-11-to-15 (0.1x base)';
        } else {
          calculatedRunsPts = 0;
          bracket = 'off-by-16+ (0 points)';
        }
        console.log('Result: ' + calculatedRunsPts + ' points (bracket: ' + bracket + ', base: ' + runsBase + ')');
      } else {
        console.log('Result: No valid numeric answer -> 0 points');
      }
      console.log('Stored total_runs_points: ' + bet.total_runs_points);
    } else {
      console.log('  No TOTAL_RUNS question found for this match!');
    }

    // -------------------------------------------------------
    // SECTION 3: PLAYER PICKS
    // -------------------------------------------------------
    console.log('\n--- 3. PLAYER PICKS ---');
    let playerPickTotal = 0;

    if (playerDetails.length === 0) {
      console.log('  No player picks.');
    } else {
      for (const pd of playerDetails) {
        const fp = pd.fantasyPoints != null ? pd.fantasyPoints : 0;
        const mult = pd.multiplier != null ? pd.multiplier : 0;
        const slotPts = pd.isEnabled && pd.fantasyPoints != null && pd.multiplier != null
          ? Math.round(fp * mult)
          : 0;
        playerPickTotal += slotPts;

        console.log('  Slot ' + pd.slot + ' (multiplier ' + mult + 'x): ' + pd.name + ' (' + pd.team + ')');
        if (pd.statsPlayerId && pd.statsPlayerId !== pd.betPlayerId) {
          console.log('    NOTE: bet player_id (' + pd.betPlayerId.slice(0, 8) + '...) differs from stats player_id (' + pd.statsPlayerId.slice(0, 8) + '...) — matched by name');
        }
        if (pd.stats) {
          console.log('    Stats: ' + pd.stats.runs + ' runs, ' + pd.stats.wickets + ' wkts, ' +
            (pd.stats.catches || 0) + ' catches, ' + (pd.stats.run_outs || 0) + ' run outs' +
            (pd.stats.is_man_of_match ? ', MoM' : ''));
        } else {
          console.log('    Stats: NOT FOUND in player_match_stats (bet player_id: ' + pd.betPlayerId + ')');
        }
        console.log('    Fantasy points: ' + fp);
        console.log('    Slot points: ' + fp + ' * ' + mult + ' = ' + slotPts + (pd.isEnabled ? '' : ' (SLOT DISABLED)'));
      }
    }
    console.log('  Subtotal (calculated): ' + playerPickTotal);
    console.log('  Stored player_pick_points: ' + bet.player_pick_points);

    // -------------------------------------------------------
    // SECTION 4: SIDE BETS
    // -------------------------------------------------------
    console.log('\n--- 4. SIDE BETS ---');
    let sideBetTotal = 0;

    // 4a. side_bets table entries
    if (sideBets && sideBets.length > 0) {
      for (const sb2 of sideBets) {
        const userSbAnswer = bet.side_bet_answers ? bet.side_bet_answers[sb2.side_bet_id] : undefined;
        const correctSb = sb2.correct_answer;

        console.log('  [side_bets table] Q: ' + sb2.question_text);
        console.log('    side_bet_id: ' + sb2.side_bet_id);
        console.log('    Shashank\'s answer: ' + (userSbAnswer || '(none)'));
        console.log('    Correct answer: ' + (correctSb || '(not set)'));

        if (userSbAnswer && correctSb) {
          if (userSbAnswer === correctSb) {
            const pts = sb2.points_correct || 0;
            sideBetTotal += pts;
            console.log('    Result: CORRECT -> +' + pts + ' points');
          } else {
            const pts = sb2.points_wrong || 0;
            sideBetTotal += pts;
            console.log('    Result: WRONG -> ' + pts + ' points');
          }
        } else {
          console.log('    Result: No answer or no correct answer set -> 0 points');
        }
      }
    } else {
      console.log('  No side_bets table entries for this match.');
    }

    // 4b. match_questions with section = 'SIDE'
    const sideQuestions = (questions || []).filter(q => q.section === 'SIDE' && q.status !== 'disabled');
    if (sideQuestions.length > 0) {
      for (const sq of sideQuestions) {
        const userAnswer = bet.answers ? bet.answers[sq.question_id] : undefined;
        const correctAnswer = matchResult.side_bet_answers ? matchResult.side_bet_answers[sq.question_id] : undefined;

        console.log('  [match_questions SIDE] Q: ' + (sq.question_text || sq.text || sq.question_id));
        console.log('    question_id: ' + sq.question_id);
        console.log('    Shashank\'s answer: ' + (userAnswer || '(none)'));
        console.log('    Correct answer (from match_results.side_bet_answers): ' + (correctAnswer || '(not set)'));

        if (userAnswer && correctAnswer) {
          if (userAnswer === correctAnswer) {
            const pts = sq.points || 0;
            sideBetTotal += pts;
            console.log('    Result: CORRECT -> +' + pts + ' points');
          } else {
            const pts = sq.points_wrong || 0;
            sideBetTotal += pts;
            console.log('    Result: WRONG -> ' + pts + ' points');
          }
        } else {
          console.log('    Result: No answer or no correct answer set -> 0 points');
        }
      }
    }

    console.log('  Subtotal (calculated): ' + sideBetTotal);
    console.log('  Stored side_bet_points: ' + bet.side_bet_points);

    // -------------------------------------------------------
    // SECTION 5: RUNNERS
    // -------------------------------------------------------
    console.log('\n--- 5. RUNNERS ---');
    let runnerTotal = 0;

    if (runnerDetails.length === 0) {
      console.log('  No runner picks.');
    } else {
      // NOTE: The RPC loop logic iterates runner_picks but overwrites v_runner_points
      // (not accumulates) — so only the LAST runner's score is used.
      // But let's show all runners for transparency.
      for (const rd of runnerDetails) {
        const runnerScore = rd.betScore != null ? rd.betScore : 0;
        console.log('  Runner: ' + rd.name + ' (user_id: ' + rd.userId + ')');
        if (rd.runnerBet) {
          console.log('    Runner\'s own score for ' + MATCH_ID + ': ' + rd.betScore);
          console.log('    (winner: ' + (rd.runnerBet.winner_points || 0) +
            ', runs: ' + (rd.runnerBet.total_runs_points || 0) +
            ', players: ' + (rd.runnerBet.player_pick_points || 0) +
            ', side: ' + (rd.runnerBet.side_bet_points || 0) + ')');
        } else {
          console.log('    Runner did NOT bet on ' + MATCH_ID + ' -> 0 points');
        }
        console.log('    Points from runner: ' + runnerScore);
        // The RPC has a bug: it overwrites v_runner_points in each iteration
        // instead of accumulating. So the last runner's score is used.
        runnerTotal = runnerScore;  // Matches the RPC behavior (overwrite, not add)
      }
      if (runnerDetails.length > 1) {
        console.log('  NOTE: RPC bug — runner loop OVERWRITES v_runner_points each iteration.');
        console.log('  Only the LAST runner\'s score counts: ' + runnerTotal);
      }
    }
    console.log('  Stored runner_points: ' + bet.runner_points);

    // -------------------------------------------------------
    // TOTAL
    // -------------------------------------------------------
    console.log('\n' + '='.repeat(70));
    console.log('=== TOTAL ===');
    console.log('='.repeat(70));

    // The RPC calculates: score = winner + runs + players + side_bets (first pass)
    // Then adds runner_points in second pass: score = score + runner_points
    const calcOwnScore = (bet.winner_points || 0) + (bet.total_runs_points || 0) + (bet.player_pick_points || 0) + (bet.side_bet_points || 0);
    const calcTotal = calcOwnScore + (bet.runner_points || 0);

    console.log('');
    console.log('  Winner:    ' + String(bet.winner_points || 0).padStart(6));
    console.log('  Runs:      ' + String(bet.total_runs_points || 0).padStart(6));
    console.log('  Players:   ' + String(bet.player_pick_points || 0).padStart(6));
    console.log('  Side Bets: ' + String(bet.side_bet_points || 0).padStart(6));
    console.log('  Runners:   ' + String(bet.runner_points || 0).padStart(6));
    console.log('  ' + '-'.repeat(16));
    console.log('  Calculated:' + String(calcTotal).padStart(6));
    console.log('');
    console.log('  Stored score in DB (bet.score): ' + bet.score);
    console.log('  Match: ' + (calcTotal === bet.score ? 'MATCHES' : 'MISMATCH (calculated=' + calcTotal + ' vs stored=' + bet.score + ')'));
    console.log('');

    // Also verify our manual calculation vs stored breakdown
    console.log('--- Manual Recalculation Check ---');
    const manualWinner = winnerQ ? (function() {
      const userAns = bet.answers ? bet.answers[winnerQ.question_id] : null;
      if (!userAns) return 0;
      const norm = (s) => (s || '').toLowerCase().replace(/_/g, '');
      const userNorm = norm(userAns);
      const correctNorm = norm(matchResult.winner);
      const base = matchConfig.winner_base_points || winnerQ.points;
      const soMult = matchConfig.super_over_multiplier || 5;
      let correct = false, superOver = false;
      for (const opt of (winnerQ.options || [])) {
        const optId = opt.optionId || opt.option_id;
        if (norm(optId) === userNorm) {
          if (norm(optId) === correctNorm || norm(opt.label || '') === correctNorm || norm(opt.referenceId || '') === correctNorm) correct = true;
          if (norm(optId).includes('superover')) superOver = true;
        }
      }
      if (!correct) return 0;
      return superOver ? base * soMult : base;
    })() : 0;

    const manualRuns = runsQ ? (function() {
      const userAns = bet.answers ? bet.answers[runsQ.question_id] : null;
      if (!userAns || !String(userAns).match(/^\d+$/)) return 0;
      const base = matchConfig.total_runs_base_points || runsQ.points;
      const dist = Math.abs(parseInt(userAns) - matchResult.total_runs);
      if (dist === 0) return base * 5;
      if (dist === 1) return base;
      if (dist <= 5) return Math.round(base * 0.5);
      if (dist <= 10) return Math.round(base * 0.25);
      if (dist <= 15) return Math.round(base * 0.1);
      return 0;
    })() : 0;

    console.log('  Manual winner calc:  ' + manualWinner + ' (stored: ' + (bet.winner_points || 0) + ') ' + (manualWinner === (bet.winner_points || 0) ? 'OK' : 'MISMATCH'));
    console.log('  Manual runs calc:    ' + manualRuns + ' (stored: ' + (bet.total_runs_points || 0) + ') ' + (manualRuns === (bet.total_runs_points || 0) ? 'OK' : 'MISMATCH'));
    console.log('  Manual players calc: ' + playerPickTotal + ' (stored: ' + (bet.player_pick_points || 0) + ') ' + (playerPickTotal === (bet.player_pick_points || 0) ? 'OK' : 'MISMATCH'));
    console.log('  Manual side bet calc:' + sideBetTotal + ' (stored: ' + (bet.side_bet_points || 0) + ') ' + (sideBetTotal === (bet.side_bet_points || 0) ? 'OK' : 'MISMATCH'));
    console.log('  Manual runner calc:  ' + runnerTotal + ' (stored: ' + (bet.runner_points || 0) + ') ' + (runnerTotal === (bet.runner_points || 0) ? 'OK' : 'MISMATCH'));

    const manualTotal = manualWinner + manualRuns + playerPickTotal + sideBetTotal + runnerTotal;
    console.log('  Manual total:        ' + manualTotal + ' (stored: ' + bet.score + ') ' + (manualTotal === bet.score ? 'OK' : 'MISMATCH'));

    console.log('\nDone.');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
