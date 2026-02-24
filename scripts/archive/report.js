const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://qvjsfovxdicgyzpwgzgc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anNmb3Z4ZGljZ3l6cHdnemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MDcyMCwiZXhwIjoyMDg2MDQ2NzIwfQ.TeWN1XEbNnZwbJygAUP4mcw8QywC7YqDZ-cohlUsnpE'
);

async function report() {
  const { data: bets } = await supabase.from('bets').select('*').order('submitted_at', { ascending: false });
  const { data: groups } = await supabase.from('groups').select('*');
  const { data: members } = await supabase.from('group_members').select('*');
  const { data: lb } = await supabase.from('leaderboard').select('*').order('total_score', { ascending: false });

  console.log('');
  console.log('========================================================');
  console.log('   FANTASY ARENA - DATABASE REPORT');
  console.log('   ' + new Date().toISOString());
  console.log('========================================================');

  console.log('');
  console.log('--- SUMMARY ---');
  const uniqueUsers = [...new Set(bets.map(b => b.user_id))];
  console.log('Total Bets:        ' + bets.length);
  console.log('Unique Users:      ' + uniqueUsers.length);

  const byMatch = {};
  bets.forEach(b => { byMatch[b.match_id] = (byMatch[b.match_id] || 0) + 1; });
  console.log('Matches with bets: ' + Object.keys(byMatch).length);

  console.log('');
  console.log('--- BETS BY MATCH ---');
  Object.entries(byMatch).sort().forEach(([match, count]) => {
    console.log('  ' + match + ': ' + count + ' bet(s)');
  });

  console.log('');
  console.log('--- BETS BY USER ---');
  uniqueUsers.forEach(userId => {
    const userBets = bets.filter(b => b.user_id === userId);
    const isGoogle = userId.length > 15;
    const type = isGoogle ? 'Google User' : 'Dev/Test';
    console.log('');
    console.log('  User ID: ' + userId);
    console.log('  Type:    ' + type);
    console.log('  Bets:    ' + userBets.length);
    userBets.forEach(b => {
      const date = b.submitted_at.substring(0, 16).replace('T', ' ');
      console.log('    - ' + b.match_id + ' | ' + date + ' UTC');
    });
  });

  console.log('');
  console.log('--- ALL BETS DETAIL ---');
  bets.forEach((b, i) => {
    console.log('');
    console.log('Bet #' + (i+1));
    console.log('  User:    ' + b.user_id);
    console.log('  Match:   ' + b.match_id);
    console.log('  Answers: ' + JSON.stringify(b.answers));
    console.log('  Time:    ' + b.submitted_at);
    console.log('  Locked:  ' + b.is_locked);
    console.log('  Score:   ' + (b.score === null ? 'Not scored' : b.score));
  });

  console.log('');
  console.log('--- GROUPS ---');
  console.log('Total Groups:  ' + (groups ? groups.length : 0));
  console.log('Total Members: ' + (members ? members.length : 0));
  if (groups && groups.length > 0) {
    groups.forEach(g => {
      const count = members ? members.filter(m => m.group_id === g.group_id).length : 0;
      console.log('  - ' + g.name + ' | Code: ' + g.join_code + ' | Members: ' + count);
    });
  }

  console.log('');
  console.log('--- LEADERBOARD ---');
  console.log('Total Entries: ' + (lb ? lb.length : 0));
  if (lb && lb.length > 0) {
    lb.forEach((e, i) => {
      const name = e.display_name || e.user_id.substring(0, 15) + '...';
      console.log('  ' + (i+1) + '. ' + name + ' | Score: ' + e.total_score + ' | Matches: ' + e.matches_played);
    });
  }

  console.log('');
  console.log('========================================================');
  console.log('                    END OF REPORT');
  console.log('========================================================');
}

report();
