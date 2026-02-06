import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";

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
              {identity.displayName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-100 truncate">{identity.displayName}</h2>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up" style={{ animationDelay: "50ms" }}>
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

      {/* Stats Preview */}
      <Link
        to="/stats"
        className="card mb-8 flex items-center gap-4 hover:border-brand-700 transition-colors group animate-slide-up"
        style={{ animationDelay: "100ms" }}
      >
        <div className="w-10 h-10 rounded-lg bg-cyan-900/30 flex items-center justify-center text-xl shrink-0">
          📊
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-200 group-hover:text-brand-300">View Your Stats</h3>
          <p className="text-gray-500 text-sm">Performance analytics coming in Phase 3</p>
        </div>
        <span className="text-gray-500 group-hover:text-brand-400 transition-colors">→</span>
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
