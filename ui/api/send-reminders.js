import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

/**
 * POST /api/send-reminders
 *
 * Called by external cron (cron-job.org every 10 min).
 * Sends web push notifications for matches about to lock.
 *
 * Time windows:
 *   - 30-min reminder: lock_time BETWEEN now+25min AND now+35min
 *   - 10-min reminder: lock_time BETWEEN now+5min AND now+15min
 *
 * Requires: CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify cron secret
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

  // Configure web-push
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const sb = createClient(url, key);

  try {
    const now = Date.now();

    // Define time windows
    const windows = [
      { type: "30min", label: "30 minutes", minMs: 25 * 60 * 1000, maxMs: 35 * 60 * 1000 },
      { type: "10min", label: "10 minutes", minMs: 5 * 60 * 1000, maxMs: 15 * 60 * 1000 },
    ];

    const result = { sent: {}, matches: [], errors: [] };

    for (const w of windows) {
      const rangeStart = new Date(now + w.minMs).toISOString();
      const rangeEnd = new Date(now + w.maxMs).toISOString();

      // Find OPEN matches in this window
      const { data: matches, error: matchErr } = await sb
        .from("match_config")
        .select("match_id, team_a, team_b, lock_time")
        .eq("status", "OPEN")
        .gte("lock_time", rangeStart)
        .lte("lock_time", rangeEnd);

      if (matchErr) {
        result.errors.push({ window: w.type, error: matchErr.message });
        continue;
      }

      if (!matches || matches.length === 0) {
        result.sent[w.type] = 0;
        continue;
      }

      let sentCount = 0;

      for (const match of matches) {
        // Check if we already sent this reminder
        const { data: existing } = await sb
          .from("notification_log")
          .select("id")
          .eq("match_id", match.match_id)
          .eq("reminder_type", w.type)
          .maybeSingle();

        if (existing) {
          continue; // Already sent
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

        // Send to all subscribers
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload
            );
          } catch (pushErr) {
            // 410 Gone — subscription expired, remove it
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              await sb.from("push_subscriptions").delete().eq("id", sub.id);
            } else {
              result.errors.push({
                match: match.match_id,
                endpoint: sub.endpoint.slice(-20),
                error: pushErr.message,
              });
            }
          }
        }

        // Log that we sent this reminder
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
