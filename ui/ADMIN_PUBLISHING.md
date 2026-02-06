# Admin Publishing Guide

This document explains how the Admin Dashboard publishes questions to the canonical `questions.json` store.

## Architecture Overview

The Fantasy Arena UI operates without a traditional backend database. Instead:

1. **Draft questions** are stored in-memory via `QuestionStore.js` during the admin session
2. **Published questions** are persisted in `ui/public/data/questions.json`
3. Publishing commits this file to GitHub, which triggers a Vercel redeploy

## Why vercel.json needs /api exception

The `vercel.json` file contains rewrite rules for the SPA (Single Page Application):

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**The order matters:**
1. First rule: Routes `/api/*` requests to Vercel Serverless Functions
2. Second rule: Routes everything else to `index.html` for React Router

Without the first rule, all API calls would return the React app HTML instead of executing the serverless function.

## Required Environment Variables

Configure these in Vercel Project Settings > Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | Personal Access Token with `repo` scope |
| `GITHUB_OWNER` | Yes | GitHub username or organization name |
| `GITHUB_REPO` | Yes | Repository name (e.g., `fantasy-arena`) |
| `GITHUB_BRANCH` | No | Branch to commit to (default: `main`) |
| `QUESTIONS_PATH` | No | Path to questions.json (default: `ui/public/data/questions.json`) |

### Creating a GitHub Personal Access Token

1. Go to GitHub Settings > Developer Settings > Personal Access Tokens > Fine-grained tokens
2. Create a new token with:
   - Repository access: Select your repository
   - Permissions: Contents (Read and Write)
3. Copy the token and add it to Vercel as `GITHUB_TOKEN`

## How to Test Locally

### 1. Start the development server

```bash
cd ui
npm start
```

### 2. Access the Admin Dashboard

Navigate to `http://localhost:3000/admin/dashboard` (requires admin login).

### 3. Generate questions

- Click "Gen Standard" to generate standard betting questions for a match
- Click "Pick N Side" to auto-select side bets from the library

### 4. Test publish (local method)

Since the serverless function requires GitHub credentials, use the local script for development:

```bash
# First, export the draft questions to a file (from browser console)
# Then use the local publish script:
node ui/scripts/publishQuestionsLocal.js ./my-questions.json
```

### 5. Test publish (with API)

If you have GitHub credentials configured locally (in `.env` or exported):

```bash
# Create .env.local in ui/ folder
GITHUB_TOKEN=your_token_here
GITHUB_OWNER=your_username
GITHUB_REPO=your_repo
```

Then the "Publish" button should work when running with `vercel dev`.

## What Happens if Environment Variables are Missing

When the Publish button is clicked and environment variables are not configured:

1. The serverless function returns a 500 error with `code: "ENV_MISSING"`
2. The Admin Dashboard displays a red banner explaining the missing configuration
3. The Publish buttons are disabled to prevent repeated failed attempts

**Error message example:**
```
Missing GITHUB_TOKEN environment variable. Configure in Vercel project settings.
```

## Publishing Flow

When you click "Publish" for a match:

1. Dashboard reads current draft questions from `QuestionStore`
2. Merges draft into existing published questions (preserves other matches)
3. Sends POST to `/api/publishQuestions` with full canonical JSON
4. Serverless function:
   - Fetches existing `questions.json` from GitHub to get its SHA
   - Creates a commit with the new content
   - Returns success with commit SHA
5. Dashboard updates local state to reflect published status

## Troubleshooting

### "Publish endpoint not available"
- Check that `vercel.json` has the `/api` rewrite rule
- Ensure you're running `vercel dev` (not just `npm start`) for API routes

### "GitHub commit failed: 401"
- Your `GITHUB_TOKEN` is invalid or expired
- Regenerate the token with correct permissions

### "GitHub commit failed: 404"
- Check `GITHUB_OWNER` and `GITHUB_REPO` are correct
- Ensure the token has access to the repository

### "Cannot publish: no matches contain questions"
- Generate questions first using "Gen Standard" button
- Questions are stored in-memory until published

## File Locations

| File | Purpose |
|------|---------|
| `ui/src/pages/AdminDashboard.js` | Admin dashboard UI |
| `ui/api/publishQuestions.js` | Vercel serverless function |
| `ui/scripts/publishQuestionsLocal.js` | Local dev publish script |
| `ui/public/data/questions.json` | Canonical published questions |
| `ui/src/mock/QuestionStore.js` | In-memory draft store |
