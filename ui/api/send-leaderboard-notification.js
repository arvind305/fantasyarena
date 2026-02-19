import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

/**
 * POST /api/send-leaderboard-notification
 *
 * Sends a push notification to all subscribers when the leaderboard is updated.
 * Called after scoring matches.
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
    const { data: subs, error: subErr } = await sb
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (subErr || !subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, message: "No subscribers" });
    }

    const payload = JSON.stringify({
      title: "Leaderboard Updated!",
      body: "Check out the latest leaderboard standings",
      url: "/leaderboard",
    });

    let sent = 0;
    const errors = [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (pushErr) {
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await sb.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          errors.push({ endpoint: sub.endpoint.slice(-20), error: pushErr.message });
        }
      }
    }

    return res.status(200).json({ sent, errors });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
