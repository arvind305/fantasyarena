#!/usr/bin/env node
/**
 * Local dev helper script: publishQuestionsLocal.js
 *
 * Usage:
 *   node ui/scripts/publishQuestionsLocal.js <path_to_json>
 *
 * Overwrites ui/public/data/questions.json after minimal sanity validation.
 * This is for local development only. Production should use /api/publishQuestions.
 */

const fs = require("fs");
const path = require("path");

const QUESTIONS_PATH = path.resolve(__dirname, "../public/data/questions.json");

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: node ui/scripts/publishQuestionsLocal.js <path_to_json>");
    console.error("");
    console.error("Example:");
    console.error("  node ui/scripts/publishQuestionsLocal.js ./my-questions.json");
    process.exit(1);
  }

  const inputPath = args[0];

  // Resolve input path
  const resolvedInput = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(resolvedInput)) {
    console.error(`Error: File not found: ${resolvedInput}`);
    process.exit(1);
  }

  // Read and parse input JSON
  let data;
  try {
    const content = fs.readFileSync(resolvedInput, "utf-8");
    data = JSON.parse(content);
  } catch (err) {
    console.error(`Error: Failed to parse JSON: ${err.message}`);
    process.exit(1);
  }

  // Validate structure
  if (!data.questionsByMatch || typeof data.questionsByMatch !== "object") {
    console.error("Error: JSON must contain a 'questionsByMatch' object");
    process.exit(1);
  }

  const matchIds = Object.keys(data.questionsByMatch);
  if (matchIds.length === 0) {
    console.error("Error: questionsByMatch is empty. At least one match must have questions.");
    process.exit(1);
  }

  // Count questions
  let totalQuestions = 0;
  for (const matchId of matchIds) {
    const qs = data.questionsByMatch[matchId];
    if (!Array.isArray(qs)) {
      console.error(`Error: questionsByMatch["${matchId}"] must be an array`);
      process.exit(1);
    }
    totalQuestions += qs.length;
  }

  if (totalQuestions === 0) {
    console.error("Error: No questions found in any match.");
    process.exit(1);
  }

  // Write to destination
  try {
    const output = JSON.stringify(data, null, 2);
    fs.writeFileSync(QUESTIONS_PATH, output, "utf-8");
    console.log(`Success: Published ${totalQuestions} questions across ${matchIds.length} matches`);
    console.log(`Written to: ${QUESTIONS_PATH}`);
  } catch (err) {
    console.error(`Error: Failed to write file: ${err.message}`);
    process.exit(1);
  }
}

main();
