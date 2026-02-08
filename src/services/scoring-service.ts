/**
 * Fantasy Sports Game - Scoring Service
 *
 * Authority: Constitution.md v1.0
 *
 * This service handles scoring of user bets based on match results.
 * It implements scoring logic for different question types:
 * - WINNER: Full points if correct, 0 if wrong (Super Over multiplied)
 * - TOTAL_RUNS: Distance-based scoring
 * - PLAYER_PICK: Base score from scoring-engine multiplied by slot multiplier
 * - SIDE_BET: Points if correct, pointsWrong if incorrect
 */

import { supabaseAdmin } from '../db/supabase';
import {
  computeBasePlayerScore,
  type PlayerMatchStats,
  type RuleVersion,
  CONSTITUTION_V1_SCORING_RULES,
} from '../../scoring-engine';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Question types supported by the scoring system
 */
export type QuestionKind = 'WINNER' | 'TOTAL_RUNS' | 'PLAYER_PICK' | 'SIDE_BET';

/**
 * Question definition from match_questions table
 */
export interface Question {
  question_id: string;
  match_id: string;
  section: string;
  kind: QuestionKind;
  type: string;
  text: string;
  points: number;
  points_wrong: number;
  options: QuestionOption[];
  slot: SlotConfig;
  status: string;
  disabled: boolean;
}

/**
 * Option for a question (e.g., team options for WINNER question)
 */
export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

/**
 * Slot configuration for PLAYER_PICK questions
 */
export interface SlotConfig {
  slotNumber?: number;
  multiplier?: number;
}

/**
 * Match result from match_results table
 */
export interface MatchResult {
  match_id: string;
  winner: string | null;
  total_runs: number;
  player_stats: Record<string, PlayerMatchStats>;
  side_bet_answers: Record<string, string>;
  man_of_match: string | null;
  completed_at: string;
}

/**
 * User's bet from bets table
 */
export interface UserBet {
  id: string;
  bet_id: string;
  user_id: string;
  match_id: string;
  answers: Record<string, string | number>;
  is_locked: boolean;
  submitted_at: string;
  score: number;
}

/**
 * Score breakdown for a single question
 */
export interface QuestionScoreBreakdown {
  question_id: string;
  kind: QuestionKind;
  user_answer: string | number | null;
  correct_answer: string | number | null;
  base_points: number;
  multiplier: number;
  final_points: number;
  is_correct: boolean;
  details?: Record<string, unknown>;
}

/**
 * Complete score breakdown for a bet
 */
export interface BetScoreBreakdown {
  bet_id: string;
  user_id: string;
  match_id: string;
  question_scores: QuestionScoreBreakdown[];
  total_score: number;
  scored_at: Date;
}

// =============================================================================
// DEFAULT RULE VERSION
// =============================================================================

/**
 * Default rule version using Constitution v1.0 scoring rules
 */
const DEFAULT_RULE_VERSION: RuleVersion = {
  id: 'constitution-v1',
  version: '1.0.0',
  createdAt: new Date('2024-01-01'),
  isActive: true,
  scoringRules: CONSTITUTION_V1_SCORING_RULES,
};

// =============================================================================
// TOTAL RUNS SCORING (Distance-based)
// =============================================================================

/**
 * Calculate points for TOTAL_RUNS question using distance-based scoring
 *
 * Scoring tiers:
 * - Exact match: 100% of max points
 * - Within 10 runs: 75% of max points
 * - Within 25 runs: 50% of max points
 * - Within 50 runs: 25% of max points
 * - Beyond 50 runs: 0 points
 *
 * @param predicted - User's predicted total runs
 * @param actual - Actual total runs from match
 * @param maxPoints - Maximum points for this question
 * @returns Calculated points based on distance
 */
