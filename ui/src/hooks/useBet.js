import { useState, useCallback, useMemo } from "react";

/**
 * Central state management hook for the bet form.
 * Manages winner, totalRuns, playerPicks, sideBetAnswers, runnerPicks.
 */
export function useBet(config, slots, sideBets) {
  const [winner, setWinner] = useState(null); // team code string or "SUPER_OVER"
  const [totalRuns, setTotalRuns] = useState("");
  const [playerPicks, setPlayerPicks] = useState([]); // [{slot, player_id, team, player_name}]
  const [sideBetAnswers, setSideBetAnswers] = useState({}); // {sideBetId: answer}
  const [runnerPicks, setRunnerPicks] = useState([]); // [{user_id, display_name}]

  // Initialize player picks slots when config changes
  const initializeFromConfig = useCallback((cfg, existingBet) => {
    if (!cfg) return;

    if (existingBet) {
      // Restore from existing bet
      if (existingBet.answers) {
        const matchId = cfg.matchId;
        // Support both V1 (q_ prefix + option IDs) and V2 (no prefix + team codes) keys
        const winnerKey = Object.keys(existingBet.answers).find(k =>
          k === `q_${matchId}_winner` || k === `${matchId}_winner`
        );
        if (winnerKey) {
          let val = existingBet.answers[winnerKey];
          // Convert V1 option IDs back to team codes for UI display
          if (val === `opt_${matchId}_winner_teamA`) val = cfg.teamA;
          else if (val === `opt_${matchId}_winner_teamB`) val = cfg.teamB;
          else if (val === `opt_${matchId}_winner_super_over`) val = "SUPER_OVER";
          setWinner(val);
        }

        const runsKey = Object.keys(existingBet.answers).find(k =>
          k === `q_${matchId}_total_runs` || k === `${matchId}_total_runs`
        );
        if (runsKey) setTotalRuns(existingBet.answers[runsKey] || "");
      }

      if (existingBet.player_picks && existingBet.player_picks.length > 0) {
        setPlayerPicks(existingBet.player_picks);
      }
      if (existingBet.side_bet_answers && Object.keys(existingBet.side_bet_answers).length > 0) {
        setSideBetAnswers(existingBet.side_bet_answers);
      }
      if (existingBet.runner_picks && existingBet.runner_picks.length > 0) {
        setRunnerPicks(existingBet.runner_picks);
      }
    }
  }, []);

  // Set a player pick for a specific slot
  const setPlayerPick = useCallback((slotNumber, playerId, team, playerName) => {
    setPlayerPicks(prev => {
      const filtered = prev.filter(p => p.slot !== slotNumber);
      if (playerId) {
        return [...filtered, { slot: slotNumber, player_id: playerId, team, player_name: playerName }];
      }
      return filtered;
    });
  }, []);

  // Set a side bet answer
  const setSideBetAnswer = useCallback((sideBetId, answer) => {
    setSideBetAnswers(prev => ({ ...prev, [sideBetId]: answer }));
  }, []);

  // Add a runner pick
  const addRunnerPick = useCallback((userId, displayName) => {
    setRunnerPicks(prev => {
      if (prev.some(r => r.user_id === userId)) return prev;
      return [...prev, { user_id: userId, display_name: displayName }];
    });
  }, []);

  // Remove a runner pick
  const removeRunnerPick = useCallback((userId) => {
    setRunnerPicks(prev => prev.filter(r => r.user_id !== userId));
  }, []);

  // Build the bet data object for submission
  const betData = useMemo(() => {
    const matchId = config?.matchId || "";
    const answers = {};

    // Store winner in V1 format (q_ prefix + option IDs) for scoring RPC compatibility
    if (winner) {
      let winnerValue;
      if (winner === config?.teamA) {
        winnerValue = `opt_${matchId}_winner_teamA`;
      } else if (winner === config?.teamB) {
        winnerValue = `opt_${matchId}_winner_teamB`;
      } else if (winner === "SUPER_OVER") {
        winnerValue = `opt_${matchId}_winner_super_over`;
      } else {
        winnerValue = winner;
      }
      answers[`q_${matchId}_winner`] = winnerValue;
    }
    if (totalRuns) {
      answers[`q_${matchId}_total_runs`] = totalRuns;
    }

    return {
      answers,
      playerPicks,
      sideBetAnswers,
      runnerPicks,
    };
  }, [config, winner, totalRuns, playerPicks, sideBetAnswers, runnerPicks]);

  // Validation — only checks data integrity, not completeness (partial bets are allowed)
  const validate = useCallback(() => {
    const errors = [];

    if (totalRuns && totalRuns.trim() !== "" && !/^\d+$/.test(totalRuns.trim())) {
      errors.push("Total runs must be a valid number");
    }

    // Check for duplicate players (data integrity)
    if (config?.playerSlotsEnabled && slots && slots.length > 0) {
      const filledSlots = playerPicks.filter(p => p.player_id);
      const playerIds = filledSlots.map(p => p.player_id);
      const unique = new Set(playerIds);
      if (unique.size < playerIds.length) {
        errors.push("Cannot pick the same player in multiple slots");
      }
    }

    return errors;
  }, [totalRuns, config, slots, playerPicks]);

  // Get all selected player IDs (for duplicate prevention)
  const selectedPlayerIds = useMemo(() =>
    new Set(playerPicks.filter(p => p.player_id).map(p => p.player_id)),
    [playerPicks]
  );

  return {
    // State
    winner,
    totalRuns,
    playerPicks,
    sideBetAnswers,
    runnerPicks,

    // Setters
    setWinner,
    setTotalRuns,
    setPlayerPick,
    setSideBetAnswer,
    addRunnerPick,
    removeRunnerPick,

    // Computed
    betData,
    validate,
    selectedPlayerIds,

    // Initialization
    initializeFromConfig,
  };
}
