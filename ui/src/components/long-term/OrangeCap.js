import React, { useState, useMemo } from "react";

export default function OrangeCap({ allPlayers, selected, onToggle, points, disabled }) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const teams = useMemo(() => {
    const codes = [...new Set(allPlayers.map(p => p.teamCode))].filter(Boolean).sort();
    return codes;
  }, [allPlayers]);

  const filtered = useMemo(() => {
    let players = allPlayers;
    if (teamFilter) players = players.filter(p => p.teamCode === teamFilter);
    if (roleFilter) players = players.filter(p => p.playerRole === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      players = players.filter(p =>
        p.playerName.toLowerCase().includes(q) ||
        p.teamCode?.toLowerCase().includes(q)
      );
    }
    return players.slice(0, 50);
  }, [allPlayers, teamFilter, roleFilter, search]);

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "150ms" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-100">Orange Cap (Top Run Scorer)</h3>
          <p className="text-sm text-gray-400 mt-1">
            Choose up to 3 players
            <span className={`ml-2 font-semibold ${selected.length >= 2 ? "text-orange-400" : "text-gray-500"}`}>
              {selected.length}/3 selected
            </span>
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

      {/* Filters */}
      <div className="flex gap-2 mb-2">
        <select
          value={teamFilter}
          onChange={(e) => { setTeamFilter(e.target.value); setSearch(""); }}
          disabled={disabled}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-orange-600 disabled:opacity-70 appearance-none"
        >
          <option value="">All Teams</option>
          {teams.map(code => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setSearch(""); }}
          disabled={disabled}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-orange-600 disabled:opacity-70 appearance-none"
        >
          <option value="">All Roles</option>
          <option value="BAT">Batter</option>
          <option value="BOWL">Bowler</option>
          <option value="AR">All-rounder</option>
          <option value="WK">Wicketkeeper</option>
        </select>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search players..."
        disabled={disabled}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 mb-2 focus:outline-none focus:border-orange-600 disabled:opacity-70"
      />

      {/* Count */}
      <p className="text-xs text-gray-500 mb-1">{filtered.length} player{filtered.length !== 1 ? "s" : ""}</p>

      {/* Player list */}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.map((player) => {
          const isSelected = selected.includes(player.playerId);
          const atMax = selected.length >= 3 && !isSelected;
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
              <span className="text-xs text-gray-600">{player.teamCode} {player.playerRole ? `(${player.playerRole})` : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