export function calculateTotalRunsPoints(
  predicted: number,
  actual: number,
  maxPoints: number
): number {
  const distance = Math.abs(predicted - actual);

  if (distance === 0) {
    // Exact match - 100%
    return maxPoints;
  } else if (distance <= 10) {
    // Within 10 runs - 75%
    return Math.round(maxPoints * 0.75);
  } else if (distance <= 25) {
    // Within 25 runs - 50%
    return Math.round(maxPoints * 0.5);
  } else if (distance <= 50) {
    // Within 50 runs - 25%
    return Math.round(maxPoints * 0.25);
  } else {
    // Beyond 50 runs - 0%
    return 0;
  }
}

// =============================================================================
// QUESTION SCORING FUNCTIONS
// =============================================================================

/**
 * Score a WINNER question
 *
 * Full points if correct, 0 if wrong.
 * If user predicted SUPER_OVER and match went to super over, apply 2x multiplier.
 */
function scoreWinnerQuestion(
  question: Question,
  userAnswer: string | null,
  matchResult: MatchResult
): QuestionScoreBreakdown {
  const correctAnswer = matchResult.winner;
  const isCorrect = userAnswer !== null && userAnswer === correctAnswer;

  // Super Over bonus: if user predicted super over and it happened
  const isSuperOverPrediction = userAnswer === 'SUPER_OVER';
  const wasSuperOver = correctAnswer === 'SUPER_OVER' || matchResult.winner?.includes('SO');
  const multiplier = isSuperOverPrediction && wasSuperOver ? 2 : 1;

  const basePoints = isCorrect ? question.points : 0;
  const finalPoints = basePoints * multiplier;

  return {
    question_id: question.question_id,
    kind: 'WINNER',
    user_answer: userAnswer,
    correct_answer: correctAnswer,
    base_points: basePoints,
    multiplier,
    final_points: finalPoints,
    is_correct: isCorrect,
    details: {
      predicted_super_over: isSuperOverPrediction,
      was_super_over: wasSuperOver,
    },
  };
}

/**
 * Score a TOTAL_RUNS question using distance-based scoring
 */
function scoreTotalRunsQuestion(
  question: Question,
  userAnswer: number | null,
  matchResult: MatchResult
): QuestionScoreBreakdown {
  const actualRuns = matchResult.total_runs;

  if (userAnswer === null) {
    return {
      question_id: question.question_id,
      kind: 'TOTAL_RUNS',
      user_answer: null,
      correct_answer: actualRuns,
      base_points: 0,
      multiplier: 1,
      final_points: 0,
      is_correct: false,
      details: { distance: null, tier: 'NO_ANSWER' },
    };
  }

  const distance = Math.abs(userAnswer - actualRuns);
  const points = calculateTotalRunsPoints(userAnswer, actualRuns, question.points);
  const isExact = distance === 0;

  // Determine scoring tier for transparency
  let tier: string;
  if (distance === 0) tier = 'EXACT';
  else if (distance <= 10) tier = 'WITHIN_10';
  else if (distance <= 25) tier = 'WITHIN_25';
  else if (distance <= 50) tier = 'WITHIN_50';
  else tier = 'BEYOND_50';

  return {
    question_id: question.question_id,
    kind: 'TOTAL_RUNS',
    user_answer: userAnswer,
    correct_answer: actualRuns,
    base_points: points,
    multiplier: 1,
    final_points: points,
    is_correct: isExact,
    details: { distance, tier },
  };
}

/**
 * Score a PLAYER_PICK question
 *
 * Uses the scoring engine to calculate player's base score,
 * then applies the slot multiplier.
 */
