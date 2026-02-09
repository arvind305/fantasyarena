import { useState, useEffect } from "react";
import { apiGetMatchConfig } from "../api";

/**
 * Hook to fetch match_config, player_slots, and side_bets for a match.
 * Returns { config, slots, sideBets, loading, error, refetch }.
 */
export function useMatchConfig(matchId) {
  const [data, setData] = useState({ config: null, slots: [], sideBets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchConfig() {
    if (!matchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiGetMatchConfig(matchId);
      if (result) {
        setData(result);
      } else {
        setData({ config: null, slots: [], sideBets: [] });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfig();
  }, [matchId]);

  return {
    config: data.config,
    slots: data.slots,
    sideBets: data.sideBets,
    loading,
    error,
    refetch: fetchConfig,
  };
}
