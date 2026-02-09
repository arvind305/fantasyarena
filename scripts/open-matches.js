/**
 * open-matches.js — Opens all matches for today + next 2 days for betting.
 * Also sets past unscored matches to LOCKED.
 *
 * Usage: node scripts/open-matches.js
 *
 * Can be run manually or via a cron job.
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

async function main() {
  const now = new Date();
  const endWindow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

  console.log('Now (UTC):', now.toISOString());
  console.log('Window end (UTC):', endWindow.toISOString());
  console.log('');

  // Fetch all match configs
  const { data: configs, error } = await sb
    .from('match_config')
    .select('match_id, team_a, team_b, lock_time, status')
    .order('lock_time');

  if (error) {
    console.error('Error fetching configs:', error.message);
    return;
  }

  let opened = 0;
  let locked = 0;

  for (const m of configs) {
    const lockDate = new Date(m.lock_time);
    const lockIST = lockDate.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Match is in the next 3 days and not yet OPEN -> open it
    if (lockDate >= now && lockDate <= endWindow && m.status === 'DRAFT') {
      const { error: updateErr } = await sb
        .from('match_config')
        .update({ status: 'OPEN' })
        .eq('match_id', m.match_id);

      if (updateErr) {
        console.log('  ERROR opening', m.match_id, ':', updateErr.message);
      } else {
        // Also open match questions
        await sb.from('match_questions')
          .update({ status: 'OPEN' })
          .eq('match_id', m.match_id);

        console.log('  OPENED', m.match_id, m.team_a, 'vs', m.team_b, '|', lockIST, 'IST');
        opened++;
      }
    }
    // Match lock time has passed, not scored -> lock it
    else if (lockDate < now && m.status === 'OPEN') {
      const { error: lockErr } = await sb
        .from('match_config')
        .update({ status: 'LOCKED' })
        .eq('match_id', m.match_id);

      if (lockErr) {
        console.log('  ERROR locking', m.match_id, ':', lockErr.message);
      } else {
        await sb.from('match_questions')
          .update({ status: 'CLOSED' })
          .eq('match_id', m.match_id);

        console.log('  LOCKED', m.match_id, m.team_a, 'vs', m.team_b, '|', lockIST, 'IST (past lock time)');
        locked++;
      }
    }
  }

  console.log('\nDone. Opened:', opened, '| Locked:', locked);

  // Show current state of today + next 2 days
  console.log('\nCurrent state of upcoming matches:');
  for (const m of configs) {
    const lockDate = new Date(m.lock_time);
    if (lockDate >= now && lockDate <= endWindow) {
      const lockIST = lockDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      // Re-fetch status
      const { data: fresh } = await sb
        .from('match_config')
        .select('status')
        .eq('match_id', m.match_id)
        .single();
      console.log(' ', m.match_id, m.team_a, 'vs', m.team_b, '|', lockIST, 'IST | status:', fresh.status);
    }
  }
}

main().catch(console.error);
