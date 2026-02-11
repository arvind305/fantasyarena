import { createClient } from "@supabase/supabase-js";

/**
 * Vercel Cron: /api/cron/update-matches
 * Runs hourly to sync match_config status column:
 *   - DRAFT matches within today + 2 days → OPEN
 *   - OPEN matches past lock_time → LOCKED
 *   - OPEN matches beyond the window → DRAFT
 *   - SCORED matches are never touched
 *
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
 */
export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized invocation
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
    const endWindow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data: configs, error } = await sb
      .from("match_config")
      .select("match_id, team_a, team_b, lock_time, status")
      .order("lock_time");

    if (error) {
      return res
        .status(500)
        .json({ error: "DB fetch failed", details: error.message });
    }

    let opened = 0,
      locked = 0,
      drafted = 0;

    for (const m of configs) {
      if (m.status === "SCORED") continue;

      const lockDate = new Date(m.lock_time);

      if (lockDate < now) {
        if (m.status !== "LOCKED") {
          await sb
            .from("match_config")
            .update({ status: "LOCKED" })
            .eq("match_id", m.match_id);
          await sb
            .from("match_questions")
            .update({ status: "CLOSED" })
            .eq("match_id", m.match_id);
          // Also lock all bets for this match
          await sb
            .from("bets")
            .update({ is_locked: true })
            .eq("match_id", m.match_id);
          locked++;
        }
      } else if (lockDate <= endWindow) {
        if (m.status !== "OPEN") {
          await sb
            .from("match_config")
            .update({ status: "OPEN" })
            .eq("match_id", m.match_id);
          await sb
            .from("match_questions")
            .update({ status: "OPEN" })
            .eq("match_id", m.match_id);
          opened++;
        }
      } else {
        if (m.status !== "DRAFT") {
          await sb
            .from("match_config")
            .update({ status: "DRAFT" })
            .eq("match_id", m.match_id);
          await sb
            .from("match_questions")
            .update({ status: "DRAFT" })
            .eq("match_id", m.match_id);
          drafted++;
        }
      }
    }

    return res.status(200).json({
      ok: true,
      timestamp: now.toISOString(),
      opened,
      locked,
      drafted,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Unexpected error", details: err.message });
  }
}
