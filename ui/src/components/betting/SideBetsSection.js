import React from "react";
import SideBetQuestion from "./SideBetQuestion";

/**
 * Container for all side bet questions for this match.
 * Side bets come from the side_bets table.
 */
export default function SideBetsSection({ sideBets, sideBetAnswers, setSideBetAnswer, disabled }) {
  if (!sideBets || sideBets.length === 0) return null;

  // Show only OPEN side bets with 3+ options (hides binary yes/no bets)
  const openBets = sideBets.filter(sb => sb.status === "OPEN" && (sb.options || []).length > 2);
  if (openBets.length === 0) return null;

  // Calculate potential win/loss
  const maxWin = openBets.reduce((sum, sb) => sum + sb.pointsCorrect, 0);
  const maxLoss = openBets.reduce((sum, sb) => sum + (sb.pointsWrong || 0), 0);

  return (
    <div className="animate-slide-up" style={{ animationDelay: "120ms" }}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-purple-800/50">
        <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-100">Side Bets</h2>
          <p className="text-xs text-gray-500">Bonus predictions with separate point values</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs bg-purple-900/50 text-purple-300 border border-purple-800">
            {openBets.length} question{openBets.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Potential points summary */}
      <div className="card mb-4 p-3 bg-gray-800/50 border-gray-700/50">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-500">
            Max win: <span className="text-emerald-400 font-semibold">+{maxWin}</span>
          </span>
          {maxLoss < 0 && (
            <span className="text-gray-500">
              Max loss: <span className="text-red-400 font-semibold">{maxLoss}</span>
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {openBets.map((sb, i) => (
          <SideBetQuestion
            key={sb.sideBetId}
            sideBet={sb}
            index={i}
            answer={sideBetAnswers[sb.sideBetId]}
            onAnswer={setSideBetAnswer}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
