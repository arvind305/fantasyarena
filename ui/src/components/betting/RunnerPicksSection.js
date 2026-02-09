import React, { useMemo } from "react";
import RunnerPicker from "./RunnerPicker";

/**
 * Runner picks section. Only shown if match_config.runners_enabled.
 * Select other users whose match score gets added to yours.
 */
export default function RunnerPicksSection({
  config,
  runnerPicks,
  addRunnerPick,
  removeRunnerPick,
  disabled,
  currentUserId,
}) {
  if (!config?.runnersEnabled) return null;

  const maxRunners = config.runnerCount || 0;
  if (maxRunners <= 0) return null;

  // Exclude current user and already-picked users
  const excludeUserIds = useMemo(() => {
    const ids = new Set(runnerPicks.map(r => r.user_id));
    if (currentUserId) ids.add(currentUserId);
    return ids;
  }, [runnerPicks, currentUserId]);

  const canAddMore = runnerPicks.length < maxRunners;

  return (
    <div className="animate-slide-up" style={{ animationDelay: "160ms" }}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-emerald-800/50">
        <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-100">Runners</h2>
          <p className="text-xs text-gray-500">
            Pick up to {maxRunners} runner{maxRunners > 1 ? "s" : ""} - their match score gets added to yours
          </p>
        </div>
        <span className="ml-auto px-2.5 py-1 rounded-full text-xs bg-emerald-900/50 text-emerald-300 border border-emerald-800">
          {runnerPicks.length}/{maxRunners}
        </span>
      </div>

      {/* Info box */}
      <div className="card mb-4 p-3 bg-gray-800/50 border-gray-700/50">
        <p className="text-xs text-gray-400">
          If your runner doesn't bet on this match, they contribute 0 points.
          Choose players who are likely to bet and score well!
        </p>
      </div>

      {/* Selected runners */}
      {runnerPicks.length > 0 && (
        <div className="space-y-2 mb-4">
          {runnerPicks.map((runner) => (
            <div
              key={runner.user_id}
              className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
                  {(runner.display_name || "?").charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-200">{runner.display_name}</span>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeRunnerPick(runner.user_id)}
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add runner */}
      {canAddMore && !disabled && (
        <RunnerPicker
          onSelect={addRunnerPick}
          disabled={disabled}
          excludeUserIds={excludeUserIds}
        />
      )}

      {!canAddMore && runnerPicks.length > 0 && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Maximum {maxRunners} runner{maxRunners > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
