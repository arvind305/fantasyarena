import { createClient } from "@supabase/supabase-js";

/**
 * Vercel Cron: /api/cron/update-matches
 * Runs daily to sync match_config status column:
 *   - DRAFT matches within today + 2 days -> OPEN
 *   - OPEN matches past lock_time -> LOCKED
 *   - OPEN matches beyond the window -> DRAFT
 *   - SCORED matches are never touched
 *
 * Uses batch queries (1 per status group) instead of per-match updates.
 *
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
 */
export default async function handler(req, res) {
  const secret = req.headers["authorization"];
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res
      .status(500)
      .json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
  }

  const sb = createClient(url, key);

  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const endWindow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data: configs, error } = await sb
      .from("match_config")
      .select("match_id, lock_time, status")
      .neq("status", "SCORED")
      .order("lock_time");

    if (error) {
      return res
        .status(500)
        .json({ error: "DB fetch failed", details: error.message });
    }

    // Categorize matches into batches
    const toLock = [];
    const toOpen = [];
    const toDraft = [];

    for (const m of configs) {
      const lockDate = new Date(m.lock_time);

      if (lockDate < now) {
        // Past lock_time -> should be LOCKED
        if (m.status !== "LOCKED") toLock.push(m.match_id);
      } else if (lockDate <= endWindow) {
        // Within 3-day window -> should be OPEN
        if (m.status !== "OPEN") toOpen.push(m.match_id);
      } else {
        // Beyond window -> should be DRAFT
        if (m.status !== "DRAFT") toDraft.push(m.match_id);
      }
    }

    // Batch update: 1 query per status group per table
    if (toLock.length > 0) {
      await sb
        .from("match_config")
        .update({ status: "LOCKED", updated_at: nowIso })
        .in("match_id", toLock);
      await sb
        .from("match_questions")
        .update({ status: "CLOSED" })
        .in("match_id", toLock);
      await sb
        .from("bets")
        .update({ is_locked: true })
        .in("match_id", toLock);
    }

    if (toOpen.length > 0) {
      await sb
        .from("match_config")
        .update({ status: "OPEN", updated_at: nowIso })
        .in("match_id", toOpen);
      await sb
        .from("match_questions")
        .update({ status: "OPEN" })
        .in("match_id", toOpen);
    }

    if (toDraft.length > 0) {
      await sb
        .from("match_config")
        .update({ status: "DRAFT", updated_at: nowIso })
        .in("match_id", toDraft);
      await sb
        .from("match_questions")
        .update({ status: "DRAFT" })
        .in("match_id", toDraft);
    }

    return res.status(200).json({
      ok: true,
      timestamp: now.toISOString(),
      locked: toLock.length,
      opened: toOpen.length,
      drafted: toDraft.length,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Unexpected error", details: err.message });
  }
}
