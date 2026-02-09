import React from "react";

/**
 * Total Runs bet component.
 * Numeric input with +/- buttons and scoring tier display.
 * Base points come from match_config.total_runs_base_points.
 */
export default function TotalRunsBet({ config, totalRuns, setTotalRuns, disabled }) {
  const basePoints = config?.totalRunsBasePoints || 0;

  const scoringTiers = [
    { label: "Exact", multiplier: 5, color: "text-emerald-400", points: basePoints * 5 },
    { label: "Off by 1", multiplier: 1, color: "text-blue-400", points: basePoints },
    { label: "Off by 2-5", multiplier: 0.5, color: "text-cyan-400", points: Math.round(basePoints * 0.5) },
    { label: "Off by 6-10", multiplier: 0.25, color: "text-amber-400", points: Math.round(basePoints * 0.25) },
    { label: "Off by 11-15", multiplier: 0.1, color: "text-orange-400", points: Math.round(basePoints * 0.1) },
    { label: "Off by 16+", multiplier: 0, color: "text-red-400", points: 0 },
  ];

  function handleChange(value) {
    const cleaned = value.replace(/[^\d]/g, "");
    setTotalRuns(cleaned);
  }

  function handleIncrement(amount) {
    const current = parseInt(totalRuns) || 300;
    const next = Math.max(0, current + amount);
    setTotalRuns(String(next));
  }

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "40ms" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-100">Total Runs</h3>
            <p className="text-xs text-gray-500">Predict combined runs scored by both teams</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-gray-800/80 border border-gray-700 text-xs font-semibold text-emerald-400">
          up to +{basePoints * 5} pts
        </span>
      </div>

      {/* Input with +/- buttons */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleIncrement(-5)}
          disabled={disabled}
          className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-xl font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={totalRuns}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g., 320"
          className={`flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-2xl text-center font-mono text-gray-200
            ${disabled ? "opacity-70 cursor-not-allowed" : "focus:border-brand-600 focus:outline-none"}`}
        />
        <button
          type="button"
          onClick={() => handleIncrement(5)}
          disabled={disabled}
          className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-xl font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      {/* Scoring tiers */}
      <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
        <p className="text-xs text-gray-500 mb-2 font-medium">Scoring tiers (base: {basePoints} pts)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {scoringTiers.map((tier) => (
            <div key={tier.label} className="flex items-center justify-between px-2 py-1 rounded bg-gray-800/50">
              <span className="text-xs text-gray-400">{tier.label}</span>
              <span className={`text-xs font-semibold ${tier.color}`}>
                {tier.points > 0 ? `+${tier.points}` : "0"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
