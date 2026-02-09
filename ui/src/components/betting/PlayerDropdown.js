import React, { useState, useRef, useEffect } from "react";

/**
 * Filterable player selector from the players table for the selected team.
 * Shows player name, role badge, and captain indicator.
 */
export default function PlayerDropdown({
  players,
  selectedPlayerId,
  onSelect,
  disabled,
  disabledPlayerIds,
  placeholder,
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = players.filter((p) => {
    if (!search) return true;
    return p.playerName.toLowerCase().includes(search.toLowerCase());
  });

  const selectedPlayer = players.find((p) => p.playerId === selectedPlayerId);

  const roleBadge = (role) => {
    const colors = {
      BAT: "bg-blue-900/50 text-blue-300 border-blue-800",
      BOWL: "bg-green-900/50 text-green-300 border-green-800",
      ALL: "bg-purple-900/50 text-purple-300 border-purple-800",
      WK: "bg-amber-900/50 text-amber-300 border-amber-800",
    };
    return colors[role] || "bg-gray-800 text-gray-400 border-gray-700";
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Selected display / trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between transition-colors
          ${disabled ? "opacity-70 cursor-not-allowed" : "hover:border-gray-600 focus:border-brand-600 focus:outline-none"}
          ${isOpen ? "border-brand-600 ring-1 ring-brand-600/50" : ""}`}
      >
        {selectedPlayer ? (
          <span className="flex items-center gap-2">
            <span className="text-gray-200">{selectedPlayer.playerName}</span>
            {selectedPlayer.isCaptain && (
              <span className="text-xs text-amber-400 font-bold">(C)</span>
            )}
            {selectedPlayer.playerRole && (
              <span className={`px-1.5 py-0.5 rounded text-xs border ${roleBadge(selectedPlayer.playerRole)}`}>
                {selectedPlayer.playerRole}
              </span>
            )}
          </span>
        ) : (
          <span className="text-gray-500">{placeholder || "Select a player..."}</span>
        )}
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players..."
              autoFocus
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-600"
            />
          </div>

          {/* Player list */}
          <div className="overflow-y-auto max-h-48">
            {/* Clear option */}
            {selectedPlayerId && (
              <button
                type="button"
                onClick={() => {
                  onSelect(null, null);
                  setIsOpen(false);
                  setSearch("");
                }}
                className="w-full px-3 py-2 text-sm text-left text-red-400 hover:bg-gray-700 transition-colors border-b border-gray-700/50"
              >
                Clear selection
              </button>
            )}

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-500">No players found</div>
            )}

            {filtered.map((player) => {
              const isDisabled = disabledPlayerIds?.has(player.playerId) && player.playerId !== selectedPlayerId;
              return (
                <button
                  key={player.playerId}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      onSelect(player.playerId, player.playerName);
                      setIsOpen(false);
                      setSearch("");
                    }
                  }}
                  disabled={isDisabled}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors
                    ${player.playerId === selectedPlayerId
                      ? "bg-brand-600/20 text-brand-200"
                      : isDisabled
                      ? "opacity-40 cursor-not-allowed text-gray-500"
                      : "text-gray-300 hover:bg-gray-700"
                    }`}
                >
                  <span className="flex-1">{player.playerName}</span>
                  {player.isCaptain && (
                    <span className="text-xs text-amber-400 font-bold">(C)</span>
                  )}
                  {player.playerRole && (
                    <span className={`px-1.5 py-0.5 rounded text-xs border ${roleBadge(player.playerRole)}`}>
                      {player.playerRole}
                    </span>
                  )}
                  {isDisabled && (
                    <span className="text-xs text-gray-600">picked</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
