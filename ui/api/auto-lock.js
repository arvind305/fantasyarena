import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/auto-lock
 *
 * Lightweight endpoint called on page load to lock any OPEN matches
 * past their lock_time. This supplements the daily cron to ensure
 * matches get locked promptly without manual intervention.
 *
 * No auth required — it only LOCKS matches (moves OPEN → LOCKED),
 * which is a safe, idempotent operation.
 */
export default async function handler(req, res) {
  // Allow CORS for client-side calls
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  const sb = createClient(url, key);

  try {
    const now = new Date().toISOString();

    // Find OPEN matches past their lock_time
    const { data: openPast, error } = await sb
      .from("match_config")
      .select("match_id")
      .eq("status", "OPEN")
      .lt("lock_time", now);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!openPast || openPast.length === 0) {
      return res.status(200).json({ locked: 0 });
    }

    const matchIds = openPast.map((m) => m.match_id);

    // Lock match_config
    await sb
      .from("match_config")
      .update({ status: "LOCKED", updated_at: now })
      .in("match_id", matchIds);

    // Close match_questions
    await sb
      .from("match_questions")
      .update({ status: "CLOSED" })
      .in("match_id", matchIds);

    // Lock all bets for these matches
    await sb
      .from("bets")
      .update({ is_locked: true })
      .in("match_id", matchIds);

    // Also open DRAFT matches within the 3-day window
    const endWindow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: draftInWindow } = await sb
      .from("match_config")
      .select("match_id")
      .eq("status", "DRAFT")
      .gt("lock_time", now)
      .lt("lock_time", endWindow);

    let opened = 0;
    if (draftInWindow && draftInWindow.length > 0) {
      const draftIds = draftInWindow.map((m) => m.match_id);
      await sb
        .from("match_config")
        .update({ status: "OPEN", updated_at: now })
        .in("match_id", draftIds);
      await sb
        .from("match_questions")
        .update({ status: "OPEN" })
        .in("match_id", draftIds);
      opened = draftIds.length;
    }

    return res.status(200).json({ locked: matchIds.length, opened, matchIds });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
