import { useState, useCallback } from "react";
import { authenticatedPost } from "../lib/apiClient";
import { CURRENT_TOURNAMENT } from "../config/tournament";

/**
 * Admin state management hook.
 * All operations route through the server-side API gateway.
 */
export function useAdmin() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const adminOp = useCallback(async (action, body) => {
    setSaving(true);
    setError(null);
    try {
      const result = await authenticatedPost('/api/admin/operations', { action, ...body });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveMatchConfig = useCallback((matchId, configData) =>
    adminOp('saveConfig', { matchId, configData }), [adminOp]);

  const savePlayerSlots = useCallback((matchId, slots) =>
    adminOp('saveSlots', { matchId, slots }), [adminOp]);

  const saveSideBets = useCallback((matchId, sideBets) =>
    adminOp('saveSideBets', { matchId, sideBets }), [adminOp]);

  const savePlayerStats = useCallback((matchId, statsMap) =>
    adminOp('savePlayerStats', { matchId, statsMap }), [adminOp]);

  const calculatePlayerPoints = useCallback((matchId) =>
    adminOp('calculatePlayerPoints', { matchId }), [adminOp]);

  const saveLongTermConfig = useCallback((configData) =>
    adminOp('saveLongTermConfig', { configData }), [adminOp]);

  const setMatchCorrectAnswers = useCallback((matchId, results) =>
    adminOp('setMatchResults', { matchId, results }), [adminOp]);

  const triggerScoring = useCallback((matchId, eventId = CURRENT_TOURNAMENT.id) =>
    adminOp('triggerScoring', { matchId, eventId }), [adminOp]);

  const triggerLongTermScoring = useCallback((eventId = CURRENT_TOURNAMENT.id) =>
    adminOp('triggerLongTermScoring', { eventId }), [adminOp]);

  return {
    saving,
    error,
    saveMatchConfig,
    savePlayerSlots,
    saveSideBets,
    savePlayerStats,
    calculatePlayerPoints,
    saveLongTermConfig,
    setMatchCorrectAnswers,
    triggerScoring,
    triggerLongTermScoring,
  };
}
