import React from "react";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1 text-gray-100">About</h1>
      </div>
      <div className="card">
        <p className="text-gray-400 text-sm mb-4">
          Super Selector is a cricket prediction platform where you can test your cricket knowledge
          by making predictions on upcoming matches and tournament outcomes.
        </p>
        <p className="text-gray-400 text-sm mb-4">
          Compete with friends in private groups, climb the global leaderboard, and track your
          prediction accuracy over the season.
        </p>
        <p className="text-gray-400 text-sm mb-4">
          This is a free platform built for entertainment and friendly competition. No real money
          is involved in any predictions.
        </p>
        <p className="text-gray-500 text-xs mt-6">
          Built with passion for cricket fans everywhere.
        </p>
      </div>
    </div>
  );
}
