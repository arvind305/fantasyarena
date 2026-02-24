import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// ESM-compatible tournament config (mirrors _lib/tournament.js)
const TOURNAMENT_DATA_FILE = "/data/t20wc_2026.json";
const MATCH_ID_PREFIX = "wc_m";

/**
 * POST /api/send-reminders
 *
 * Called by external cron (cron-job.org every 10 min).
 * Sends web push notifications for matches about to START (using schedule time,
 * not lock_time — so notifications are correct even when lock_time is extended).
 *
 * Time windows:
 *   - 30-min reminder: match start BETWEEN now+25min AND now+35min
 *   - 10-min reminder: match start BETWEEN now+5min AND now+15min
 *
 * Requires: CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = req.headers["authorization"];
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(500).json({ error: "Missing Supabase env vars" });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return res.status(500).json({ error: "Missing VAPID env vars" });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const sb = createClient(url, key);

  try {
    // Fetch the match schedule for actual start times
    const scheduleUrl = `https://${req.headers.host}${TOURNAMENT_DATA_FILE}`;
    const scheduleRes = await fetch(scheduleUrl);
    if (!scheduleRes.ok) {
      return res.status(500).json({ error: "Failed to fetch schedule JSON" });
    }
    const schedule = await scheduleRes.json();

    // Build a map of match_id -> start time (UTC)
    const startTimeMap = {};
    for (const m of schedule.matches) {
      const matchId = `${MATCH_ID_PREFIX}${m.match_id}`;
      // date: "2026-02-18", time_gmt: "05:30" → UTC datetime
      const startUtc = new Date(`${m.date}T${m.time_gmt}:00Z`);
      startTimeMap[matchId] = startUtc;
    }

    // Get all OPEN or LOCKED matches (LOCKED ones may still need reminders
    // if they were locked early but match hasn't started yet)
    const { data: openMatches, error: matchErr } = await sb
      .from("match_config")
      .select("match_id, team_a, team_b, status")
      .in("status", ["OPEN", "LOCKED"]);

    if (matchErr) {
      return res.status(500).json({ error: matchErr.message });
    }

    const now = Date.now();

    const windows = [
      { type: "30min", label: "30 minutes", minMs: 25 * 60 * 1000, maxMs: 35 * 60 * 1000 },
      { type: "10min", label: "10 minutes", minMs: 5 * 60 * 1000, maxMs: 15 * 60 * 1000 },
    ];

    const result = { sent: {}, matches: [], errors: [] };

    for (const w of windows) {
      const rangeStart = now + w.minMs;
      const rangeEnd = now + w.maxMs;

      // Find matches whose SCHEDULED start time falls in this window
      const matchesInWindow = (openMatches || []).filter((m) => {
        const startTime = startTimeMap[m.match_id];
        if (!startTime) return false;
        const startMs = startTime.getTime();
        return startMs >= rangeStart && startMs <= rangeEnd;
      });

      if (matchesInWindow.length === 0) {
        result.sent[w.type] = 0;
        continue;
      }

      let sentCount = 0;

      for (const match of matchesInWindow) {
        // Check if we already sent this reminder
        const { data: existing } = await sb
          .from("notification_log")
          .select("id")
          .eq("match_id", match.match_id)
          .eq("reminder_type", w.type)
          .maybeSingle();

        if (existing) {
          continue;
        }

        // Fetch all subscribers
        const { data: subs, error: subErr } = await sb
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth");

        if (subErr || !subs || subs.length === 0) {
          continue;
        }

        const payload = JSON.stringify({
          title: `${match.team_a} vs ${match.team_b} starts in ${w.label}!`,
          body: "Place your bets before it locks!",
          url: `/match/${match.match_id}`,
        });

        // Send in batches of 10 for concurrency control
        const BATCH_SIZE = 10;
        const staleIds = [];
        for (let i = 0; i < subs.length; i += BATCH_SIZE) {
          const batch = subs.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map((sub) =>
              webpush
                .sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  payload
                )
                .then(() => ({ ok: true, sub }))
                .catch((pushErr) => {
                  if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                    staleIds.push(sub.id);
                  } else {
                    result.errors.push({
                      match: match.match_id,
                      endpoint: sub.endpoint.slice(-20),
                      error: pushErr.message,
                    });
                  }
                  return { ok: false, sub };
                })
            )
          );
        }
        // Clean up stale subscriptions in one batch
        if (staleIds.length > 0) {
          await sb.from("push_subscriptions").delete().in("id", staleIds);
        }

        await sb
          .from("notification_log")
          .insert({ match_id: match.match_id, reminder_type: w.type });

        sentCount += subs.length;
        result.matches.push({ match_id: match.match_id, type: w.type, subscribers: subs.length });
      }

      result.sent[w.type] = sentCount;
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
