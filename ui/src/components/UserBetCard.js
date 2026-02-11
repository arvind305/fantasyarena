import React from "react";

/**
 * UserBetCard — shows one user's full bet breakdown for a match.
 *
 * Props:
 *   userName      - display name
 *   bet           - the raw bets row (answers, player_picks, side_bet_answers, score, etc.)
 *   config        - match_config row (winner_base_points, total_runs_base_points, team_a, team_b)
 *   matchResults  - match_results row (winner, total_runs, man_of_match)
 *   playerStats   - array of player_match_stats rows (with player_name, team_code)
 *   sideBets      - array of side_bets config (questionText, correctAnswer, pointsCorrect, pointsWrong)
 *   slots         - array of player_slots (slotNumber, multiplier)
 *   isScored      - whether to show points and correct/wrong indicators
 */
export default function UserBetCard({ userName, bet, config, matchResults, playerStats, sideBets, slots, isScored }) {
  if (!bet) return null;

  const answers = bet.answers || {};
  const playerPicks = bet.player_picks || [];
  const sideBetAnswers = bet.side_bet_answers || {};
  const runnerPicks = bet.runner_picks || [];

  // Build a map of player stats by player_id
  const statsMap = {};
  (playerStats || []).forEach(s => { statsMap[s.player_id] = s; });

  // Build slots map
  const slotMap = {};
  (slots || []).forEach(s => { slotMap[s.slotNumber] = s.multiplier; });

  // Winner pick — extract from answers JSONB (key like "q_wc_m13_winner")
  const winnerKey = Object.keys(answers).find(k => k.includes("winner"));
  const rawWinnerPick = winnerKey ? answers[winnerKey] : null;
  // Resolve option IDs (e.g. "opt_wc_m13_winner_teamA") to team codes
  let winnerDisplay = rawWinnerPick;
  if (rawWinnerPick) {
    const optMatch = rawWinnerPick.match(/^opt_[^_]+_[^_]+_winner_(.+)$/);
    if (optMatch) {
      if (optMatch[1] === "teamA") winnerDisplay = config?.team_a || "Team A";
      else if (optMatch[1] === "teamB") winnerDisplay = config?.team_b || "Team B";
      else if (optMatch[1] === "super_over") winnerDisplay = "Super Over";
    }
  }
  const actualWinner = matchResults?.winner;
  // Compare raw values for correct/wrong (both stored as option IDs or team codes)
  const winnerCorrect = isScored && rawWinnerPick && actualWinner && rawWinnerPick === actualWinner;
  const winnerWrong = isScored && rawWinnerPick && actualWinner && rawWinnerPick !== actualWinner;

  // Total runs — extract from answers JSONB (key like "q_wc_m13_total_runs")
  const runsKey = Object.keys(answers).find(k => k.includes("total_runs"));
  const runsVal = runsKey ? answers[runsKey] : null;
  const totalRunsGuess = runsVal != null ? Number(runsVal) : null;
  const actualTotalRuns = matchResults?.total_runs;
  const runsDiff = (totalRunsGuess != null && actualTotalRuns != null)
    ? Math.abs(totalRunsGuess - actualTotalRuns) : null;

  // Compute player pick points for display
  function getPlayerBreakdown(playerId) {
    const s = statsMap[playerId];
    if (!s) return null;

    const runs = s.runs || 0;
    const fours = s.fours || 0;
    const sixes = s.sixes || 0;
    const sr = s.strike_rate ? Math.round(s.strike_rate) : 0;
    const wickets = s.wickets || 0;
    const overs = s.overs_bowled ? parseFloat(s.overs_bowled) : 0;
    const econ = s.economy_rate ? parseFloat(s.economy_rate) : null;
    const catches = s.catches || 0;
    const runOuts = s.run_outs || 0;
    const stumpings = s.stumpings || 0;

    // Economy bonus (only if overs >= 1)
    let econBonus = 0;
    if (overs >= 1 && econ != null) {
      if (econ <= 6) econBonus = 100;
      else if (econ <= 8) econBonus = 50;
      else if (econ <= 10) econBonus = 25;
    }

    const isMoM = s.is_man_of_match;
    const hasCentury = s.has_century;
    const has5wkt = s.has_five_wicket_haul;
    const hasTrick = s.has_hat_trick;
    const bonusTotal = (isMoM ? 200 : 0) + (hasCentury ? 200 : 0) + (has5wkt ? 200 : 0) + (hasTrick ? 200 : 0);

    const fp = s.total_fantasy_points || 0;

    return {
      playerName: s.player_name,
      teamCode: s.team_code,
      runs, fours, sixes, sr, wickets, overs, econ, catches, runOuts, stumpings,
      econBonus, isMoM, hasCentury, has5wkt, hasTrick, bonusTotal, fp,
    };
  }

  // Total score
  const totalScore = bet.score || 0;

  return (
    <div className="card border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
        <h3 className="font-bold text-lg text-gray-100">{userName}</h3>
        {isScored && (
          <span className="text-xl font-extrabold text-amber-400">
            {totalScore} pts
          </span>
        )}
      </div>

      {/* Winner Pick */}
      <Section
        title="Winner Pick"
        points={isScored ? (bet.winner_points || 0) : null}
      >
        {rawWinnerPick ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-200">Picked: <strong>{winnerDisplay}</strong></span>
            {isScored && (
              winnerCorrect
                ? <CorrectBadge />
                : winnerWrong
                  ? <WrongBadge />
                  : null
            )}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No pick</span>
        )}
      </Section>

      {/* Total Runs */}
      <Section
        title="Total Runs"
        points={isScored ? (bet.total_runs_points || 0) : null}
      >
        {totalRunsGuess != null ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-gray-200">Guessed: <strong>{totalRunsGuess}</strong></span>
            {isScored && actualTotalRuns != null && (
              <>
                <span className="text-gray-500">Actual: {actualTotalRuns}</span>
                <span className={`font-medium ${runsDiff === 0 ? 'text-green-400' : runsDiff <= 10 ? 'text-yellow-400' : 'text-gray-400'}`}>
                  Off by {runsDiff}
                </span>
              </>
            )}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No guess</span>
        )}
      </Section>

      {/* Player Picks */}
      <Section
        title="Player Picks"
        points={isScored ? (bet.player_pick_points || 0) : null}
      >
        {playerPicks.length > 0 ? (
          <div className="space-y-2">
            {playerPicks.map((pick, idx) => {
              const slotNum = pick.slot || idx + 1;
              const multiplier = slotMap[slotNum] || 1;
              const breakdown = getPlayerBreakdown(pick.player_id);
              const slotPts = breakdown ? Math.round(breakdown.fp * multiplier) : null;

              return (
                <div key={idx} className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Slot {slotNum} ({multiplier}x)</span>
                      <span className="font-semibold text-gray-100">
                        {breakdown?.playerName || pick.player_name || pick.player_id}
                      </span>
                      {breakdown?.isMoM && <Badge text="MoM" color="yellow" />}
                      {breakdown?.hasCentury && <Badge text="100" color="green" />}
                      {breakdown?.has5wkt && <Badge text="5W" color="purple" />}
                      {breakdown?.hasTrick && <Badge text="HT" color="red" />}
                    </div>
                    {isScored && breakdown && (
                      <span className="text-sm font-bold text-gray-300">{breakdown.fp} fp</span>
                    )}
                  </div>
                  {isScored && breakdown && (
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div className="flex flex-wrap gap-x-3">
                        <span>Runs:{breakdown.runs}</span>
                        <span>4s:{breakdown.fours}({breakdown.fours * 10})</span>
                        <span>6s:{breakdown.sixes}({breakdown.sixes * 20})</span>
                        <span>SR:{breakdown.sr}</span>
                        {breakdown.overs > 0 && (
                          <>
                            <span>Wkts:{breakdown.wickets}({breakdown.wickets * 20})</span>
                            <span>Econ:{breakdown.econ != null ? breakdown.econ.toFixed(2) : '-'}({breakdown.econBonus > 0 ? '+' + breakdown.econBonus : '0'})</span>
                          </>
                        )}
                        <span>Cat:{breakdown.catches}({(breakdown.catches + breakdown.runOuts + breakdown.stumpings) * 5})</span>
                      </div>
                      {breakdown.bonusTotal > 0 && (
                        <div className="text-yellow-500">
                          Bonuses: {[
                            breakdown.isMoM && 'MoM(+200)',
                            breakdown.hasCentury && '100(+200)',
                            breakdown.has5wkt && '5W(+200)',
                            breakdown.hasTrick && 'HT(+200)',
                          ].filter(Boolean).join(', ')}
                        </div>
                      )}
                      <div className="text-gray-400 font-medium">
                        {breakdown.fp} fp x {multiplier} = {slotPts} pts
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No player picks</span>
        )}
      </Section>

      {/* Side Bets */}
      <Section
        title="Side Bets"
        points={isScored ? (bet.side_bet_points || 0) : null}
      >
        {sideBets && sideBets.length > 0 ? (
          <div className="space-y-2">
            {sideBets.map((sb) => {
              const userAnswer = sideBetAnswers[sb.sideBetId];
              const correct = isScored && sb.correctAnswer && userAnswer === sb.correctAnswer;
              const wrong = isScored && sb.correctAnswer && userAnswer && userAnswer !== sb.correctAnswer;
              const pts = correct ? sb.pointsCorrect : wrong ? sb.pointsWrong : 0;

              return (
                <div key={sb.sideBetId} className="flex items-start justify-between gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400">{sb.questionText}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-gray-200">{userAnswer || <span className="text-gray-600">No answer</span>}</span>
                      {isScored && correct && <CorrectBadge />}
                      {isScored && wrong && <WrongBadge />}
                    </div>
                  </div>
                  {isScored && userAnswer && (
                    <span className={`font-semibold shrink-0 ${pts >= 0 ? (correct ? 'text-green-400' : 'text-gray-400') : 'text-red-400'}`}>
                      {pts > 0 ? '+' : ''}{pts}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No side bets</span>
        )}
      </Section>

      {/* Runners */}
      <Section
        title="Runners"
        points={isScored ? (bet.runner_points || 0) : null}
        last
      >
        {runnerPicks.length > 0 ? (
          <div className="space-y-1">
            {runnerPicks.map((pick, idx) => {
              const breakdown = getPlayerBreakdown(pick.player_id);
              return (
                <div key={idx} className="text-sm text-gray-300">
                  {breakdown?.playerName || pick.player_name || pick.display_name || pick.player_id}
                  {isScored && breakdown && (
                    <span className="text-gray-500 ml-2">({breakdown.fp} fp)</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">(none)</span>
        )}
      </Section>
    </div>
  );
}

function Section({ title, points, children, last }) {
  return (
    <div className={`py-3 ${last ? '' : 'border-b border-gray-800/50'}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h4>
        {points != null && (
          <span className={`text-sm font-bold ${points > 0 ? 'text-green-400' : points < 0 ? 'text-red-400' : 'text-gray-500'}`}>
            {points > 0 ? '+' : ''}{points} pts
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function CorrectBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-900/40 text-green-400 border border-green-800/50">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
    </span>
  );
}

function WrongBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-900/40 text-red-400 border border-red-800/50">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
    </span>
  );
}

function Badge({ text, color }) {
  const colors = {
    yellow: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50',
    green: 'bg-green-900/40 text-green-400 border-green-800/50',
    purple: 'bg-purple-900/40 text-purple-400 border-purple-800/50',
    red: 'bg-red-900/40 text-red-400 border-red-800/50',
  };
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${colors[color] || colors.yellow}`}>
      {text}
    </span>
  );
}
