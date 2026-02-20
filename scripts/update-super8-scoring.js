/**
 * Update Super 8 scoring configuration (wc_m41 to wc_m52)
 *
 * Changes:
 * - Winner: +5000 correct, -1000 wrong
 * - Total runs base: 1000 → 2000 (doubles all tiers)
 * - Player slots: 4 slots (15x, 10x, 7x, 3x) instead of 3 (3x, 2x, 1x)
 * - Side bets: +5000/-5000, 2 per match, non-binary only
 *
 * PREREQUISITE: Run 016_winner_wrong_points.sql in Supabase SQL Editor first!
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MATCH_IDS = [
  'wc_m41','wc_m42','wc_m43','wc_m44','wc_m45','wc_m46',
  'wc_m47','wc_m48','wc_m49','wc_m50','wc_m51','wc_m52',
];

// New side bet questions (non-binary, 3+ options)
// Each match needs exactly 2 visible side bets
const NEW_SIDE_BETS = {
  // Matches with existing BINARY bets (hidden) — need 2 new questions each
  wc_m41: [
    { question_text: "How many sixes will be hit in the match?", options: ["0-5","6-10","11-15","16+"] },
    { question_text: "What will the highest individual score be?", options: ["0-30","31-50","51-75","76+"] },
  ],
  wc_m43: [
    { question_text: "What will the powerplay score of the first innings be?", options: ["0-35","36-50","51-65","66+"] },
    { question_text: "How many boundaries (4s+6s) will be hit in the match?", options: ["0-20","21-30","31-40","41+"] },
  ],
  wc_m44: [
    { question_text: "How many extras will be bowled in the match?", options: ["0-8","9-15","16-22","23+"] },
    { question_text: "How many sixes will be hit in the match?", options: ["0-5","6-10","11-15","16+"] },
  ],
  wc_m48: [
    { question_text: "What will the first innings total be?", options: ["<=140","141-165","166-190","191+"] },
    { question_text: "How many catches will be taken in the match?", options: ["0-4","5-8","9-12","13+"] },
  ],
  wc_m51: [
    { question_text: "How many players will score 30+ runs in the match?", options: ["0-1","2-3","4-5","6+"] },
    { question_text: "What will the run rate be in the first 10 overs?", options: ["0-5.0","5.1-7.0","7.1-9.0","9.1+"] },
  ],
  wc_m52: [
    { question_text: "How many wickets will fall in the match?", options: ["1-6","7-10","11-14","15+"] },
    { question_text: "What will the highest individual score be?", options: ["0-30","31-50","51-75","76+"] },
  ],
  // Matches with existing MULTI bets (keep showing) — need 1 new question each
  wc_m42: [
    { question_text: "How many wickets will fall in the match?", options: ["1-6","7-10","11-14","15+"] },
  ],
  wc_m45: [
    { question_text: "What will the highest individual score be?", options: ["0-30","31-50","51-75","76+"] },
  ],
  wc_m46: [
    { question_text: "How many wickets will fall in the match?", options: ["1-6","7-10","11-14","15+"] },
  ],
  wc_m47: [
    { question_text: "What will the powerplay score of the first innings be?", options: ["0-35","36-50","51-65","66+"] },
  ],
  wc_m49: [
    { question_text: "What will the powerplay score of the first innings be?", options: ["0-35","36-50","51-65","66+"] },
  ],
  wc_m50: [
    { question_text: "How many extras will be bowled in the match?", options: ["0-8","9-15","16-22","23+"] },
  ],
};

async function main() {
  console.log('=== Updating Super 8 Scoring Configuration ===\n');

  // ── 1. Update match_config ──
  console.log('1. Updating match_config...');
  for (const matchId of MATCH_IDS) {
    const { error } = await sb.from('match_config').update({
      winner_base_points: 5000,
      winner_wrong_points: -1000,
      total_runs_base_points: 2000,
      player_slot_count: 4,
    }).eq('match_id', matchId);
    if (error) { console.error(`  ${matchId} ERROR:`, error.message); continue; }
    console.log(`  ${matchId}: winner=5000/-1000, runs_base=2000, slots=4`);
  }

  // ── 2. Update player_slots ──
  console.log('\n2. Updating player_slots...');
  const NEW_MULTIPLIERS = { 1: 15, 2: 10, 3: 7 };

  for (const matchId of MATCH_IDS) {
    // Update existing 3 slots
    for (const [slotNum, mult] of Object.entries(NEW_MULTIPLIERS)) {
      await sb.from('player_slots')
        .update({ multiplier: mult })
        .eq('match_id', matchId)
        .eq('slot_number', parseInt(slotNum));
    }

    // Add 4th slot (upsert to handle re-runs)
    const { error } = await sb.from('player_slots').upsert({
      match_id: matchId,
      slot_number: 4,
      multiplier: 3,
      is_enabled: true,
    }, { onConflict: 'match_id,slot_number' });
    if (error) { console.error(`  ${matchId} slot 4 ERROR:`, error.message); continue; }
    console.log(`  ${matchId}: 15x, 10x, 7x, 3x`);
  }

  // ── 3. Update existing side bets points ──
  console.log('\n3. Updating existing side bet points...');
  for (const matchId of MATCH_IDS) {
    const { data: existing } = await sb.from('side_bets')
      .select('side_bet_id, question_text, options')
      .eq('match_id', matchId);

    for (const bet of (existing || [])) {
      const opts = bet.options || [];
      if (opts.length > 2) {
        // Multi-option: update points to 5000/-5000
        await sb.from('side_bets').update({
          points_correct: 5000,
          points_wrong: -5000,
        }).eq('side_bet_id', bet.side_bet_id);
        console.log(`  ${matchId}: "${bet.question_text}" → +5000/-5000`);
      } else {
        // Binary: keep in DB but don't update points (won't be shown)
        console.log(`  ${matchId}: "${bet.question_text}" [BINARY - hidden]`);
      }
    }
  }

  // ── 4. Insert new side bets ──
  console.log('\n4. Inserting new side bets...');
  for (const [matchId, questions] of Object.entries(NEW_SIDE_BETS)) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { error } = await sb.from('side_bets').insert({
        match_id: matchId,
        question_text: q.question_text,
        options: q.options,
        points_correct: 5000,
        points_wrong: -5000,
        display_order: i + 1, // after existing (order 0)
        status: 'OPEN',
      });
      if (error) {
        console.error(`  ${matchId} insert ERROR:`, error.message);
      } else {
        console.log(`  ${matchId}: + "${q.question_text}" (${q.options.length} opts)`);
      }
    }
  }

  // ── 5. Verify ──
  console.log('\n=== Verification ===\n');

  // match_config
  const { data: configs } = await sb.from('match_config')
    .select('match_id, winner_base_points, winner_wrong_points, total_runs_base_points, player_slot_count')
    .in('match_id', MATCH_IDS)
    .order('match_id');
  console.log('match_config:');
  configs.forEach(c => console.log(`  ${c.match_id}: winner=${c.winner_base_points}/${c.winner_wrong_points} runs=${c.total_runs_base_points} slots=${c.player_slot_count}`));

  // player_slots
  const { data: slots } = await sb.from('player_slots')
    .select('match_id, slot_number, multiplier')
    .in('match_id', MATCH_IDS)
    .order('match_id')
    .order('slot_number');
  const slotsByMatch = {};
  slots.forEach(s => {
    if (!slotsByMatch[s.match_id]) slotsByMatch[s.match_id] = [];
    slotsByMatch[s.match_id].push(`${s.multiplier}x`);
  });
  console.log('\nplayer_slots:');
  Object.entries(slotsByMatch).forEach(([m, s]) => console.log(`  ${m}: ${s.join(', ')}`));

  // side_bets
  const { data: allSideBets } = await sb.from('side_bets')
    .select('match_id, question_text, options, points_correct, points_wrong')
    .in('match_id', MATCH_IDS)
    .order('match_id')
    .order('display_order');
  console.log('\nside_bets (all):');
  allSideBets.forEach(sb => {
    const opts = sb.options || [];
    const type = opts.length <= 2 ? 'HIDDEN' : 'SHOWN';
    console.log(`  ${sb.match_id} [${type}] +${sb.points_correct}/${sb.points_wrong}: "${sb.question_text}" (${opts.length} opts)`);
  });

  console.log('\nDone!');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
