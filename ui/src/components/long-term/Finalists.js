import React from "react";

export default function Finalists({ squads, selected, onToggle, points, disabled }) {
  return (
    <div className="card animate-slide-up" style={{ animationDelay: "50ms" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-100">Finalists</h3>
          <p className="text-xs text-gray-500">
            Pick 2 teams to reach the final
            {selected.length > 0 && <span className="text-purple-400 ml-2">{selected.length}/2</span>}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-gray-800/80 border border-gray-700 text-xs font-semibold text-emerald-400">
          +{points} pts each
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {squads.map((team) => {
          const isSelected = selected.includes(team.teamCode);
          const atMax = selected.length >= 2 && !isSelected;
          return (
            <label
              key={team.teamCode}
              className={`px-4 py-2.5 rounded-lg text-sm cursor-pointer border-2 transition-all select-none ${
                isSelected
                  ? "bg-purple-600/30 border-purple-500 text-purple-200"
                  : atMax
                  ? "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
              } ${disabled ? "pointer-events-none opacity-70" : ""}`}
            >
              <input type="checkbox" checked={isSelected} onChange={() => onToggle(team.teamCode)} disabled={disabled || atMax} className="sr-only" />
              {team.teamCode}
            </label>
          );
        })}
      </div>
    </div>
  );
}
