import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Secondary navigation links
const MORE_LINKS = [
  { to: "/schedule", label: "Schedule", icon: "📅", desc: "Full tournament schedule" },
  { to: "/players", label: "Players", icon: "👤", desc: "Browse all players" },
  { to: "/groups", label: "Groups", icon: "👥", desc: "Your private leagues" },
  { to: "/rules", label: "Rules", icon: "📖", desc: "How the game works" },
  { to: "/faq", label: "FAQ", icon: "❓", desc: "Common questions" },
  { to: "/about", label: "About", icon: "ℹ️", desc: "About Fantasy Arena" },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const identity = resolveIdentity(user);

  // Leaderboard stats
  const [rank, setRank] = useState(null);
  const [totalScore, setTotalScore] = useState(null);
  const [matchesPlayed, setMatchesPlayed] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Display name editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState(identity.displayName);

  // Recent bets
  const [recentBets, setRecentBets] = useState([]);
  const [betsLoading, setBetsLoading] = useState(true);

  // Fetch leaderboard stats for this user
  const fetchStats = useCallback(async () => {
    if (!user?.userId || !supabase || !isSupabaseConfigured()) {
      setStatsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("total_score, matches_played, rank, display_name")
        .eq("user_id", user.userId)
        .maybeSingle();

      if (error) {
        console.warn("[Profile] Error fetching leaderboard stats:", error.message);
      } else if (data) {
        setRank(data.rank);
        setTotalScore(data.total_score || 0);
        setMatchesPlayed(data.matches_played || 0);
        if (data.display_name) {
          setCurrentDisplayName(data.display_name);
        }
      }
    } catch (err) {
      console.warn("[Profile] Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [user?.userId]);

  // Fetch recent bets (last 5 scored matches)
  const fetchRecentBets = useCallback(async () => {
    if (!user?.userId || !supabase || !isSupabaseConfigured()) {
      setBetsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("bets")
        .select("match_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points, submitted_at, is_locked")
        .eq("user_id", user.userId)
        .order("submitted_at", { ascending: false })
        .limit(5);

      if (error) {
        console.warn("[Profile] Error fetching recent bets:", error.message);
      } else {
        setRecentBets(data || []);
      }
    } catch (err) {
      console.warn("[Profile] Error fetching bets:", err);
    } finally {
      setBetsLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchStats();
    fetchRecentBets();
  }, [fetchStats, fetchRecentBets]);

  // Display name editing handlers
  const startEditing = () => {
    setNameInput(currentDisplayName);
    setEditingName(true);
    setNameError("");
    setNameSuccess(false);
  };

  const cancelEditing = () => {
    setEditingName(false);
    setNameError("");
    setNameSuccess(false);
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("Name cannot be empty.");
      return;
    }
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 30) {
      setNameError("Name must be 30 characters or less.");
      return;
    }
    if (trimmed === currentDisplayName) {
      setEditingName(false);
      return;
    }

    setNameSaving(true);
    setNameError("");
    setNameSuccess(false);

    try {
      if (!supabase || !isSupabaseConfigured()) {
        throw new Error("Database not configured.");
      }

      // Update users table
      const { error: usersError } = await supabase
        .from("users")
        .update({ display_name: trimmed })
        .eq("user_id", user.userId);

      if (usersError) {
        throw new Error(usersError.message);
      }

      // Update leaderboard table
      await supabase
        .from("leaderboard")
        .update({ display_name: trimmed })
        .eq("user_id", user.userId);

      // Update group_members table too (for group leaderboards)
      await supabase
        .from("group_members")
        .update({ display_name: trimmed })
        .eq("user_id", user.userId);

      setCurrentDisplayName(trimmed);
      setEditingName(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      console.error("[Profile] Error saving name:", err);
      setNameError(err.message || "Failed to save name.");
    } finally {
      setNameSaving(false);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") saveName();
    if (e.key === "Escape") cancelEditing();
  };

  // Format match ID for display (wc_m1 -> Match 1)
  const formatMatchId = (matchId) => {
    if (!matchId) return matchId;
    const num = matchId.replace(/^wc_m/, "");
    return `Match ${num}`;
  };

  // Logged out state
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-fade-in mb-8">
          <h1 className="text-3xl font-extrabold mb-1">
            <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-emerald-400 bg-clip-text text-transparent">
              Profile
            </span>
          </h1>
          <p className="text-gray-500">Your account and more.</p>
        </div>

        <div className="card text-center py-12 mb-8">
          <div className="text-5xl mb-4">👤</div>
          <p className="text-gray-400 text-lg mb-2">Sign in to view your profile</p>
          <p className="text-gray-600 text-sm">Use the Login button in the navbar to get started.</p>
        </div>

        <MoreSection />
      </div>
    );
  }

  // Logged in state
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-emerald-400 bg-clip-text text-transparent">
            Profile
          </span>
        </h1>
        <p className="text-gray-500">Your account and more.</p>
      </div>

      {/* Account Card */}
      <div className="card mb-6 animate-slide-up">
        <div className="flex items-center gap-4 mb-5">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="w-14 h-14 rounded-full ring-2 ring-brand-600/40"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-400">
              {currentDisplayName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* Editable display name */}
            {editingName ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  maxLength={30}
                  autoFocus
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-gray-100 text-lg font-bold focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 w-full sm:max-w-[220px]"
                />
                <button
                  onClick={saveName}
                  disabled={nameSaving}
                  className="px-2.5 py-1.5 rounded-lg text-sm font-medium bg-brand-600/20 border border-brand-700/50 text-brand-300 hover:bg-brand-600/30 transition-all disabled:opacity-50"
                >
                  {nameSaving ? "..." : "Save"}
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-2.5 py-1.5 rounded-lg text-sm font-medium bg-gray-700/30 border border-gray-600/50 text-gray-400 hover:bg-gray-700/50 transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-100 truncate">{currentDisplayName}</h2>
                <button
                  onClick={startEditing}
                  className="text-gray-500 hover:text-brand-400 transition-colors shrink-0"
                  title="Edit display name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                {nameSuccess && (
                  <span className="text-xs text-emerald-400 animate-fade-in">Saved</span>
                )}
              </div>
            )}
            {nameError && (
              <p className="text-red-400 text-xs mt-1">{nameError}</p>
            )}
            {user.email && <p className="text-gray-500 text-sm truncate">{user.email}</p>}
          </div>
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-900/20 border border-red-800/50 text-red-400 hover:bg-red-900/30 hover:border-red-700 transition-all shrink-0"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Rank & Score Card */}
      <div className="card mb-6 animate-slide-up" style={{ animationDelay: "30ms" }}>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Standing</h3>
        {statsLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rank !== null ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-300">#{rank}</div>
              <div className="text-xs text-gray-500 mt-1">Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{(totalScore || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">{matchesPlayed || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Matches</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-gray-500 text-sm">No ranked stats yet. Place bets to appear on the leaderboard.</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up" style={{ animationDelay: "60ms" }}>
        <Link
          to="/groups"
          className="card py-4 text-center hover:border-brand-700 transition-colors group"
        >
          <div className="text-2xl mb-1">👥</div>
          <p className="text-sm font-medium text-gray-200 group-hover:text-brand-300">My Groups</p>
        </Link>
        <Link
          to="/long-term-bets"
          className="card py-4 text-center hover:border-purple-700 transition-colors group"
        >
          <div className="text-2xl mb-1">🏆</div>
          <p className="text-sm font-medium text-gray-200 group-hover:text-purple-300">Predictions</p>
        </Link>
        <Link
          to="/play"
          className="card py-4 text-center hover:border-emerald-700 transition-colors group"
        >
          <div className="text-2xl mb-1">🎮</div>
          <p className="text-sm font-medium text-gray-200 group-hover:text-emerald-300">Play</p>
        </Link>
      </div>

      {/* Recent Bets */}
      <div className="card mb-6 animate-slide-up" style={{ animationDelay: "90ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Bets</h3>
          <Link
            to="/stats?tab=history"
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            View all
          </Link>
        </div>
        {betsLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentBets.length > 0 ? (
          <div className="space-y-2">
            {recentBets.map((bet) => (
              <div
                key={bet.match_id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-200">
                    {formatMatchId(bet.match_id)}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {bet.submitted_at
                      ? new Date(bet.submitted_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </span>
                </div>
                <div className="text-right shrink-0 ml-3">
                  {bet.score !== null && bet.score !== undefined ? (
                    <span
                      className={`text-sm font-bold ${
                        bet.score > 0
                          ? "text-emerald-400"
                          : bet.score < 0
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      {bet.score > 0 ? "+" : ""}
                      {bet.score.toLocaleString()} pts
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-500/80 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No bets placed yet.</p>
            <Link
              to="/play"
              className="text-brand-400 hover:text-brand-300 text-sm mt-1 inline-block transition-colors"
            >
              Place your first bet
            </Link>
          </div>
        )}
      </div>

      {/* Stats Link */}
      <Link
        to="/stats"
        className="card mb-8 flex items-center gap-4 hover:border-brand-700 transition-colors group animate-slide-up"
        style={{ animationDelay: "120ms" }}
      >
        <div className="w-10 h-10 rounded-lg bg-cyan-900/30 flex items-center justify-center text-xl shrink-0">
          📊
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-200 group-hover:text-brand-300">View Full Stats</h3>
          <p className="text-gray-500 text-sm">Detailed breakdowns, bet history, and performance</p>
        </div>
        <span className="text-gray-500 group-hover:text-brand-400 transition-colors text-lg">
          &rarr;
        </span>
      </Link>

      {/* More Section */}
      <MoreSection />
    </div>
  );
}

function MoreSection() {
  return (
    <div className="animate-slide-up" style={{ animationDelay: "150ms" }}>
      <h3 className="text-lg font-semibold text-gray-300 mb-4">More</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {MORE_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="card hover:border-brand-700 transition-colors group py-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{link.icon}</span>
              <div>
                <h4 className="font-medium text-gray-200 group-hover:text-brand-300 transition-colors">
                  {link.label}
                </h4>
                <p className="text-gray-500 text-xs">{link.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
