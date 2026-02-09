require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const allTemplates = require('../data/side-bet-templates.json').templates;

(async () => {
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // IST display helper
  const toIST = (d) => new Date(d).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  console.log('Now (IST):', toIST(now));
  console.log('Window end (IST):', toIST(threeDays));
  console.log('');

  // =============================================
  // STEP 1: Fix match statuses — only today+2 days OPEN
  // =============================================
  console.log('=== STEP 1: Fix match statuses ===');
  const { data: configs } = await sb.from('match_config')
    .select('match_id, team_a, team_b, lock_time, status')
    .order('lock_time');

  let opened = 0, drafted = 0, locked = 0;

  for (const m of configs) {
    const lockDate = new Date(m.lock_time);

    if (m.status === 'SCORED') continue; // Never touch scored matches

    if (lockDate < now) {
      // Past match -> LOCKED
      if (m.status !== 'LOCKED') {
        await sb.from('match_config').update({ status: 'LOCKED' }).eq('match_id', m.match_id);
        await sb.from('match_questions').update({ status: 'CLOSED' }).eq('match_id', m.match_id);
        console.log('  LOCKED', m.match_id, m.team_a, 'vs', m.team_b, '|', toIST(lockDate));
        locked++;
      }
    } else if (lockDate <= threeDays) {
      // Within 3-day window -> OPEN
      if (m.status !== 'OPEN') {
        await sb.from('match_config').update({ status: 'OPEN' }).eq('match_id', m.match_id);
        await sb.from('match_questions').update({ status: 'OPEN' }).eq('match_id', m.match_id);
        console.log('  OPENED', m.match_id, m.team_a, 'vs', m.team_b, '|', toIST(lockDate));
        opened++;
      }
    } else {
      // Beyond 3-day window -> DRAFT
      if (m.status !== 'DRAFT') {
        await sb.from('match_config').update({ status: 'DRAFT' }).eq('match_id', m.match_id);
        await sb.from('match_questions').update({ status: 'DRAFT' }).eq('match_id', m.match_id);
        console.log('  DRAFT', m.match_id, m.team_a, 'vs', m.team_b, '|', toIST(lockDate));
        drafted++;
      }
    }
  }
  console.log('Opened:', opened, '| Drafted:', drafted, '| Locked:', locked);

  // =============================================
  // STEP 2: Fix side bets — 1 per match, rotating, +/-1000
  // =============================================
  console.log('\n=== STEP 2: Fix side bets (1 per match, rotating, +/-1000) ===');

  // Delete ALL existing side bets on matches that haven't been scored
  // (scored matches keep their side bets intact)
  const unscoredMatches = configs.filter(m => m.status !== 'SCORED').map(m => m.match_id);
  // Also include matches that were just set to LOCKED/DRAFT
  const scoredMatches = configs.filter(m => m.status === 'SCORED').map(m => m.match_id);

  // Delete side bets for all non-scored matches
  for (const mid of unscoredMatches) {
    await sb.from('side_bets').delete().eq('match_id', mid);
  }
  console.log('Cleared side bets from', unscoredMatches.length, 'non-scored matches');

  // Assign 1 template per match, cycling through with no repeats in 5-6 window
  // Start from wc_m1 (scored matches already have side bets from the 4-default, 
  // but those are used for scoring so we won't touch them)
  const allMatches = configs.map(m => m.match_id);
  let templateIndex = 0;

  for (const mid of allMatches) {
    if (scoredMatches.includes(mid)) {
      // For scored matches: ensure they have exactly the side bets used for scoring
      // Don't modify them — skip
      templateIndex++; // Still advance the index to keep rotation aligned
      continue;
    }

    const template = allTemplates[templateIndex % allTemplates.length];
    templateIndex++;

    const { error } = await sb.from('side_bets').insert({
      match_id: mid,
      question_text: template.question_text,
      options: template.options,
      points_correct: 1000,
      points_wrong: -1000,
      display_order: 0,
      status: 'OPEN',
    });

    if (error) {
      console.log('  Error adding to', mid, ':', error.message);
    } else {
      console.log('  ', mid.padEnd(8), template.question_text.substring(0, 60), '| Options:', template.options.join(', '));
    }
  }

  // =============================================
  // STEP 3: Summary
  // =============================================
  console.log('\n=== FINAL STATE ===');
  const { data: summary } = await sb.from('match_config').select('match_id, status').order('match_id');
  const statusCounts = {};
  for (const s of summary) statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  console.log('Match statuses:', JSON.stringify(statusCounts));

  const { data: sbAll } = await sb.from('side_bets').select('match_id');
  const sbByMatch = {};
  for (const s of (sbAll || [])) sbByMatch[s.match_id] = (sbByMatch[s.match_id] || 0) + 1;
  const sbCounts = Object.values(sbByMatch);
  console.log('Side bets per match: min=' + Math.min(...sbCounts) + ' max=' + Math.max(...sbCounts) + ' total=' + sbAll.length);

  // Show open matches
  console.log('\nOpen matches (today + 2 days):');
  for (const m of summary) {
    if (m.status === 'OPEN') {
      const cfg = configs.find(c => c.match_id === m.match_id);
      console.log('  ', m.match_id, cfg.team_a, 'vs', cfg.team_b, '|', toIST(cfg.lock_time), 'IST');
    }
  }
})();
