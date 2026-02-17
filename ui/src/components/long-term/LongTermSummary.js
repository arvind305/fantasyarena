import React from "react";
import Spinner from "../Spinner";

export default function LongTermSummary({
  predictions,
  config,
  squads,
  allPlayers,
  isComplete,
  onSubmit,
  submitting,
  disabled,
  existing,
  isEdit,
  editCost,
}) {
  const items = [
    {
      label: "Tournament Winner",
      done: !!predictions.winnerTeam,
      value: predictions.winnerTeam,
      points: config?.winnerPoints,
    },
    {
      label: "Finalists",
      done: predictions.finalistTeams.length === 2,
      value: predictions.finalistTeams.join(", "),
      points: config?.finalistPoints,
      count: `${predictions.finalistTeams.length}/2`,
    },
    {
      label: "Semi-Finalists",
      done: predictions.finalFourTeams.length === 4,
      value: predictions.finalFourTeams.join(", "),
      points: config?.finalFourPoints,
      count: `${predictions.finalFourTeams.length}/4`,
    },
    {
      label: "Orange Cap",
      done: predictions.orangeCapPlayers.length >= 2,
      value: predictions.orangeCapPlayers
        .map((id) => allPlayers.find((p) => p.playerId === id)?.playerName || id)
        .join(", "),
      points: config?.orangeCapPoints,
      count: `${predictions.orangeCapPlayers.length}/3`,
    },
    {
      label: "Purple Cap",
      done: predictions.purpleCapPlayers.length >= 2,
      value: predictions.purpleCapPlayers
        .map((id) => allPlayers.find((p) => p.playerId === id)?.playerName || id)
        .join(", "),
      points: config?.purpleCapPoints,
      count: `${predictions.purpleCapPlayers.length}/3`,
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const progress = Math.round((completed / total) * 100);

  const maxPoints =
    (config?.winnerPoints || 0) +
    (config?.finalistPoints || 0) * 2 +
    (config?.finalFourPoints || 0) * 4 +
    (config?.orangeCapPoints || 0) * 3 +
    (config?.purpleCapPoints || 0) * 3;

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "250ms" }}>
      <h3 className="font-semibold text-gray-100 mb-4">Summary</h3>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{completed}/{total} completed</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
              item.done ? "bg-emerald-950/20 text-gray-200" : "bg-gray-800/50 text-gray-500"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={item.done ? "text-emerald-400" : "text-gray-600"}>
                {item.done ? "\u2713" : "\u25CB"}
              </span>
              <span>
                {item.label}
                {item.count && !item.done && (
                  <span className="text-gray-600 ml-1">({item.count})</span>
                )}
              </span>
            </div>
            {item.done && (
              <span className="text-xs text-gray-500 ml-2 text-right">
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Max points */}
      <div className="text-center text-xs text-gray-500 mb-4">
        Max potential: <span className="text-emerald-400 font-semibold">{maxPoints} pts</span>
      </div>

      {/* Submit button */}
      {!disabled && (
        <button
          onClick={onSubmit}
          disabled={!isComplete || submitting}
          className="btn-primary w-full text-center py-3"
        >
          {submitting && <Spinner size="sm" className="text-white inline mr-2" />}
          {isEdit
            ? `Update Predictions (-${editCost} pts)`
            : existing
            ? "Update Predictions"
            : "Lock Predictions"}
        </button>
      )}

      {!disabled && !existing && (
        <p className="text-gray-600 text-xs mt-2 text-center">
          Once locked, changes may cost points.
        </p>
      )}

      {isEdit && !disabled && (
        <p className="text-amber-500 text-xs mt-2 text-center">
          Updating will deduct {editCost} points from your balance.
        </p>
      )}
    </div>
  );
}