function scorePlayerPickQuestion(
  question: Question,
  userAnswer: string | null,
  matchResult: MatchResult,
  ruleVersion: RuleVersion = DEFAULT_RULE_VERSION
): QuestionScoreBreakdown {
  if (!userAnswer) {
    return {
      question_id: question.question_id,
      kind: 'PLAYER_PICK',
      user_answer: null,
      correct_answer: null,
      base_points: 0,
      multiplier: question.slot?.multiplier ?? 1,
      final_points: 0,
      is_correct: false,
      details: { reason: 'NO_PLAYER_SELECTED' },
    };
  }

  const playerId = userAnswer;
  const playerStats = matchResult.player_stats?.[playerId];

  if (!playerStats) {
    // Player not in match or no stats available
    return {
      question_id: question.question_id,
      kind: 'PLAYER_PICK',
      user_answer: playerId,
      correct_answer: null,
      base_points: 0,
      multiplier: question.slot?.multiplier ?? 1,
      final_points: 0,
      is_correct: false,
      details: { reason: 'PLAYER_NOT_IN_MATCH' },
    };
  }

  // Calculate base score using the scoring engine
  const baseScoreBreakdown = computeBasePlayerScore(playerStats, ruleVersion);
  const baseScore = baseScoreBreakdown.totalBaseScore;

  // Apply slot multiplier
  const slotMultiplier = question.slot?.multiplier ?? 1;
  const finalScore = Math.round(baseScore * slotMultiplier);

  return {
    question_id: question.question_id,
    kind: 'PLAYER_PICK',
    user_answer: playerId,
    correct_answer: playerId, // Player pick is "correct" if they played
    base_points: Math.round(baseScore),
    multiplier: slotMultiplier,
    final_points: finalScore,
    is_correct: true, // Player participated
    details: {
      player_stats: playerStats,
      score_breakdown: baseScoreBreakdown,
      slot_number: question.slot?.slotNumber,
    },
  };
}

/**
 * Score a SIDE_BET question
 *
 * Points if correct, pointsWrong (can be negative) if incorrect.
 */
function scoreSideBetQuestion(
  question: Question,
  userAnswer: string | null,
  matchResult: MatchResult
): QuestionScoreBreakdown {
  const correctAnswer = matchResult.side_bet_answers?.[question.question_id];

  if (userAnswer === null) {
    return {
      question_id: question.question_id,
      kind: 'SIDE_BET',
      user_answer: null,
      correct_answer: correctAnswer,
      base_points: 0,
      multiplier: 1,
      final_points: 0,
      is_correct: false,
      details: { reason: 'NO_ANSWER' },
    };
  }

  const isCorrect = userAnswer === correctAnswer;
  const points = isCorrect ? question.points : (question.points_wrong || 0);

  return {
    question_id: question.question_id,
    kind: 'SIDE_BET',
    user_answer: userAnswer,
    correct_answer: correctAnswer,
    base_points: points,
    multiplier: 1,
    final_points: points,
    is_correct: isCorrect,
  };
}

// =============================================================================
// MAIN SCORING FUNCTIONS
// =============================================================================

/**
 * Score a single user's bet for a match
 *
 * @param bet - User's bet with answers
 * @param questions - Questions for the match
 * @param matchResult - Match result with correct answers
 * @param ruleVersion - Optional rule version (defaults to Constitution v1)
 * @returns Complete score breakdown for the bet
 */
export function scoreMatchBet(
  bet: UserBet,
  questions: Question[],
  matchResult: MatchResult,
  ruleVersion: RuleVersion = DEFAULT_RULE_VERSION
): BetScoreBreakdown {
  const questionScores: QuestionScoreBreakdown[] = [];

  for (const question of questions) {
    // Skip disabled questions
    if (question.disabled || question.status !== 'active') {
      continue;
    }

    const userAnswer = bet.answers[question.question_id] ?? null;

    let scoreBreakdown: QuestionScoreBreakdown;

    switch (question.kind) {
      case 'WINNER':
        scoreBreakdown = scoreWinnerQuestion(
          question,
          userAnswer as string | null,
          matchResult
        );
        break;

      case 'TOTAL_RUNS':
        scoreBreakdown = scoreTotalRunsQuestion(
          question,
          userAnswer as number | null,
          matchResult
        );
        break;

      case 'PLAYER_PICK':
        scoreBreakdown = scorePlayerPickQuestion(
          question,
          userAnswer as string | null,
          matchResult,
          ruleVersion
        );
        break;

      case 'SIDE_BET':
        scoreBreakdown = scoreSideBetQuestion(
          question,
          userAnswer as string | null,
          matchResult
        );
        break;

      default:
        // Unknown question type - skip with 0 points
        scoreBreakdown = {
          question_id: question.question_id,
          kind: question.kind,
          user_answer: userAnswer,
          correct_answer: null,
          base_points: 0,
          multiplier: 1,
          final_points: 0,
          is_correct: false,
          details: { reason: 'UNKNOWN_QUESTION_TYPE' },
        };
    }

    questionScores.push(scoreBreakdown);
  }

  // Calculate total score
  const totalScore = questionScores.reduce(
    (sum, qs) => sum + qs.final_points,
    0
  );

  return {
    bet_id: bet.bet_id,
    user_id: bet.user_id,
    match_id: bet.match_id,
    question_scores: questionScores,
    total_score: totalScore,
    scored_at: new Date(),
  };
}

