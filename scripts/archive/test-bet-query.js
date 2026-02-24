/**
 * Diagnostic: test if the bets query works with the anon key
 * (same setup as the frontend uses)
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://qvjsfovxdicgyzpwgzgc.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anNmb3Z4ZGljZ3l6cHdnemdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzA3MjAsImV4cCI6MjA4NjA0NjcyMH0.M7Jx7MdiaytiCTIFIow04Y8lY1SanRv7IPuir0BY9Bo";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function main() {
  // 1. First, get a sample user_id from bets (using service key would be ideal, but let's try anon)
  console.log("=== Test 1: Query all bets (anon key, limit 5) ===");
  const { data: allBets, error: allErr } = await supabase
    .from("bets")
    .select("bet_id, match_id, user_id")
    .limit(5);

  if (allErr) {
    console.log("ERROR querying bets:", allErr.message);
    console.log("Full error:", JSON.stringify(allErr, null, 2));
  } else {
    console.log("Got", allBets?.length, "bets");
    if (allBets?.length > 0) {
      console.log("Sample:", JSON.stringify(allBets[0], null, 2));
    } else {
      console.log("No bets returned — RLS may be blocking reads for anon role");
    }
  }

  // 2. If we got some data, try filtering by a specific user_id
  if (allBets?.length > 0) {
    const sampleUserId = allBets[0].user_id;
    console.log("\n=== Test 2: Query bets for user_id =", sampleUserId, "===");
    const { data: userBets, error: userErr } = await supabase
      .from("bets")
      .select("match_id")
      .eq("user_id", sampleUserId);

    if (userErr) {
      console.log("ERROR:", userErr.message);
    } else {
      console.log("Got", userBets?.length, "bets for this user");
      console.log("Match IDs:", userBets?.map(r => r.match_id).join(", "));
    }
  }

  // 3. Also check the users table to see what user_id format looks like
  console.log("\n=== Test 3: Sample from users table ===");
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("user_id, display_name")
    .limit(3);

  if (usersErr) {
    console.log("ERROR:", usersErr.message);
  } else {
    console.log("Users:", JSON.stringify(users, null, 2));
  }
}

main().catch(console.error);
