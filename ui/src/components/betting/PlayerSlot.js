import React, { useState, useEffect } from "react";
import PlayerDropdown from "./PlayerDropdown";

/**
 * Single player pick slot: team dropdown (Team A/B) -> player dropdown.
 * Shows multiplier from player_slots table.
 * Uses fetchSquad prop (shared cache) to avoid N+1 queries.
 */
export default function PlayerSlot({
  slot,
  config,
  match,
  currentPick,
  onPickPlayer,
  disabled,
  selectedPlayerIds,
  fetchSquad,
}) {
  const [selectedTeam, setSelectedTeam] = useState(currentPick?.team || "");
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const teamA = config?.teamA || match?.teamA?.shortName || "Team A";
  const teamB = config?.teamB || match?.teamB?.shortName || "Team B";

  // Fetch players when team changes (uses shared cache from parent)
  useEffect(() => {
    if (!selectedTeam) {
      setPlayers([]);
      return;
    }
    setLoadingPlayers(true);
    fetchSquad(selectedTeam)
      .then((p) => setPlayers(p))
      .catch(() => setPlayers([]))
      .finally(() => setLoadingPlayers(false));
  }, [selectedTeam, fetchSquad]);

  // Restore team from existing pick
  useEffect(() => {
    if (currentPick?.team && currentPick.team !== selectedTeam) {
      setSelectedTeam(currentPick.team);
    }
  }, [currentPick?.team]);

  function handleTeamChange(team) {
    setSelectedTeam(team);
    // Clear player selection when team changes
    onPickPlayer(slot.slotNumber, null, team, null);
  }

  function handlePlayerSelect(playerId, playerName) {
    onPickPlayer(slot.slotNumber, playerId, selectedTeam, playerName);
  }

  // Multiplier color based on value
  const multiplierColor =
    slot.multiplier >= 12 ? "from-amber-500 to-orange-500" :
    slot.multiplier >= 7 ? "from-blue-500 to-cyan-500" :
    "from-green-500 to-emerald-500";

  return (
    <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">
            Slot {slot.slotNumber}
          </span>
          {currentPick?.player_name && (
            <span className="text-xs text-brand-400">{currentPick.player_name}</span>
          )}
        </div>
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${multiplierColor} shadow-sm`}
          title={`${slot.multiplier}x multiplier`}
        >
          {slot.multiplier}x
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Team selector */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Team</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTeamChange(teamA)}
              disabled={disabled}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                selectedTeam === teamA
                  ? "bg-brand-600/30 border-brand-500 text-brand-200"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
              } ${disabled ? "pointer-events-none opacity-70" : ""}`}
            >
              {teamA}
            </button>
            <button
              type="button"
              onClick={() => handleTeamChange(teamB)}
              disabled={disabled}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                selectedTeam === teamB
                  ? "bg-brand-600/30 border-brand-500 text-brand-200"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
              } ${disabled ? "pointer-events-none opacity-70" : ""}`}
            >
              {teamB}
            </button>
          </div>
        </div>

        {/* Player selector */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Player</label>
          {loadingPlayers ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-500">
              Loading players...
            </div>
          ) : selectedTeam ? (
            <PlayerDropdown
              players={players}
              selectedPlayerId={currentPick?.player_id || null}
              onSelect={handlePlayerSelect}
              disabled={disabled}
              disabledPlayerIds={selectedPlayerIds}
              placeholder="Pick a player..."
            />
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-500">
              Select a team first
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
