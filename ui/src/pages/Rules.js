import React, { useState, useEffect } from "react";

export default function Rules() {
  const [scoringRules, setScoringRules] = useState(null);

  useEffect(() => {
    fetch("/data/scoring-rules.json")
      .then((res) => res.json())
      .then(setScoringRules)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1 text-gray-100">Rules & Scoring</h1>
        <p className="text-gray-500 text-sm">How predictions are scored</p>
      </div>

      {/* Scoring System */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-200 mb-4">Scoring System</h2>

        {/* Winner Question */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-blue-400 mb-2">Match Winner</h3>
          <p className="text-gray-400 text-sm mb-2">
            Predict the winning team. Full points if correct, 0 if wrong.
          </p>
        </div>

        {/* Total Runs Question */}
        <div className="mb-4">
          <h3 className="text-md font-semibold text-blue-400 mb-2">Total Runs Prediction</h3>
          <p className="text-gray-400 text-sm mb-3">
            Predict the combined runs scored by both teams. Points are awarded based on how close your prediction is to the actual total.
          </p>

          <div className="bg-gray-800/50 rounded-lg p-4 mb-3">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Scoring Tiers</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-700">
                    <th className="pb-2">Your Prediction</th>
                    <th className="pb-2 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-800">
                    <td className="py-2">Exact match</td>
                    <td className="py-2 text-right text-green-400 font-bold">5x base (500%)</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2">Off by 1 run</td>
                    <td className="py-2 text-right text-blue-400">1x base (100%)</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2">Off by 2-5 runs</td>
                    <td className="py-2 text-right text-yellow-400">0.5x base (50%)</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2">Off by 6-10 runs</td>
                    <td className="py-2 text-right text-orange-400">0.25x base (25%)</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2">Off by 11-15 runs</td>
                    <td className="py-2 text-right text-red-400">0.1x base (10%)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Off by 16+ runs</td>
                    <td className="py-2 text-right text-gray-500">0 points</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-gray-300 mb-2">Example</h4>
            <p className="text-gray-400 mb-2">
              If the question is worth <span className="text-white font-mono">1000</span> base points and the actual total is <span className="text-white font-mono">295</span> runs:
            </p>
            <ul className="text-gray-400 space-y-1">
              <li>Predict <span className="text-green-400">295</span> → <span className="text-green-400 font-bold">5000 pts</span> (exact!)</li>
              <li>Predict <span className="text-blue-400">294 or 296</span> → <span className="text-blue-400">1000 pts</span></li>
              <li>Predict <span className="text-yellow-400">292 or 298</span> → <span className="text-yellow-400">500 pts</span></li>
              <li>Predict <span className="text-orange-400">288 or 302</span> → <span className="text-orange-400">250 pts</span></li>
              <li>Predict <span className="text-red-400">283 or 307</span> → <span className="text-red-400">100 pts</span></li>
              <li>Predict <span className="text-gray-500">275 or 320</span> → <span className="text-gray-500">0 pts</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* General Rules */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-200 mb-3">How It Works</h2>
        <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
          <li>For each match, answer prediction questions before the first ball is bowled.</li>
          <li>Predictions lock automatically when the match begins.</li>
          <li>Your total score is the sum of points from all your predictions.</li>
          <li>Leaderboard updates in real-time after each match is scored.</li>
        </ul>
      </div>

      {/* Groups */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-200 mb-3">Groups</h2>
        <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
          <li>Create private groups to compete with friends.</li>
          <li>Share the group code to invite members.</li>
          <li>Each group has its own leaderboard.</li>
        </ul>
      </div>

      {/* Fair Play */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-200 mb-3">Fair Play</h2>
        <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
          <li>One account per person.</li>
          <li>No automated prediction tools allowed.</li>
          <li>Decisions by the admin team are final.</li>
        </ul>
      </div>

      {scoringRules && (
        <p className="text-center text-gray-600 text-xs mt-6">
          Scoring rules v{scoringRules.version} • Last updated: {scoringRules.lastUpdated}
        </p>
      )}
    </div>
  );
}
