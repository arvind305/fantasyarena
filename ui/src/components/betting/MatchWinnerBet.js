import React from "react";

/**
 * Match Winner bet component.
 * Shows Team A / Team B / Super Over radio selection.
 * Displays base points from match_config.
 */
export default function MatchWinnerBet({ config, match, winner, setWinner, disabled }) {
  const teamA = config?.teamA || match?.teamA?.shortName || "Team A";
  const teamB = config?.teamB || match?.teamB?.shortName || "Team B";
  const basePoints = config?.winnerBasePoints || 0;
  const wrongPoints = config?.winnerWrongPoints || 0;
  const superOverMultiplier = config?.superOverMultiplier || 5;

  const options = [
    { value: teamA, label: teamA, description: null },
    { value: teamB, label: teamB, description: null },
    { value: "SUPER_OVER", label: "Super Over", description: `${superOverMultiplier}x points` },
  ];

  return (
    <div className="card animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-100">Match Winner</h3>
            <p className="text-xs text-gray-500">Who will win this match?</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-gray-800/80 border border-gray-700 text-xs font-semibold text-emerald-400">
            +{basePoints} pts
          </span>
          {wrongPoints < 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-gray-800/80 border border-red-900/50 text-xs font-semibold text-red-400">
              {wrongPoints} pts
            </span>
          )}
        </div>
      </div>

      {/* Scoring info */}
      <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
        <p className="text-xs text-gray-400">
          <span className="text-emerald-400 font-medium">Correct:</span> +{basePoints} pts
          {wrongPoints < 0 && (
            <>
              <span className="mx-2 text-gray-600">|</span>
              <span className="text-red-400 font-medium">Wrong:</span> {wrongPoints} pts
            </>
          )}
          <span className="mx-2 text-gray-600">|</span>
          <span className="text-amber-400 font-medium">Super Over correct:</span> +{Math.round(basePoints * superOverMultiplier)} pts ({superOverMultiplier}x)
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex-1 min-w-[100px] px-5 py-4 rounded-xl text-center cursor-pointer border-2 transition-all select-none active:scale-95 ${
              winner === opt.value
                ? "bg-brand-600/30 border-brand-500 text-brand-200 shadow-lg shadow-brand-900/30"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-750"
            } ${disabled ? "pointer-events-none opacity-70" : ""}`}
          >
            <input
              type="radio"
              name="match_winner"
              value={opt.value}
              checked={winner === opt.value}
              onChange={() => setWinner(opt.value)}
              disabled={disabled}
              className="sr-only"
            />
            <span className="font-semibold text-sm">{opt.label}</span>
            {opt.description && (
              <span className="block text-xs mt-1 text-amber-400">{opt.description}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
