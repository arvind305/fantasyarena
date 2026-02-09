/**
 * open-matches.js — Manages match statuses on a rolling 3-day window.
 *
 * - DRAFT matches within today + next 2 days → OPEN
 * - OPEN matches past lock_time → LOCKED
 * - OPEN matches beyond the 3-day window → DRAFT (shouldn't happen, but safety)
 * - SCORED matches are never touched
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

const toIST = (d) => new Date(d).toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
});

async function main() {
  const now = new Date();
  const endWindow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

  console.log('Now (IST):', toIST(now));
  console.log('Window end (IST):', toIST(endWindow));
  console.log('');

  const { data: configs, error } = await sb
    .from('match_config')
    .select('match_id, team_a, team_b, lock_time, status')
    .order('lock_time');

  if (error) {
    console.error('Error fetching configs:', error.message);
    return;
  }

  let opened = 0, locked = 0, drafted = 0;

  for (const m of configs) {
    if (m.status === 'SCORED') continue;

    const lockDate = new Date(m.lock_time);

    if (lockDate < now) {
      // Past lock_time → LOCKED
      if (m.status !== 'LOCKED') {
        await sb.from('match_config').update({ status: 'LOCKED' }).eq('match_id', m.match_id);
        await sb.from('match_questions').update({ status: 'CLOSED' }).eq('match_id', m.match_id);
        console.log('  LOCKED', m.match_id, m.team_a, 'vs', m.team_b, '|', toIST(lockDate), 'IST');
        locked++;
      }
    } else if (lockDate <= endWindow) {
      // Within 3-day window → OPEN
      if (m.status !== 'OPEN') {
        await sb.from('match_config').update({ status: 'OPEN' }).eq('match_id', m.match_id);
        await sb.from('match_questions').update({ status: 'OPEN' }).eq('match_id', m.match_id);
        console.log('  OPENED', m.match_id, m.team_a, 'vs', m.team_b, '|', toIST(lockDate), 'IST');
        opened++;
      }
    } else {
      // Beyond 3-day window → DRAFT
      if (m.status !== 'DRAFT') {
        await sb.from('match_config').update({ status: 'DRAFT' }).eq('match_id', m.match_id);
        await sb.from('match_questions').update({ status: 'DRAFT' }).eq('match_id', m.match_id);
        console.log('  DRAFT', m.match_id, m.team_a, 'vs', m.team_b, '|', toIST(lockDate), 'IST');
        drafted++;
      }
    }
  }

  console.log('\nDone. Opened:', opened, '| Locked:', locked, '| Drafted:', drafted);

  // Show current open matches
  console.log('\nCurrently OPEN matches:');
  for (const m of configs) {
    const lockDate = new Date(m.lock_time);
    if (lockDate >= now && lockDate <= endWindow && (m.status === 'OPEN' || opened > 0)) {
      const { data: fresh } = await sb
        .from('match_config').select('status').eq('match_id', m.match_id).single();
      if (fresh.status === 'OPEN') {
        console.log(' ', m.match_id, m.team_a, 'vs', m.team_b, '|', toIST(lockDate), 'IST');
      }
    }
  }
}

main().catch(console.error);
