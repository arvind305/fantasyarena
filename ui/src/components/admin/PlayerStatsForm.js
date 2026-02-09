import React from "react";

/**
 * Form for entering player stats per match.
 * Renders a row per player with all stat fields.
 */
export default function PlayerStatsForm({ players, stats, setStats, disabled }) {
  function updateStat(playerId, field, value) {
    setStats((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [field]: value,
      },
    }));
  }

  function getVal(playerId, field, defaultVal = 0) {
    return stats[playerId]?.[field] ?? defaultVal;
  }

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No players available. Enter player stats after the squad is set.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {players.map((player) => (
        <div key={player.playerId} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-200">{player.playerName}</span>
              {player.playerRole && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-400">{player.playerRole}</span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              FP: <span className="text-emerald-400 font-medium">{calculateFantasyPoints(stats[player.playerId] || {})}</span>
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            <StatField label="Runs" value={getVal(player.playerId, "runs")} onChange={(v) => updateStat(player.playerId, "runs", v)} disabled={disabled} />
            <StatField label="Balls" value={getVal(player.playerId, "balls_faced")} onChange={(v) => updateStat(player.playerId, "balls_faced", v)} disabled={disabled} />
            <StatField label="4s" value={getVal(player.playerId, "fours")} onChange={(v) => updateStat(player.playerId, "fours", v)} disabled={disabled} />
            <StatField label="6s" value={getVal(player.playerId, "sixes")} onChange={(v) => updateStat(player.playerId, "sixes", v)} disabled={disabled} />
            <StatField label="Wkts" value={getVal(player.playerId, "wickets")} onChange={(v) => updateStat(player.playerId, "wickets", v)} disabled={disabled} />
            <StatField label="Overs" value={getVal(player.playerId, "overs_bowled")} onChange={(v) => updateStat(player.playerId, "overs_bowled", v)} step={0.1} disabled={disabled} />
            <StatField label="Runs Given" value={getVal(player.playerId, "runs_conceded")} onChange={(v) => updateStat(player.playerId, "runs_conceded", v)} disabled={disabled} />
            <StatField label="Catches" value={getVal(player.playerId, "catches")} onChange={(v) => updateStat(player.playerId, "catches", v)} disabled={disabled} />
            <StatField label="Run Outs" value={getVal(player.playerId, "run_outs")} onChange={(v) => updateStat(player.playerId, "run_outs", v)} disabled={disabled} />
            <StatField label="Stumpings" value={getVal(player.playerId, "stumpings")} onChange={(v) => updateStat(player.playerId, "stumpings", v)} disabled={disabled} />
          </div>

          {/* Bonus checkboxes */}
          <div className="flex flex-wrap gap-4 mt-3">
            <CheckField label="Century" checked={getVal(player.playerId, "has_century", false)} onChange={(v) => updateStat(player.playerId, "has_century", v)} disabled={disabled} />
            <CheckField label="5-fer" checked={getVal(player.playerId, "has_five_wicket_haul", false)} onChange={(v) => updateStat(player.playerId, "has_five_wicket_haul", v)} disabled={disabled} />
            <CheckField label="Hat-trick" checked={getVal(player.playerId, "has_hat_trick", false)} onChange={(v) => updateStat(player.playerId, "has_hat_trick", v)} disabled={disabled} />
            <CheckField label="MoM" checked={getVal(player.playerId, "is_man_of_match", false)} onChange={(v) => updateStat(player.playerId, "is_man_of_match", v)} disabled={disabled} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatField({ label, value, onChange, step, disabled }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-0.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step || 1}
        min={0}
        disabled={disabled}
        className={`w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200
          ${disabled ? "opacity-70 cursor-not-allowed" : "focus:outline-none focus:border-brand-600"}`}
      />
    </div>
  );
}

function CheckField({ label, checked, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-1.5 text-xs cursor-pointer ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="rounded border-gray-600 bg-gray-800 text-brand-600 focus:ring-brand-500"
      />
      <span className="text-gray-400">{label}</span>
    </label>
  );
}

/**
 * Calculate fantasy points from stats (mirrors DB function).
 */
function calculateFantasyPoints(s) {
  let pts = 0;
  pts += (s.runs || 0);
  pts += (s.fours || 0) * 10;
  pts += (s.sixes || 0) * 20;
  if ((s.balls_faced || 0) > 0) {
    const sr = ((s.runs || 0) / (s.balls_faced || 1)) * 100;
    pts += Math.round(sr);
  }
  pts += (s.wickets || 0) * 20;
  if ((s.overs_bowled || 0) > 0) {
    const eco = (s.runs_conceded || 0) / (s.overs_bowled || 1);
    if (eco <= 6) pts += 100;
    else if (eco <= 8) pts += 50;
    else if (eco <= 10) pts += 25;
  }
  pts += (s.catches || 0) * 5;
  pts += (s.run_outs || 0) * 5;
  pts += (s.stumpings || 0) * 5;
  if (s.has_century) pts += 200;
  if (s.has_five_wicket_haul) pts += 200;
  if (s.has_hat_trick) pts += 200;
  if (s.is_man_of_match) pts += 200;
  return pts;
}
