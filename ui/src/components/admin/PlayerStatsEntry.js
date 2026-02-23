import React, { useState, useEffect, useCallback } from "react";
import { apiGetSquadPlayers } from "../../api";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import Spinner from "../Spinner";

const STAT_FIELDS = [
  { key: "runs", label: "R", step: 1 },
  { key: "balls_faced", label: "B", step: 1 },
  { key: "fours", label: "4s", step: 1 },
  { key: "sixes", label: "6s", step: 1 },
  { key: "wickets", label: "W", step: 1 },
  { key: "overs_bowled", label: "Ov", step: 0.1 },
  { key: "runs_conceded", label: "RC", step: 1 },
  { key: "catches", label: "Ct", step: 1 },
  { key: "run_outs", label: "RO", step: 1 },
  { key: "stumpings", label: "St", step: 1 },
];

const ROLE_COLORS = {
  Batsman: "bg-blue-900/40 text-blue-300",
  Bowler: "bg-red-900/40 text-red-300",
  "All-Rounder": "bg-purple-900/40 text-purple-300",
  "Wicket-Keeper": "bg-amber-900/40 text-amber-300",
};

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

export default function PlayerStatsEntry({
  matchId,
  teamA,
  teamB,
  manOfMatch,
  onManOfMatchChange,
  onStatsCountChange,
  admin,
  toast,
}) {
  const [squads, setSquads] = useState({ a: [], b: [] });
  const [loading, setLoading] = useState(true);
  const [played, setPlayed] = useState({}); // { playerId: true/false }
  const [stats, setStats] = useState({});   // { playerId: { runs, balls_faced, ... } }
  const [saving, setSaving] = useState(false);
  const [existingCount, setExistingCount] = useState(0);

  // Load squads + existing stats
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [playersA, playersB] = await Promise.all([
          apiGetSquadPlayers(teamA),
          apiGetSquadPlayers(teamB),
        ]);
        if (cancelled) return;
        setSquads({ a: playersA, b: playersB });

        // Load existing player_match_stats for this match
        if (isSupabaseConfigured() && supabase) {
          const { data: existing } = await supabase
            .from("player_match_stats")
            .select("*")
            .eq("match_id", matchId);

          if (!cancelled && existing && existing.length > 0) {
            const playedMap = {};
            const statsMap = {};
            existing.forEach((row) => {
              playedMap[row.player_id] = true;
              statsMap[row.player_id] = {
                runs: row.runs || 0,
                balls_faced: row.balls_faced || 0,
                fours: row.fours || 0,
                sixes: row.sixes || 0,
                wickets: row.wickets || 0,
                overs_bowled: row.overs_bowled || 0,
                runs_conceded: row.runs_conceded || 0,
                catches: row.catches || 0,
                run_outs: row.run_outs || 0,
                stumpings: row.stumpings || 0,
                is_man_of_match: row.is_man_of_match || false,
                has_century: row.has_century || false,
                has_five_wicket_haul: row.has_five_wicket_haul || false,
                has_hat_trick: row.has_hat_trick || false,
              };
            });
            setPlayed(playedMap);
            setStats(statsMap);
            setExistingCount(existing.length);
          }
        }
      } catch (err) {
        if (!cancelled) toast.error("Failed to load squads: " + err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [matchId, teamA, teamB, toast]);

  const togglePlayed = useCallback((playerId) => {
    setPlayed((prev) => {
      const next = { ...prev };
      if (next[playerId]) {
        delete next[playerId];
      } else {
        next[playerId] = true;
      }
      return next;
    });
  }, []);

  const updateStat = useCallback((playerId, field, value) => {
    setStats((prev) => {
      const playerStats = { ...(prev[playerId] || {}), [field]: value };
      // Auto-detect bonuses
      if (field === "runs") {
        playerStats.has_century = value >= 100;
      }
      if (field === "wickets") {
        playerStats.has_five_wicket_haul = value >= 5;
      }
      return { ...prev, [playerId]: playerStats };
    });
  }, []);

  const toggleBonus = useCallback((playerId, field) => {
    setStats((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [field]: !(prev[playerId]?.[field]),
      },
    }));
  }, []);

  const toggleMoM = useCallback((playerId, playerName) => {
    setStats((prev) => {
      const wasSet = prev[playerId]?.is_man_of_match;
      const next = { ...prev };
      // Clear MoM from all players
      Object.keys(next).forEach((pid) => {
        if (next[pid]?.is_man_of_match) {
          next[pid] = { ...next[pid], is_man_of_match: false };
        }
      });
      // Toggle for this player
      if (!wasSet) {
        next[playerId] = { ...(next[playerId] || {}), is_man_of_match: true };
        onManOfMatchChange(playerName);
      } else {
        onManOfMatchChange("");
      }
      return next;
    });
  }, [onManOfMatchChange]);

  // Sync MoM from Step 1 → stats (if manOfMatch text changes externally)
  useEffect(() => {
    if (!manOfMatch) return;
    const allPlayers = [...squads.a, ...squads.b];
    const match = allPlayers.find(
      (p) => p.playerName.toLowerCase() === manOfMatch.trim().toLowerCase()
    );
    if (match && !stats[match.playerId]?.is_man_of_match) {
      setStats((prev) => {
        const next = { ...prev };
        // Clear existing MoM
        Object.keys(next).forEach((pid) => {
          if (next[pid]?.is_man_of_match) {
            next[pid] = { ...next[pid], is_man_of_match: false };
          }
        });
        next[match.playerId] = { ...(next[match.playerId] || {}), is_man_of_match: true };
        return next;
      });
    }
  }, [manOfMatch, squads.a, squads.b]);

  async function handleSave() {
    const playedIds = Object.keys(played).filter((pid) => played[pid]);
    if (playedIds.length === 0) {
      toast.error("No players marked as played");
      return;
    }

    const statsMap = {};
    playedIds.forEach((pid) => {
      statsMap[pid] = stats[pid] || {};
    });

    setSaving(true);
    try {
      await admin.savePlayerStats(matchId, statsMap);
      toast.success(`Saved stats for ${playedIds.length} players`);
      setExistingCount(playedIds.length);
      onStatsCountChange(playedIds.length);
    } catch (err) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
        <Spinner size="sm" /> Loading squads...
      </div>
    );
  }

  const playedCount = Object.keys(played).filter((pid) => played[pid]).length;
  const totalPlayers = squads.a.length + squads.b.length;
  const totalFP = Object.entries(stats)
    .filter(([pid]) => played[pid])
    .reduce((sum, [, s]) => sum + calculateFantasyPoints(s), 0);

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
        <div className="text-sm text-gray-300">
          <span className="font-semibold text-brand-400">{playedCount}</span> / {totalPlayers} players entered
          {existingCount > 0 && (
            <span className="ml-2 text-xs text-emerald-400">(loaded {existingCount} existing)</span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          Total FP: <span className="font-semibold text-emerald-400">{totalFP}</span>
        </div>
      </div>

      {/* Two-column team layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamBlock
          teamCode={teamA}
          players={squads.a}
          played={played}
          stats={stats}
          togglePlayed={togglePlayed}
          updateStat={updateStat}
          toggleBonus={toggleBonus}
          toggleMoM={toggleMoM}
        />
        <TeamBlock
          teamCode={teamB}
          players={squads.b}
          played={played}
          stats={stats}
          togglePlayed={togglePlayed}
          updateStat={updateStat}
          toggleBonus={toggleBonus}
          toggleMoM={toggleMoM}
        />
      </div>

      {/* Save button */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || admin.saving || playedCount === 0}
          className="btn-primary"
        >
          {saving ? <Spinner size="sm" className="inline mr-2" /> : null}
          Save Player Stats ({playedCount} players)
        </button>
        {existingCount > 0 && (
          <span className="text-xs text-gray-500">
            Re-saving will update existing stats (upsert)
          </span>
        )}
      </div>
    </div>
  );
}

