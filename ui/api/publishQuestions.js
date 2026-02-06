/**
 * Vercel Serverless Function: POST /api/publishQuestions
 *
 * Publishes questions.json to GitHub via Contents API.
 *
 * Required environment variables:
 *   - GITHUB_TOKEN: Personal access token with repo write permissions
 *   - GITHUB_OWNER: GitHub username or organization
 *   - GITHUB_REPO: Repository name
 *   - GITHUB_BRANCH: Branch to commit to (default: "main")
 *   - QUESTIONS_PATH: Path to questions.json relative to ui/ root (default: "public/data/questions.json")
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Check required env vars
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const questionsPath = process.env.QUESTIONS_PATH || "ui/public/data/questions.json";

  if (!token) {
    return res.status(500).json({
      error: "Missing GITHUB_TOKEN environment variable. Configure in Vercel project settings.",
      code: "ENV_MISSING",
    });
  }
  if (!owner) {
    return res.status(500).json({
      error: "Missing GITHUB_OWNER environment variable. Configure in Vercel project settings.",
      code: "ENV_MISSING",
    });
  }
  if (!repo) {
    return res.status(500).json({
      error: "Missing GITHUB_REPO environment variable. Configure in Vercel project settings.",
      code: "ENV_MISSING",
    });
  }

  // Parse request body
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { questionsJson, meta } = body;

  // Validate input
  if (!questionsJson) {
    return res.status(400).json({ error: "Missing questionsJson in request body" });
  }

  if (!questionsJson.questionsByMatch || typeof questionsJson.questionsByMatch !== "object") {
    return res.status(400).json({ error: "questionsJson must contain questionsByMatch object" });
  }

  // Prevent publishing empty questions
  const matchIds = Object.keys(questionsJson.questionsByMatch);
  if (matchIds.length === 0) {
    return res.status(400).json({ error: "Cannot publish empty questions. At least one match must have questions." });
  }

  // Validate that at least one match has questions
  const hasQuestions = matchIds.some(
    (id) => Array.isArray(questionsJson.questionsByMatch[id]) && questionsJson.questionsByMatch[id].length > 0
  );
  if (!hasQuestions) {
    return res.status(400).json({ error: "Cannot publish: no matches contain questions." });
  }

  try {
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${questionsPath}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "FantasyArena-Publish",
    };

    // Step 1: GET existing file to get sha
    let sha = null;
    const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers });

    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    } else if (getRes.status !== 404) {
      // 404 is OK (file doesn't exist yet), other errors are not
      const errorText = await getRes.text();
      console.error("[publishQuestions] GitHub GET error:", getRes.status, errorText);
      return res.status(500).json({
        error: `GitHub API error: ${getRes.status}`,
        details: errorText,
      });
    }

    // Step 2: Prepare content (base64 encoded)
    const content = JSON.stringify(questionsJson, null, 2);
    const contentBase64 = Buffer.from(content, "utf-8").toString("base64");

    // Step 3: Build commit message
    const matchId = meta?.matchId || "bulk";
    const timestamp = new Date().toISOString();
    const commitMessage = `Update questions.json - Match ${matchId} @ ${timestamp}`;

    // Step 4: PUT updated content
    const putBody = {
      message: commitMessage,
      content: contentBase64,
      branch,
    };
    if (sha) {
      putBody.sha = sha;
    }

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers,
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const errorText = await putRes.text();
      console.error("[publishQuestions] GitHub PUT error:", putRes.status, errorText);
      return res.status(500).json({
        error: `GitHub commit failed: ${putRes.status}`,
        details: errorText,
      });
    }

    const result = await putRes.json();
    const commitSha = result.commit?.sha || null;

    return res.status(200).json({
      ok: true,
      mode: "github",
      publishedAt: timestamp,
      commitSha,
      matchId,
    });
  } catch (err) {
    console.error("[publishQuestions] Unexpected error:", err);
    return res.status(500).json({
      error: "Unexpected error during publish",
      details: err.message,
    });
  }
}