/**
 * Score all bets for a match
 *
 * Fetches all locked bets and questions for the match,
 * calculates scores, and updates the bets table.
 *
 * @param matchId - The match ID to score
 * @param matchResult - Match result with correct answers
 * @returns Array of score breakdowns for all bets
 */
export async function scoreBetsForMatch(
  matchId: string,
  matchResult: MatchResult
): Promise<BetScoreBreakdown[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Fetch all locked bets for this match
  const { data: bets, error: betsError } = await supabaseAdmin
    .from('bets')
    .select('*')
    .eq('match_id', matchId)
    .eq('is_locked', true);

  if (betsError) {
    throw new Error(`Failed to fetch bets: ${betsError.message}`);
  }

  if (!bets || bets.length === 0) {
    return [];
  }

  // Fetch questions for this match
  const { data: questions, error: questionsError } = await supabaseAdmin
    .from('match_questions')
    .select('*')
    .eq('match_id', matchId)
    .eq('status', 'active')
    .eq('disabled', false);

  if (questionsError) {
    throw new Error(`Failed to fetch questions: ${questionsError.message}`);
  }

  if (!questions || questions.length === 0) {
    return [];
  }

  // Score each bet
  const scoreBreakdowns: BetScoreBreakdown[] = [];

  for (const bet of bets) {
    const breakdown = scoreMatchBet(
      bet as UserBet,
      questions as Question[],
      matchResult
    );
    scoreBreakdowns.push(breakdown);

    // Update the bet with the calculated score
    const { error: updateError } = await supabaseAdmin
      .from('bets')
      .update({ score: breakdown.total_score })
      .eq('bet_id', bet.bet_id);

    if (updateError) {
      console.error(`Failed to update bet ${bet.bet_id}: ${updateError.message}`);
    }
  }

  return scoreBreakdowns;
}

/**
 * Get or create match result from database
 *
 * @param matchId - Match ID
 * @returns Match result or null if not found
 */
export async function getMatchResult(
  matchId: string
): Promise<MatchResult | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('match_results')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch match result: ${error.message}`);
  }

  return data as MatchResult;
}

/**
 * Save match result to database
 *
 * @param matchResult - Match result to save
 */
export async function saveMatchResult(
  matchResult: MatchResult
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabaseAdmin
    .from('match_results')
    .upsert(matchResult, { onConflict: 'match_id' });

  if (error) {
    throw new Error(`Failed to save match result: ${error.message}`);
  }
}

/**
 * Complete workflow: Save match result, score all bets, and trigger leaderboard update
 *
 * @param matchId - Match ID
 * @param matchResult - Match result with correct answers
 * @param eventId - Event ID for leaderboard update
 * @returns Array of score breakdowns
 */
export async function processMatchScoring(
  matchId: string,
  matchResult: MatchResult,
  eventId: string
): Promise<BetScoreBreakdown[]> {
  // Save match result
  await saveMatchResult(matchResult);

  // Score all bets
  const breakdowns = await scoreBetsForMatch(matchId, matchResult);

  // Return breakdowns (leaderboard update should be called separately)
  return breakdowns;
}