function TeamBlock({ teamCode, players, played, stats, togglePlayed, updateStat, toggleBonus, toggleMoM }) {
  const playedInTeam = players.filter((p) => played[p.playerId]).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{teamCode}</h3>
        <span className="text-xs text-gray-500">{playedInTeam}/{players.length} played</span>
      </div>
      <div className="space-y-2">
        {players.map((player) => (
          <PlayerRow
            key={player.playerId}
            player={player}
            isPlayed={!!played[player.playerId]}
            playerStats={stats[player.playerId] || {}}
            togglePlayed={togglePlayed}
            updateStat={updateStat}
            toggleBonus={toggleBonus}
            toggleMoM={toggleMoM}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerRow({ player, isPlayed, playerStats, togglePlayed, updateStat, toggleBonus, toggleMoM }) {
  const fp = isPlayed ? calculateFantasyPoints(playerStats) : 0;
  const roleClass = ROLE_COLORS[player.playerRole] || "bg-gray-700/40 text-gray-400";

  return (
    <div className={`rounded-lg border transition-all ${
      isPlayed
        ? "bg-gray-800/60 border-gray-600/50"
        : "bg-gray-900/30 border-gray-800/30"
    }`}>
      {/* Player header row */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => togglePlayed(player.playerId)}
      >
        <input
          type="checkbox"
          checked={isPlayed}
          onChange={() => togglePlayed(player.playerId)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-600 bg-gray-800 text-brand-600 focus:ring-brand-500"
        />
        <span className={`text-sm font-medium ${isPlayed ? "text-gray-200" : "text-gray-500"}`}>
          {player.playerName}
        </span>
        {player.isCaptain && <span className="text-xs text-amber-400 font-bold">(C)</span>}
        {player.playerRole && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${roleClass}`}>
            {player.playerRole}
          </span>
        )}
        {isPlayed && (
          <span className="ml-auto text-xs text-emerald-400 font-medium">{fp} FP</span>
        )}
      </div>

      {/* Expanded stat inputs when played */}
      {isPlayed && (
        <div className="px-3 pb-3 pt-1">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {STAT_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-[10px] text-gray-500 block mb-0.5 text-center">{f.label}</label>
                <input
                  type="number"
                  value={playerStats[f.key] || 0}
                  onChange={(e) => updateStat(player.playerId, f.key, parseFloat(e.target.value) || 0)}
                  step={f.step}
                  min={0}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-1 text-xs text-center text-gray-200 focus:outline-none focus:border-brand-600"
                />
              </div>
            ))}
          </div>
          {/* Bonus checkboxes */}
          <div className="flex flex-wrap gap-3 mt-2">
            <BonusCheck
              label="100"
              checked={!!playerStats.has_century}
              onChange={() => toggleBonus(player.playerId, "has_century")}
            />
            <BonusCheck
              label="5W"
              checked={!!playerStats.has_five_wicket_haul}
              onChange={() => toggleBonus(player.playerId, "has_five_wicket_haul")}
            />
            <BonusCheck
              label="HT"
              checked={!!playerStats.has_hat_trick}
              onChange={() => toggleBonus(player.playerId, "has_hat_trick")}
            />
            <BonusCheck
              label="MoM"
              checked={!!playerStats.is_man_of_match}
              onChange={() => toggleMoM(player.playerId, player.playerName)}
              highlight
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BonusCheck({ label, checked, onChange, highlight }) {
  return (
    <label className="flex items-center gap-1 text-[11px] cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={`rounded border-gray-600 bg-gray-800 focus:ring-brand-500 ${
          highlight ? "text-amber-500" : "text-brand-600"
        }`}
      />
      <span className={checked && highlight ? "text-amber-400 font-medium" : "text-gray-400"}>
        {label}
      </span>
    </label>
  );
}
