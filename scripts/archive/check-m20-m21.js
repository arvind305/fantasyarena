require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Find match IDs from schedule
  const data = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'ui', 'public', 'data', 't20wc_2026.json'), 'utf8'));
  const targets = data.matches.filter(m =>
    (m.teams.includes('CAN') && m.teams.includes('UAE')) ||
    (m.teams.includes('USA') && m.teams.includes('NED'))
  );
  targets.forEach(m => console.log('wc_m' + m.match_id, m.teams.join(' vs '), m.date));

  for (const m of targets) {
    const mid = 'wc_m' + m.match_id;
    console.log('\n=== ' + mid + ' (' + m.teams.join(' vs ') + ') ===');

    const { data: qs } = await sb.from('match_questions').select('question_id,kind,options').eq('match_id', mid);
    console.log('Questions:', (qs || []).length);
    (qs || []).forEach(q => console.log('  ', q.question_id, q.kind, JSON.stringify(q.options)));

    const { data: sbs } = await sb.from('side_bets').select('side_bet_id,question_text,options,points_correct,points_wrong').eq('match_id', mid);
    console.log('Side bets:', (sbs || []).length);
    (sbs || []).forEach(s => console.log('  ', s.side_bet_id, s.question_text, JSON.stringify(s.options), '+' + s.points_correct, '/' + s.points_wrong));

    const { data: mc } = await sb.from('match_config').select('status,lock_time').eq('match_id', mid);
    console.log('Config:', mc);

    const { data: bets } = await sb.from('bets').select('user_id,player_picks').eq('match_id', mid);
    console.log('Bets:', (bets || []).length);
    const picked = new Set();
    (bets || []).forEach(b => {
      (b.player_picks || []).forEach(p => {
        picked.add(p.player_id + '|' + p.player_name);
      });
    });
    console.log('Picked players:');
    picked.forEach(p => console.log('  ', p));
  }
})();
