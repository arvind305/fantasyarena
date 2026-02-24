import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/health
 *
 * Returns system health status including DB connectivity and latency.
 * No authentication required — used by uptime monitors (e.g. UptimeRobot).
 */
export default async function handler(req, res) {
  const start = Date.now();
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(503).json({
      status: "unhealthy",
      db: "misconfigured",
      error: "Missing Supabase env vars",
      timestamp: new Date().toISOString(),
    });
  }

  const sb = createClient(url, key);

  try {
    const { count, error } = await sb
      .from("match_config")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    return res.status(200).json({
      status: "healthy",
      db: "connected",
      latency_ms: Date.now() - start,
      match_count: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      status: "unhealthy",
      db: "disconnected",
      error: err.message,
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  }
}
