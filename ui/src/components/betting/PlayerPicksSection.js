import React from "react";
import PlayerSlot from "./PlayerSlot";

/**
 * Container showing N player pick slots based on match_config.player_slot_count.
 * Each slot has its own multiplier from player_slots table.
 */
export default function PlayerPicksSection({
  config,
  slots,
  match,
  playerPicks,
  setPlayerPick,
  disabled,
  selectedPlayerIds,
}) {
  if (!config?.playerSlotsEnabled || !slots || slots.length === 0) {
    return null;
  }

  const enabledSlots = slots.filter(s => s.isEnabled);

  if (enabledSlots.length === 0) return null;

  return (
    <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-cyan-800/50">
        <div className="w-10 h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-100">Player Picks</h2>
          <p className="text-xs text-gray-500">
            Pick {enabledSlots.length} player{enabledSlots.length > 1 ? "s" : ""} - earn fantasy points multiplied by slot value
          </p>
        </div>
        <span className="ml-auto px-2.5 py-1 rounded-full text-xs bg-cyan-900/50 text-cyan-300 border border-cyan-800">
          {enabledSlots.length} slot{enabledSlots.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Fantasy points explanation */}
      <div className="card mb-4 p-3 bg-gray-800/50 border-gray-700/50">
        <p className="text-xs text-gray-400 mb-2 font-medium">How player fantasy points work:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <span className="text-gray-500">Runs: <span className="text-gray-300">1pt/run</span></span>
          <span className="text-gray-500">Fours: <span className="text-gray-300">10pt</span></span>
          <span className="text-gray-500">Sixes: <span className="text-gray-300">20pt</span></span>
          <span className="text-gray-500">Wickets: <span className="text-gray-300">20pt</span></span>
          <span className="text-gray-500">Catches: <span className="text-gray-300">5pt</span></span>
          <span className="text-gray-500">Century: <span className="text-gray-300">200pt</span></span>
          <span className="text-gray-500">5-fer: <span className="text-gray-300">200pt</span></span>
          <span className="text-gray-500">MoM: <span className="text-gray-300">200pt</span></span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Player's fantasy points are multiplied by the slot multiplier.
        </p>
      </div>

      <div className="space-y-3">
        {enabledSlots.map((slot) => {
          const currentPick = playerPicks.find(p => p.slot === slot.slotNumber);
          return (
            <PlayerSlot
              key={slot.slotId}
              slot={slot}
              config={config}
              match={match}
              currentPick={currentPick}
              onPickPlayer={setPlayerPick}
              disabled={disabled}
              selectedPlayerIds={selectedPlayerIds}
            />
          );
        })}
      </div>
    </div>
  );
}
