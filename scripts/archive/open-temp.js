/**
 * Temporarily open wc_m42 (ENG vs SL) for 10 mins and wc_m43 (IND vs RSA) for 15 mins.
 * Sets lock_time to NOW + duration, status to OPEN.
 * After lock_time passes, auto-lock will handle the rest.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing REACT_APP_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key);

const toIST = (d) => new Date(d).toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short', month: 'short', day: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
});

async function openMatch(matchId, durationMinutes) {
  const now = new Date();
  const lockTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // Get current state
  const { data: current, error: fetchErr } = await sb
    .from('match_config')
    .select('match_id, team_a, team_b, status, lock_time')
    .eq('match_id', matchId)
    .single();

  if (fetchErr || !current) {
    console.error(`Failed to fetch ${matchId}:`, fetchErr?.message);
    return false;
  }

  console.log(`\n${matchId} (${current.team_a} vs ${current.team_b})`);
  console.log(`  Current status: ${current.status}`);
  console.log(`  Current lock_time: ${current.lock_time ? toIST(current.lock_time) : 'none'}`);

  // Update match_config: set OPEN + new lock_time
  const { error: updateErr } = await sb
    .from('match_config')
    .update({ status: 'OPEN', lock_time: lockTime.toISOString() })
    .eq('match_id', matchId);

  if (updateErr) {
    console.error(`  Failed to update match_config:`, updateErr.message);
    return false;
  }

  // Also open match_questions
  const { error: qErr } = await sb
    .from('match_questions')
    .update({ status: 'OPEN' })
    .eq('match_id', matchId);

  if (qErr) {
    console.warn(`  Warning: match_questions update failed:`, qErr.message);
  }

  // Unlock any existing bets
  await sb
    .from('bets')
    .update({ is_locked: false })
    .eq('match_id', matchId);

  console.log(`  -> OPENED for ${durationMinutes} minutes`);
  console.log(`  -> New lock_time: ${toIST(lockTime)} IST`);
  console.log(`  -> Will auto-lock at: ${toIST(lockTime)} IST`);

  return true;
}

async function main() {
  console.log('=== Opening matches for temporary betting ===');
  console.log(`Current time (IST): ${toIST(new Date())}\n`);

  const m42 = await openMatch('wc_m42', 10);  // ENG vs SL — 10 mins
  const m43 = await openMatch('wc_m43', 15);  // IND vs RSA — 15 mins

  console.log('\n=== Summary ===');
  if (m42) console.log('wc_m42 (ENG vs SL): OPEN for 10 minutes');
  if (m43) console.log('wc_m43 (IND vs RSA): OPEN for 15 minutes');

  // Verify by re-reading
  console.log('\n=== Verification ===');
  const { data: verify } = await sb
    .from('match_config')
    .select('match_id, team_a, team_b, status, lock_time')
    .in('match_id', ['wc_m42', 'wc_m43']);

  for (const m of (verify || [])) {
    console.log(`${m.match_id} (${m.team_a} vs ${m.team_b}): status=${m.status}, lock_time=${toIST(m.lock_time)} IST`);
  }
}

main().catch(console.error);
