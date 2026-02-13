/**
 * Fix Arvind's wc_m17 bet: convert V1 format keys/values to V2.
 *
 * V1: { "wc_m17_winner": "NEP", "wc_m17_total_runs": "300" }
 * V2: { "q_wc_m17_winner": "opt_wc_m17_winner_teamA", "q_wc_m17_total_runs": "300" }
 *
 * NEP is team_a in wc_m17, so the correct option ID is "opt_wc_m17_winner_teamA".
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCH_ID = 'wc_m17';
const BET_ID = 'bet_104262282893186176547_wc_m17';

(async () => {
  // First verify the current state
  const { data: bet, error } = await sb.from('bets')
    .select('bet_id, answers')
    .eq('bet_id', BET_ID)
    .single();

  if (error || !bet) {
    console.error('Bet not found:', error?.message);
    process.exit(1);
  }

  console.log('BEFORE:', JSON.stringify(bet.answers));

  // Verify match_config to confirm NEP = team_a
  const { data: mc } = await sb.from('match_config')
    .select('team_a, team_b')
    .eq('match_id', MATCH_ID)
    .single();
  console.log('Match teams: team_a=' + mc.team_a + ', team_b=' + mc.team_b);

  // Verify match_questions to get correct option IDs
  const { data: qs } = await sb.from('match_questions')
    .select('question_id, kind, options')
    .eq('match_id', MATCH_ID);

  for (const q of (qs || [])) {
    console.log(q.kind + ': question_id=' + q.question_id);
    if (q.options) {
      for (const opt of q.options) {
        console.log('  ' + (opt.optionId || opt.option_id) + ' → ' + (opt.label || opt.text));
      }
    }
  }

  // Build V2 answers
  const oldWinner = bet.answers['wc_m17_winner']; // "NEP"
  const oldRuns = bet.answers['wc_m17_total_runs']; // "300"

  // Map team code to option ID
  let winnerOptionId;
  if (oldWinner === mc.team_a) {
    winnerOptionId = 'opt_' + MATCH_ID + '_winner_teamA';
  } else if (oldWinner === mc.team_b) {
    winnerOptionId = 'opt_' + MATCH_ID + '_winner_teamB';
  } else if (oldWinner.toLowerCase().includes('super')) {
    winnerOptionId = 'opt_' + MATCH_ID + '_winner_superover';
  } else {
    console.error('Cannot map winner "' + oldWinner + '" to option ID');
    process.exit(1);
  }

  const newAnswers = {
    ['q_' + MATCH_ID + '_winner']: winnerOptionId,
    ['q_' + MATCH_ID + '_total_runs']: oldRuns,
  };

  console.log('\nAFTER (to write):', JSON.stringify(newAnswers));
  console.log('Winner: "' + oldWinner + '" → "' + winnerOptionId + '"');
  console.log('Runs: "' + oldRuns + '" → "' + oldRuns + '" (unchanged)');

  // Update
  const { error: upErr } = await sb.from('bets')
    .update({ answers: newAnswers })
    .eq('bet_id', BET_ID);

  if (upErr) {
    console.error('UPDATE FAILED:', upErr.message);
    process.exit(1);
  }

  // Verify
  const { data: fixed } = await sb.from('bets')
    .select('answers')
    .eq('bet_id', BET_ID)
    .single();

  console.log('\nVERIFIED:', JSON.stringify(fixed.answers));
  console.log('Done. Arvind\'s wc_m17 bet is now in V2 format.');
})();
