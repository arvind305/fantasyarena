import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/auto-lock
 *
 * Locks OPEN matches past their lock_time and opens DRAFT matches
 * within the 3-day betting window.
 *
 * Requires CRON_SECRET bearer token for authentication.
 * Called by external cron (every 5 min) and optionally from client (fire-and-forget).
 */
export default async function handler(req, res) {
  // Verify CRON_SECRET — required for all calls
  const secret = req.headers["authorization"];
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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

    // Find OPEN matches past their lock_time — batch update
    const { data: openPast, error } = await sb
      .from("match_config")
      .select("match_id")
      .eq("status", "OPEN")
      .lt("lock_time", now);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    let lockedCount = 0;
    if (openPast && openPast.length > 0) {
      const matchIds = openPast.map((m) => m.match_id);

      // Batch lock: 1 query per table instead of N+1
      await sb
        .from("match_config")
        .update({ status: "LOCKED", updated_at: now })
        .in("match_id", matchIds);

      await sb
        .from("match_questions")
        .update({ status: "CLOSED" })
        .in("match_id", matchIds);

      await sb
        .from("bets")
        .update({ is_locked: true })
        .in("match_id", matchIds);

      lockedCount = matchIds.length;
    }

    // Open DRAFT matches within the 3-day window — batch update
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

    return res.status(200).json({ locked: lockedCount, opened });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
