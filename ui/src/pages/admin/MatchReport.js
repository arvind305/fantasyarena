import React, { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useToast } from "../../components/Toast";
import Spinner from "../../components/Spinner";
import AdminNav from "../../components/admin/AdminNav";
import UserBetCard from "../../components/UserBetCard";
import { apiGetMatchReport, getMatchSchedule } from "../../api";
import { TEAM_NAMES, TEAM_CODE_TO_ID } from "../../data/teams";

export default function MatchReport() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [scheduleMatch, setScheduleMatch] = useState(null);

  useEffect(() => {
    Promise.all([
      apiGetMatchReport(matchId),
      getMatchSchedule(),
    ])
      .then(([data, schedule]) => {
        setReport(data);
        setScheduleMatch(schedule.map[matchId] || null);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="card text-center py-12"><p className="text-red-400">Access Denied</p></div></div>;

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;

  if (!report || !report.config) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <AdminNav />
        <div className="card text-center py-12">
          <p className="text-gray-400">No data found for match {matchId}</p>
          <Link to="/admin/matches" className="text-brand-400 hover:text-brand-300 text-sm mt-2 inline-block">Back to Matches</Link>
        </div>
      </div>
    );
  }

  const { config, results, bets, playerStats, sideBets, slots, userNames } = report;
  const teamA = config.team_a;
  const teamB = config.team_b;
  const teamAName = TEAM_NAMES[TEAM_CODE_TO_ID[teamA]] || teamA;
  const teamBName = TEAM_NAMES[TEAM_CODE_TO_ID[teamB]] || teamB;
  // Resolve winner — could be a team code ("RSA") or option ID ("opt_wc_m13_winner_teamA")
  let winnerName = null;
  if (results?.winner) {
    const w = results.winner;
    const optMatch = w.match(/^opt_[^_]+_[^_]+_winner_(.+)$/);
    if (optMatch) {
      if (optMatch[1] === "teamA") winnerName = teamAName;
      else if (optMatch[1] === "teamB") winnerName = teamBName;
      else if (optMatch[1] === "super_over") winnerName = "Super Over";
      else winnerName = w;
    } else {
      winnerName = TEAM_NAMES[TEAM_CODE_TO_ID[w]] || w;
    }
  }
  const isScored = config.status === "SCORED";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 print:py-4 print:px-0">
      <div className="print:hidden">
        <AdminNav />
      </div>

      {/* Match Header */}
      <div className="card mb-6 print:border-0 print:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-extrabold text-gray-100">
                {teamAName} vs {teamBName}
              </h1>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                isScored ? "bg-purple-900/50 text-purple-300" : "bg-gray-800 text-gray-400"
              }`}>
                {config.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 space-y-0.5">
              {scheduleMatch && (
                <>
                  <p>{scheduleMatch.venue}</p>
                  <p>{new Date(scheduleMatch.scheduledTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" })} IST</p>
                </>
              )}
              <p className="text-gray-600">Match #{matchId}</p>
            </div>
          </div>
          {results && (
            <div className="text-right">
              {winnerName && winnerName !== "TIE" && winnerName !== "NO_RESULT" && (
                <div className="text-lg font-bold text-green-400">{winnerName} won</div>
              )}
              {results.winner === "TIE" && <div className="text-lg font-bold text-yellow-400">Match Tied</div>}
              {results.winner === "NO_RESULT" && <div className="text-lg font-bold text-gray-400">No Result</div>}
              {results.total_runs != null && (
                <div className="text-sm text-gray-500">Total Runs: {results.total_runs}</div>
              )}
              {results.man_of_match && (
                <div className="text-sm text-yellow-500">MoM: {results.man_of_match}</div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-4 print:hidden">
          <Link to={`/admin/match/${matchId}`} className="text-sm text-gray-400 hover:text-gray-200">Match Config</Link>
          <Link to={`/admin/score/${matchId}`} className="text-sm text-gray-400 hover:text-gray-200">Score Match</Link>
        </div>
      </div>

      {/* Scoring Rules Reference */}
      <details className="card mb-6 print:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-gray-400 hover:text-gray-200">Scoring Rules Reference</summary>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-400">
          <div><span className="text-gray-200 font-medium">Runs:</span> 1pt each</div>
          <div><span className="text-gray-200 font-medium">4s:</span> 10pt each</div>
          <div><span className="text-gray-200 font-medium">6s:</span> 20pt each</div>
          <div><span className="text-gray-200 font-medium">SR:</span> rounded, as pts</div>
          <div><span className="text-gray-200 font-medium">Wickets:</span> 20pt each</div>
          <div><span className="text-gray-200 font-medium">Econ &le;6:</span> +100</div>
          <div><span className="text-gray-200 font-medium">Econ &le;8:</span> +50</div>
          <div><span className="text-gray-200 font-medium">Econ &le;10:</span> +25</div>
          <div><span className="text-gray-200 font-medium">Fielding:</span> 5pt each</div>
          <div><span className="text-gray-200 font-medium">Century:</span> +200</div>
          <div><span className="text-gray-200 font-medium">5-Wkt Haul:</span> +200</div>
          <div><span className="text-gray-200 font-medium">Hat-trick:</span> +200</div>
          <div><span className="text-gray-200 font-medium">MoM:</span> +200</div>
          <div><span className="text-gray-200 font-medium">Winner:</span> {config.winner_base_points}pt</div>
          <div><span className="text-gray-200 font-medium">Total Runs:</span> {config.total_runs_base_points}pt</div>
        </div>
      </details>

      {/* Player Performance Table */}
      {playerStats.length > 0 && (
        <div className="card mb-6 p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-lg font-bold text-gray-200">Player Performance</h2>
            <p className="text-xs text-gray-500">{playerStats.length} players, sorted by fantasy points</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/80">
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <th className="text-left px-3 py-2">Player</th>
                  <th className="text-center px-2 py-2">Team</th>
                  <th className="text-right px-2 py-2">R</th>
                  <th className="text-right px-2 py-2">4s</th>
                  <th className="text-right px-2 py-2">6s</th>
                  <th className="text-right px-2 py-2">SR</th>
                  <th className="text-right px-2 py-2">W</th>
                  <th className="text-right px-2 py-2">Ov</th>
                  <th className="text-right px-2 py-2">Econ</th>
                  <th className="text-right px-2 py-2">C</th>
                  <th className="text-right px-3 py-2 font-bold text-amber-400">FP</th>
                </tr>
              </thead>
              <tbody>
                {playerStats.map((s, i) => {
                  const bonuses = [];
                  if (s.is_man_of_match) bonuses.push("MoM");
                  if (s.has_century) bonuses.push("100");
                  if (s.has_five_wicket_haul) bonuses.push("5W");
                  if (s.has_hat_trick) bonuses.push("HT");

                  return (
                    <tr key={s.player_id || i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-200 font-medium">{s.player_name || s.player_id}</span>
                          {bonuses.map(b => (
                            <span key={b} className={`px-1 py-0.5 text-[9px] font-bold rounded ${
                              b === "MoM" ? "bg-yellow-900/40 text-yellow-400" :
                              b === "100" ? "bg-green-900/40 text-green-400" :
                              b === "5W" ? "bg-purple-900/40 text-purple-400" :
                              "bg-red-900/40 text-red-400"
                            }`}>{b}</span>
                          ))}
                        </div>
                      </td>
                      <td className="text-center px-2 py-2 text-gray-500 text-xs">{s.team_code}</td>
                      <td className="text-right px-2 py-2 text-gray-300">{s.runs ?? '-'}</td>
                      <td className="text-right px-2 py-2 text-gray-300">{s.fours ?? '-'}</td>
                      <td className="text-right px-2 py-2 text-gray-300">{s.sixes ?? '-'}</td>
                      <td className="text-right px-2 py-2 text-gray-300">{s.strike_rate ? Math.round(s.strike_rate) : '-'}</td>
                      <td className="text-right px-2 py-2 text-gray-300">{s.wickets ?? '-'}</td>
                      <td className="text-right px-2 py-2 text-gray-300">{s.overs_bowled ?? '-'}</td>
                      <td className="text-right px-2 py-2 text-gray-300">{s.economy_rate ? parseFloat(s.economy_rate).toFixed(2) : '-'}</td>
                      <td className="text-right px-2 py-2 text-gray-300">{s.catches ?? '-'}</td>
                      <td className="text-right px-3 py-2 font-bold text-amber-400">{s.total_fantasy_points ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Bets Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-200 mb-4">
          User Bets ({bets.length})
        </h2>
        {bets.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-500">No bets placed on this match.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => (
              <UserBetCard
                key={bet.bet_id}
                userName={userNames[bet.user_id] || bet.user_id.slice(0, 8) + '...'}
                bet={bet}
                config={config}
                matchResults={results}
                playerStats={playerStats}
                sideBets={sideBets}
                slots={slots}
                isScored={isScored}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
