import React from "react";

/**
 * Single side bet question with radio options.
 * Shows points_correct and points_wrong from side_bets table.
 */
export default function SideBetQuestion({ sideBet, index, answer, onAnswer, disabled }) {
  const options = sideBet.options || [];
  const hasPenalty = sideBet.pointsWrong !== undefined && sideBet.pointsWrong < 0;
  const isHighRisk = hasPenalty && sideBet.pointsWrong <= -200;

  return (
    <div
      className={`card animate-slide-up ${
        isHighRisk ? "border-red-800/50 bg-red-950/10" : ""
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-100 text-sm flex-1 leading-relaxed">
          <span className="text-purple-400 mr-2">S{index + 1}.</span>
          {sideBet.questionText}
        </h3>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-800/80 border border-gray-700 shrink-0">
          <span className="text-xs font-semibold text-emerald-400" title="Points if correct">
            +{sideBet.pointsCorrect}
          </span>
          {sideBet.pointsWrong !== 0 && (
            <>
              <span className="text-gray-600">/</span>
              <span className={`text-xs font-semibold ${sideBet.pointsWrong < 0 ? "text-red-400" : "text-gray-400"}`} title="Points if wrong">
                {sideBet.pointsWrong > 0 ? `+${sideBet.pointsWrong}` : sideBet.pointsWrong}
              </span>
            </>
          )}
        </div>
      </div>

      {isHighRisk && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-red-400/80">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>High risk - significant penalty if wrong</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => {
          const optionValue = typeof opt === "string" ? opt : opt.value || opt.label || opt;
          const optionLabel = typeof opt === "string" ? opt : opt.label || opt.value || opt;

          return (
            <label
              key={i}
              className={`px-5 py-3 sm:px-4 sm:py-2 rounded-lg text-sm cursor-pointer border-2 transition-all min-w-[80px] text-center select-none active:scale-95 ${
                answer === optionValue
                  ? "bg-purple-600/30 border-purple-500 text-purple-200 shadow-lg shadow-purple-900/30"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-750"
              } ${disabled ? "pointer-events-none opacity-70" : ""}`}
            >
              <input
                type="radio"
                name={`sidebet_${sideBet.sideBetId}`}
                value={optionValue}
                checked={answer === optionValue}
                onChange={() => onAnswer(sideBet.sideBetId, optionValue)}
                disabled={disabled}
                className="sr-only"
              />
              {optionLabel}
            </label>
          );
        })}
      </div>
    </div>
  );
}
