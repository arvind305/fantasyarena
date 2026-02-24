require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const moms = [
  { matchId: 'wc_m1', mom: 'Faheem Ashraf' },
  { matchId: 'wc_m2', mom: 'Shimron Hetmyer' },
  { matchId: 'wc_m3', mom: 'Suryakumar Yadav' },
  { matchId: 'wc_m4', mom: 'Tim Seifert' },
  { matchId: 'wc_m5', mom: 'Will Jacks' },
  { matchId: 'wc_m6', mom: 'Kamundu Mendis' },
  { matchId: 'wc_m7', mom: 'Michael Leask' },
];

(async () => {
  for (const { matchId, mom } of moms) {
    const { error } = await sb.from('match_results')
      .update({ man_of_match: mom })
      .eq('match_id', matchId);
    if (error) {
      console.log('Error updating', matchId, ':', error.message);
    } else {
      console.log('Set MoM for', matchId, '->', mom);
    }
  }

  // Verify
  console.log('\n=== MATCH RESULTS ===');
  const { data } = await sb.from('match_results')
    .select('match_id, winner, total_runs, man_of_match')
    .order('match_id');
  for (const r of (data || [])) {
    console.log(r.match_id.padEnd(8), 'Winner:', (r.winner || '').padEnd(30), 'Runs:', String(r.total_runs).padEnd(4), 'MoM:', r.man_of_match || '-');
  }
})();
