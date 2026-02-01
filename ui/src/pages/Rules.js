import React from "react";

export default function Rules() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1 text-gray-100">Rules & Constitution</h1>
      </div>
      <div className="card prose prose-invert max-w-none">
        <h2 className="text-lg font-bold text-gray-200 mb-3">How It Works</h2>
        <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside mb-6">
          <li>For each match, answer prediction questions before the first ball is bowled.</li>
          <li>Each question carries a point value. Correct answers earn full points.</li>
          <li>Predictions lock automatically when the match begins.</li>
          <li>Your total score is the sum of points from all correct predictions.</li>
        </ul>
        <h2 className="text-lg font-bold text-gray-200 mb-3">Long-term Bets</h2>
        <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside mb-6">
          <li>Tournament-wide predictions can be submitted once before the deadline.</li>
          <li>Once locked, long-term bets cannot be changed.</li>
          <li>Long-term bets carry higher point values.</li>
        </ul>
        <h2 className="text-lg font-bold text-gray-200 mb-3">Groups</h2>
        <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside mb-6">
          <li>Create private groups to compete with friends.</li>
          <li>Share the group code to invite members.</li>
          <li>Each group has its own leaderboard.</li>
        </ul>
        <h2 className="text-lg font-bold text-gray-200 mb-3">Fair Play</h2>
        <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
          <li>One account per person.</li>
          <li>No automated prediction tools allowed.</li>
          <li>Decisions by the admin team are final.</li>
        </ul>
      </div>
    </div>
  );
}
