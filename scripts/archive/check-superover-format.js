/**
 * check-superover-format.js
 * Diagnostic script to find "super over" option ID mismatches between:
 *   - match_questions (option IDs in the options JSONB array)
 *   - match_results (winner column)
 *   - bets (answers JSONB values)
 *
 * The known issue: seed-all-questions.js uses "superover" (no underscore)
 * while score-m13.js and fix-bet-formats.js use "super_over" (with underscore).
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load env: root .env first, then ui/.env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'ui', '.env') });

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing env vars. Need REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key);

(async () => {
  console.log('=== SUPER OVER FORMAT CHECK ===\n');

  // -------------------------------------------------------
  // 1. Check match_questions for any options containing "super"
  // -------------------------------------------------------
  console.log('--- 1. match_questions: options containing "super" ---');
  const { data: questions, error: qErr } = await sb
    .from('match_questions')
    .select('match_id, question_id, kind, options')
    .eq('kind', 'WINNER');

  if (qErr) {
    console.error('Error querying match_questions:', qErr.message);
  } else {
    let superOverOptions = [];
    for (const q of (questions || [])) {
      const opts = q.options || [];
      for (const opt of opts) {
        const optId = (opt.optionId || '').toLowerCase();
        const label = (opt.label || '').toLowerCase();
        if (optId.includes('super') || label.includes('super')) {
          superOverOptions.push({
            match_id: q.match_id,
            question_id: q.question_id,
            optionId: opt.optionId,
            label: opt.label,
          });
        }
      }
    }

    if (superOverOptions.length === 0) {
      console.log('  No super over options found in any match_questions.');
    } else {
      console.log('  Found ' + superOverOptions.length + ' super over option(s):');
      for (const o of superOverOptions) {
        console.log('    ' + o.match_id + ' | question=' + o.question_id + ' | optionId="' + o.optionId + '" | label="' + o.label + '"');
      }
    }

    // Check for format consistency
    const withUnderscore = superOverOptions.filter(o => o.optionId.includes('super_over'));
    const withoutUnderscore = superOverOptions.filter(o => o.optionId.includes('superover') && !o.optionId.includes('super_over'));
    console.log('\n  Format breakdown:');
    console.log('    "super_over" (with underscore): ' + withUnderscore.length);
    console.log('    "superover" (no underscore):    ' + withoutUnderscore.length);
  }

  // -------------------------------------------------------
  // 2. Check match_results for any winner values containing "super"
  // -------------------------------------------------------
  console.log('\n--- 2. match_results: winner values containing "super" ---');
  const { data: results, error: rErr } = await sb
    .from('match_results')
    .select('match_id, winner');

  if (rErr) {
    console.error('Error querying match_results:', rErr.message);
  } else {
    const superResults = (results || []).filter(r =>
      r.winner && r.winner.toLowerCase().includes('super')
    );

    if (superResults.length === 0) {
      console.log('  No match results with "super" in winner field.');
    } else {
      console.log('  Found ' + superResults.length + ' match result(s) with super over winner:');
      for (const r of superResults) {
        console.log('    ' + r.match_id + ' | winner="' + r.winner + '"');

        // Cross-check: does the winner value match the question option?
        const matchQ = (questions || []).find(q => q.match_id === r.match_id && q.kind === 'WINNER');
        if (matchQ) {
          const matchingOpt = (matchQ.options || []).find(o => o.optionId === r.winner);
          const fuzzyOpt = (matchQ.options || []).find(o =>
            o.optionId.toLowerCase().replace(/_/g, '') === r.winner.toLowerCase().replace(/_/g, '')
          );
          if (matchingOpt) {
            console.log('      EXACT MATCH with question option: "' + matchingOpt.optionId + '"');
          } else if (fuzzyOpt) {
            console.log('      MISMATCH: No exact match, but fuzzy match found: "' + fuzzyOpt.optionId + '"');
            console.log('      *** THIS IS THE BUG *** - result winner uses different format than question optionId');
          } else {
            console.log('      NO MATCH at all with any question option');
          }
        } else {
          console.log('      No WINNER question found for this match');
        }
      }
    }
  }

  // -------------------------------------------------------
  // 3. Check bets for any answer values containing "super"
  // -------------------------------------------------------
  console.log('\n--- 3. bets: answer values containing "super" ---');
  const { data: bets, error: bErr } = await sb
    .from('bets')
    .select('bet_id, match_id, user_id, answers');

  if (bErr) {
    console.error('Error querying bets:', bErr.message);
  } else {
    let superBets = [];
    for (const bet of (bets || [])) {
      const answers = bet.answers || {};
      for (const [qid, val] of Object.entries(answers)) {
        if (typeof val === 'string' && val.toLowerCase().includes('super')) {
          superBets.push({
            match_id: bet.match_id,
            user_id: bet.user_id,
            question_id: qid,
            answer: val,
          });
        }
      }
    }

    if (superBets.length === 0) {
      console.log('  No bets with "super" in answer values.');
    } else {
      console.log('  Found ' + superBets.length + ' bet answer(s) containing "super":');
      for (const b of superBets) {
        console.log('    ' + b.match_id + ' | user=' + b.user_id.slice(0, 8) + '... | question=' + b.question_id + ' | answer="' + b.answer + '"');

        // Cross-check with the question options
        const matchQ = (questions || []).find(q => q.match_id === b.match_id && q.question_id === b.question_id);
        if (matchQ) {
          const exactOpt = (matchQ.options || []).find(o => o.optionId === b.answer);
          if (exactOpt) {
            console.log('      Matches question option exactly: "' + exactOpt.optionId + '"');
          } else {
            const fuzzyOpt = (matchQ.options || []).find(o =>
              o.optionId.toLowerCase().replace(/_/g, '') === b.answer.toLowerCase().replace(/_/g, '')
            );
            if (fuzzyOpt) {
              console.log('      MISMATCH: bet answer "' + b.answer + '" vs question option "' + fuzzyOpt.optionId + '"');
            } else {
              console.log('      NO matching option found in question');
            }
          }
        }

        // Cross-check with match result
        const matchR = (results || []).find(r => r.match_id === b.match_id);
        if (matchR && matchR.winner) {
          if (b.answer === matchR.winner) {
            console.log('      EXACT match with match_result.winner: "' + matchR.winner + '"');
          } else {
            const norm = s => s.toLowerCase().replace(/_/g, '');
            if (norm(b.answer) === norm(matchR.winner)) {
              console.log('      FUZZY match with match_result.winner: "' + matchR.winner + '" (differs by underscore)');
            } else {
              console.log('      Different from match_result.winner: "' + matchR.winner + '"');
            }
          }
        }
      }
    }

    // Summary: format breakdown of bet answers
    const withUnderscore = superBets.filter(b => b.answer.includes('super_over'));
    const withoutUnderscore = superBets.filter(b => b.answer.includes('superover') && !b.answer.includes('super_over'));
    console.log('\n  Bet answer format breakdown:');
    console.log('    "super_over" (with underscore): ' + withUnderscore.length);
    console.log('    "superover" (no underscore):    ' + withoutUnderscore.length);
  }

  // -------------------------------------------------------
  // 4. RPC Analysis Summary
  // -------------------------------------------------------
  console.log('\n--- 4. RPC ANALYSIS ---');
  console.log('The scoring RPC (calculate_match_scores) has TWO comparisons for winner scoring:');
  console.log('');
  console.log('  A. Finding the user\'s selected option (line ~191):');
  console.log('     IF v_opt.optionId = v_user_answer');
  console.log('     -> This compares option IDs from match_questions with the bet answer value.');
  console.log('     -> If bet has "super_over" but question has "superover", the user\'s pick is NOT FOUND.');
  console.log('');
  console.log('  B. Checking if user\'s option matches the winner (line ~193):');
  console.log('     IF v_opt.optionId = v_match_result.winner');
  console.log('     -> This compares question option IDs with match_results.winner.');
  console.log('     -> If question has "superover" but result has "super_over", NOT matched.');
  console.log('');
  console.log('  C. Super over detection (lines ~199-200):');
  console.log('     IF LOWER(v_opt.optionId) LIKE \'%super%over%\'');
  console.log('     -> This IS safe - the LIKE pattern matches both formats.');
  console.log('');
  console.log('  The bug is in comparisons A and B: exact string matching without normalization.');

  console.log('\n=== DONE ===');
})();
