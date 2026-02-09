import React, { useState, useMemo } from "react";

export default function OrangeCap({ allPlayers, selected, onToggle, points, disabled }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return allPlayers.slice(0, 50);
    return allPlayers.filter(p =>
      p.playerName.toLowerCase().includes(search.toLowerCase()) ||
      p.teamCode?.toLowerCase().includes(search.toLowerCase())
    );
  }, [allPlayers, search]);

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "150ms" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-100">Orange Cap (Top Run Scorer)</h3>
          <p className="text-xs text-gray-500">
            Pick 2 players
            {selected.length > 0 && <span className="text-orange-400 ml-2">{selected.length}/2</span>}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-gray-800/80 border border-gray-700 text-xs font-semibold text-orange-400">
          +{points} pts each
        </span>
      </div>

      {/* Selected */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((playerId) => {
            const player = allPlayers.find(p => p.playerId === playerId);
            return (
              <span key={playerId} className="px-3 py-1.5 rounded-lg bg-orange-600/20 border border-orange-700 text-orange-300 text-sm flex items-center gap-1.5">
                {player?.playerName || playerId}
                <span className="text-xs text-orange-500">({player?.teamCode})</span>
                {!disabled && (
                  <button onClick={() => onToggle(playerId)} className="ml-1 text-orange-400 hover:text-orange-200">&times;</button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search players..."
        disabled={disabled}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 mb-3 focus:outline-none focus:border-brand-600 disabled:opacity-70"
      />

      {/* Player list */}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.map((player) => {
          const isSelected = selected.includes(player.playerId);
          const atMax = selected.length >= 2 && !isSelected;
          return (
            <button
              key={player.playerId}
              type="button"
              onClick={() => !atMax && !disabled && onToggle(player.playerId)}
              disabled={atMax || disabled}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                isSelected
                  ? "bg-orange-600/20 text-orange-200"
                  : atMax
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <span>{player.playerName}</span>
              <span className="text-xs text-gray-600">{player.teamCode}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
