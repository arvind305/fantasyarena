import { useState, useCallback, useMemo } from "react";

/**
 * State management hook for long-term bet form.
 */
export function useLongTermBets() {
  const [winnerTeam, setWinnerTeam] = useState(null);
  const [finalistTeams, setFinalistTeams] = useState([]);
  const [finalFourTeams, setFinalFourTeams] = useState([]);
  const [orangeCapPlayers, setOrangeCapPlayers] = useState([]);
  const [purpleCapPlayers, setPurpleCapPlayers] = useState([]);

  const initializeFromExisting = useCallback((existing) => {
    if (!existing) return;
    if (existing.winnerTeam) setWinnerTeam(existing.winnerTeam);
    if (existing.finalistTeams) setFinalistTeams(existing.finalistTeams);
    if (existing.finalFourTeams) setFinalFourTeams(existing.finalFourTeams);
    if (existing.orangeCapPlayers) setOrangeCapPlayers(existing.orangeCapPlayers);
    if (existing.purpleCapPlayers) setPurpleCapPlayers(existing.purpleCapPlayers);
  }, []);

  const toggleFinalist = useCallback((teamCode) => {
    setFinalistTeams((prev) => {
      if (prev.includes(teamCode)) return prev.filter((t) => t !== teamCode);
      if (prev.length >= 2) return prev;
      return [...prev, teamCode];
    });
  }, []);

  const toggleFinalFour = useCallback((teamCode) => {
    setFinalFourTeams((prev) => {
      if (prev.includes(teamCode)) return prev.filter((t) => t !== teamCode);
      if (prev.length >= 4) return prev;
      return [...prev, teamCode];
    });
  }, []);

  const toggleOrangeCap = useCallback((playerId) => {
    setOrangeCapPlayers((prev) => {
      if (prev.includes(playerId)) return prev.filter((p) => p !== playerId);
      if (prev.length >= 2) return prev;
      return [...prev, playerId];
    });
  }, []);

  const togglePurpleCap = useCallback((playerId) => {
    setPurpleCapPlayers((prev) => {
      if (prev.includes(playerId)) return prev.filter((p) => p !== playerId);
      if (prev.length >= 2) return prev;
      return [...prev, playerId];
    });
  }, []);

  const predictions = useMemo(() => ({
    winnerTeam,
    finalistTeams,
    finalFourTeams,
    orangeCapPlayers,
    purpleCapPlayers,
  }), [winnerTeam, finalistTeams, finalFourTeams, orangeCapPlayers, purpleCapPlayers]);

  const validate = useCallback(() => {
    const errors = [];
    if (!winnerTeam) errors.push("Please select a tournament winner");
    if (finalistTeams.length !== 2) errors.push("Please select exactly 2 finalists");
    if (finalFourTeams.length !== 4) errors.push("Please select exactly 4 semi-finalists");
    if (orangeCapPlayers.length !== 2) errors.push("Please select exactly 2 Orange Cap picks");
    if (purpleCapPlayers.length !== 2) errors.push("Please select exactly 2 Purple Cap picks");
    return errors;
  }, [winnerTeam, finalistTeams, finalFourTeams, orangeCapPlayers, purpleCapPlayers]);

  const isComplete = useMemo(() => validate().length === 0, [validate]);

  return {
    winnerTeam, setWinnerTeam,
    finalistTeams, toggleFinalist,
    finalFourTeams, toggleFinalFour,
    orangeCapPlayers, toggleOrangeCap,
    purpleCapPlayers, togglePurpleCap,
    predictions, validate, isComplete,
    initializeFromExisting,
  };
}
