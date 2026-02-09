import React from "react";

/**
 * Summary of all selections before submit.
 * Shows what the user has picked and potential points.
 */
export default function BetSummary({
  config,
  slots,
  sideBets,
  winner,
  totalRuns,
  playerPicks,
  sideBetAnswers,
  runnerPicks,
}) {
  if (!config) return null;

  const enabledSlots = (slots || []).filter(s => s.isEnabled);
  const openSideBets = (sideBets || []).filter(sb => sb.status === "OPEN");

  // Count completion
  const sections = [];
  let completed = 0;
  let total = 0;

  // Winner
  total++;
  if (winner) completed++;
  sections.push({ label: "Match Winner", done: !!winner, value: winner || "Not selected" });

  // Total Runs
  total++;
  if (totalRuns) completed++;
  sections.push({ label: "Total Runs", done: !!totalRuns, value: totalRuns || "Not entered" });

  // Player picks
  for (const slot of enabledSlots) {
    total++;
    const pick = playerPicks.find(p => p.slot === slot.slotNumber);
    if (pick?.player_id) completed++;
    sections.push({
      label: `Player Slot ${slot.slotNumber} (${slot.multiplier}x)`,
      done: !!pick?.player_id,
      value: pick?.player_name || "Not selected",
    });
  }

  // Side bets
  for (const sb of openSideBets) {
    total++;
    if (sideBetAnswers[sb.sideBetId]) completed++;
    sections.push({
      label: sb.questionText.length > 40 ? sb.questionText.slice(0, 40) + "..." : sb.questionText,
      done: !!sideBetAnswers[sb.sideBetId],
      value: sideBetAnswers[sb.sideBetId] || "Not answered",
    });
  }

  // Runners (optional, don't count toward total)
  if (config.runnersEnabled && config.runnerCount > 0) {
    sections.push({
      label: `Runners (${runnerPicks.length}/${config.runnerCount})`,
      done: runnerPicks.length > 0,
      value: runnerPicks.length > 0
        ? runnerPicks.map(r => r.display_name).join(", ")
        : "None selected (optional)",
      optional: true,
    });
  }

  const progress = total > 0 ? (completed / total) * 100 : 0;
  const allDone = completed === total;

  // Calculate potential points
  const winnerPoints = config.winnerBasePoints || 0;
  const maxRunsPoints = (config.totalRunsBasePoints || 0) * 5;
  const sideBetMax = openSideBets.reduce((sum, sb) => sum + sb.pointsCorrect, 0);
  const sideBetMin = openSideBets.reduce((sum, sb) => sum + (sb.pointsWrong || 0), 0);

  return (
    <div className="card bg-gray-900/70 border-gray-700">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <h3 className="font-semibold text-gray-200">Bet Summary</h3>
        <span className="ml-auto text-sm text-gray-400">{completed}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              allDone ? "bg-emerald-500" : "bg-brand-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {allDone ? "All selections complete!" : `${total - completed} more to go`}
        </p>
      </div>

      {/* Point projections */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-gray-800/50">
          <div className="text-lg font-bold text-emerald-400">+{winnerPoints}</div>
          <div className="text-xs text-gray-500">Winner</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-800/50">
          <div className="text-lg font-bold text-blue-400">+{maxRunsPoints}</div>
          <div className="text-xs text-gray-500">Runs (max)</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-800/50">
          <div className="text-lg font-bold text-purple-400">+{sideBetMax}</div>
          <div className="text-xs text-gray-500">Side Bets</div>
        </div>
        {sideBetMin < 0 && (
          <div className="text-center p-2 rounded-lg bg-red-950/30 border border-red-900/30">
            <div className="text-lg font-bold text-red-400">{sideBetMin}</div>
            <div className="text-xs text-red-600">Risk</div>
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {sections.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
              s.done
                ? "bg-emerald-950/20 text-gray-300"
                : s.optional
                ? "bg-gray-800/30 text-gray-500"
                : "bg-gray-800/50 text-gray-400"
            }`}
          >
            {s.done ? (
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : s.optional ? (
              <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
            )}
            <span className="flex-1 truncate">{s.label}</span>
            <span className={`shrink-0 ${s.done ? "text-emerald-400" : "text-gray-600"}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
