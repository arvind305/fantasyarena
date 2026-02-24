const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Get ALL bets
  const { data: bets, error } = await sb
    .from('bets')
    .select('bet_id, match_id, user_id, answers')
    .order('match_id');

  if (error) { console.error(error); return; }

  // Get match_config for team mappings
  const { data: configs } = await sb.from('match_config').select('match_id, team_a, team_b');
  const configMap = {};
  configs.forEach(c => { configMap[c.match_id] = c; });

  // Get user names
  const userIds = [...new Set(bets.map(b => b.user_id))];
  const { data: users } = await sb.from('users').select('user_id, display_name').in('user_id', userIds);
  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

  let fixCount = 0;
  const fixes = [];

  for (const bet of bets) {
    const mid = bet.match_id;
    const config = configMap[mid];
    if (!config) continue;

    const answers = bet.answers || {};
    const keys = Object.keys(answers);
    const name = nameMap[bet.user_id] || bet.user_id.slice(0, 8);

    // Check if this bet uses V2 format (keys without q_ prefix)
    const v2WinnerKey = keys.find(k => k === mid + '_winner');
    const v2RunsKey = keys.find(k => k === mid + '_total_runs');
    const v1WinnerKey = keys.find(k => k === 'q_' + mid + '_winner');
    const v1RunsKey = keys.find(k => k === 'q_' + mid + '_total_runs');

    // Skip if already V1 format
    if (!v2WinnerKey && !v2RunsKey) continue;
    // Skip if BOTH formats exist (shouldn't happen, but just in case)
    if (v1WinnerKey || v1RunsKey) continue;

    const newAnswers = {};
    let changes = [];

    // Convert winner key and value
    if (v2WinnerKey) {
      const rawValue = answers[v2WinnerKey];
      let newValue = rawValue;

      // Convert team code to option ID
      if (rawValue && rawValue.toUpperCase() === config.team_a.toUpperCase()) {
        newValue = 'opt_' + mid + '_winner_teamA';
      } else if (rawValue && rawValue.toUpperCase() === config.team_b.toUpperCase()) {
        newValue = 'opt_' + mid + '_winner_teamB';
      } else if (rawValue && rawValue.toUpperCase() === 'SUPER_OVER') {
        newValue = 'opt_' + mid + '_winner_super_over';
      }
      // else: leave as-is (e.g., TIE or unknown values)

      newAnswers['q_' + mid + '_winner'] = newValue;
      changes.push('winner: ' + rawValue + ' -> ' + newValue);
    }

    // Convert runs key (value stays the same - it's a number string)
    if (v2RunsKey) {
      newAnswers['q_' + mid + '_total_runs'] = answers[v2RunsKey];
      changes.push('runs: key q_ prefix added');
    }

    // Copy any other keys that aren't being converted
    for (const k of keys) {
      if (k !== v2WinnerKey && k !== v2RunsKey) {
        newAnswers[k] = answers[k];
      }
    }

    fixes.push({
      bet_id: bet.bet_id,
      match_id: mid,
      user: name,
      oldAnswers: answers,
      newAnswers: newAnswers,
      changes: changes
    });
  }

  console.log('=== V2 -> V1 FORMAT FIXES NEEDED: ' + fixes.length + ' bets ===\n');

  for (const fix of fixes) {
    console.log(fix.match_id + ' | ' + fix.user.padEnd(20) + ' | ' + fix.changes.join(', '));
    console.log('  OLD: ' + JSON.stringify(fix.oldAnswers));
    console.log('  NEW: ' + JSON.stringify(fix.newAnswers));
  }

  if (fixes.length === 0) {
    console.log('No V2 format bets found. Nothing to fix.');
    return;
  }

  // Apply fixes
  console.log('\n=== APPLYING FIXES ===');
  for (const fix of fixes) {
    const { error: updateErr } = await sb
      .from('bets')
      .update({ answers: fix.newAnswers })
      .eq('bet_id', fix.bet_id);

    if (updateErr) {
      console.error('ERROR updating ' + fix.match_id + ' ' + fix.user + ':', updateErr);
    } else {
      console.log('Fixed: ' + fix.match_id + ' | ' + fix.user);
      fixCount++;
    }
  }

  console.log('\n=== DONE: ' + fixCount + '/' + fixes.length + ' bets normalized to V1 format ===');

  // Now create leaderboard entry for new users who don't have one
  console.log('\n=== CHECKING FOR MISSING LEADERBOARD ENTRIES ===');
  const allUserIds = [...new Set(bets.map(b => b.user_id))];
  const { data: lbEntries } = await sb
    .from('leaderboard')
    .select('user_id')
    .in('user_id', allUserIds);
  const lbUserIds = new Set((lbEntries || []).map(e => e.user_id));

  for (const uid of allUserIds) {
    if (!lbUserIds.has(uid)) {
      const displayName = nameMap[uid] || 'Player';
      console.log('Creating leaderboard entry for: ' + displayName + ' (' + uid.slice(0, 8) + ')');

      const { error: insertErr } = await sb
        .from('leaderboard')
        .insert({
          event_id: 't20wc_2026',
          user_id: uid,
          display_name: displayName,
          total_score: 0,
          matches_played: 0,
          last_match_score: 0
        });

      if (insertErr) {
        console.error('ERROR creating leaderboard entry:', insertErr);
      } else {
        console.log('  -> Created successfully');
      }
    }
  }

  // Verify
  console.log('\n=== VERIFICATION: Sample converted bets ===');
  const sampleIds = fixes.slice(0, 3).map(f => f.bet_id);
  if (sampleIds.length > 0) {
    const { data: verified } = await sb
      .from('bets')
      .select('bet_id, match_id, answers')
      .in('bet_id', sampleIds);
    (verified || []).forEach(v => {
      console.log(v.match_id + ': ' + JSON.stringify(v.answers));
    });
  }
})();
