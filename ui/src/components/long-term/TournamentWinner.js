import React from "react";

export default function TournamentWinner({ squads, selected, onSelect, points, disabled }) {
  return (
    <div className="card animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-100">Tournament Winner</h3>
          <p className="text-xs text-gray-500">Pick 1 team to win the tournament</p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-gray-800/80 border border-gray-700 text-xs font-semibold text-emerald-400">
          +{points} pts
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {squads.map((team) => {
          const isSelected = selected === team.teamCode;
          const isDimmed = selected && !isSelected;
          return (
            <label
              key={team.teamCode}
              className={`px-4 py-2.5 rounded-lg text-sm cursor-pointer border-2 transition-all select-none active:scale-95 ${
                isSelected
                  ? "bg-purple-600/30 border-purple-500 text-purple-200 shadow-lg shadow-purple-900/30"
                  : isDimmed
                  ? "bg-gray-800/50 border-gray-800 text-gray-600"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
              } ${disabled ? "pointer-events-none opacity-70" : ""}`}
            >
              <input type="radio" name="tournament_winner" value={team.teamCode} checked={isSelected} onChange={() => onSelect(team.teamCode)} disabled={disabled} className="sr-only" />
              {team.teamCode}
            </label>
          );
        })}
      </div>
    </div>
  );
}
