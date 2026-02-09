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
        // Find winner answer from answers
        const winnerKey = Object.keys(existingBet.answers).find(k => k.includes('winner'));
        if (winnerKey) setWinner(existingBet.answers[winnerKey]);

        // Find total runs answer
        const runsKey = Object.keys(existingBet.answers).find(k => k.includes('total_runs'));
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

    // Store winner in answers using a standard key
    if (winner) {
      answers[`${matchId}_winner`] = winner;
    }
    if (totalRuns) {
      answers[`${matchId}_total_runs`] = totalRuns;
    }

    return {
      answers,
      playerPicks,
      sideBetAnswers,
      runnerPicks,
    };
  }, [config, winner, totalRuns, playerPicks, sideBetAnswers, runnerPicks]);

  // Validation
  const validate = useCallback(() => {
    const errors = [];

    if (!winner) {
      errors.push("Please predict the match winner");
    }
    if (!totalRuns || totalRuns.trim() === "") {
      errors.push("Please predict the total runs");
    } else if (!/^\d+$/.test(totalRuns.trim())) {
      errors.push("Total runs must be a valid number");
    }

    // Validate player picks if enabled
    if (config?.playerSlotsEnabled && slots && slots.length > 0) {
      const enabledSlots = slots.filter(s => s.isEnabled);
      const filledSlots = playerPicks.filter(p => p.player_id);

      if (filledSlots.length < enabledSlots.length) {
        errors.push(`Please fill all ${enabledSlots.length} player pick slot(s)`);
      }

      // Check for duplicate players
      const playerIds = filledSlots.map(p => p.player_id);
      const unique = new Set(playerIds);
      if (unique.size < playerIds.length) {
        errors.push("Cannot pick the same player in multiple slots");
      }
    }

    // Validate side bets (all required)
    if (sideBets && sideBets.length > 0) {
      const openSideBets = sideBets.filter(sb => sb.status === "OPEN");
      for (const sb of openSideBets) {
        if (!sideBetAnswers[sb.sideBetId]) {
          errors.push(`Please answer side bet: ${sb.questionText}`);
        }
      }
    }

    return errors;
  }, [winner, totalRuns, config, slots, playerPicks, sideBets, sideBetAnswers]);

  // Check if form is complete (no validation errors)
  const isComplete = useMemo(() => validate().length === 0, [validate]);

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
    isComplete,
    selectedPlayerIds,

    // Initialization
    initializeFromConfig,
  };
}
