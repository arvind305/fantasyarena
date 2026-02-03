import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const links = [
  { to: "/", label: "Home" },
  { to: "/schedule", label: "Schedule" },
  { to: "/long-term-bets", label: "Predictions" },
  { to: "/teams", label: "Teams" },
  { to: "/players", label: "Players" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/groups", label: "Groups" },
];

const moreLinks = [
  { to: "/rules", label: "Rules" },
  { to: "/faq", label: "FAQ" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signIn, signOut } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-brand-600/20 text-brand-300"
        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
    }`;

  return (
    <nav className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 group shrink-0">
          <span className="text-2xl">{"\u26A1"}</span>
          <span className="text-lg font-bold bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">
            Fantasy Arena
          </span>
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-gray-800 shrink-0">
          {user ? (
            <>
              {user.avatar && (
                <img src={user.avatar} alt="" className="w-7 h-7 rounded-full ring-2 ring-brand-600/40" referrerPolicy="no-referrer" />
              )}
              <NavLink to="/profile" className="text-sm text-gray-300 max-w-[100px] truncate hover:text-brand-300">
                {user.name || user.email}
              </NavLink>
              <button onClick={signOut} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <button onClick={signIn} className="text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-all duration-200">
              Login
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-200"
          aria-label="Toggle menu"
        >
          {menuOpen ? "\u2715" : "\u2630"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-800 animate-slide-down max-h-[80vh] overflow-y-auto">
          {links.map((l) => (
            <NavLink
              key={l.to} to={l.to} end={l.to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-6 py-3 text-sm font-medium border-b border-gray-800/50 ${
                  isActive ? "bg-brand-600/10 text-brand-300" : "text-gray-400"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}

          <div className="border-t border-gray-700/50 mt-1 pt-1">
            {moreLinks.map((l) => (
              <NavLink
                key={l.to} to={l.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-6 py-3 text-sm font-medium border-b border-gray-800/50 ${
                    isActive ? "bg-brand-600/10 text-brand-300" : "text-gray-500"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile auth */}
          <div className="px-6 py-3 border-b border-gray-800/50">
            {user ? (
              <div className="flex items-center gap-3">
                {user.avatar && <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />}
                <NavLink to="/profile" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 truncate flex-1 hover:text-brand-300">
                  {user.name || user.email}
                </NavLink>
                <button onClick={() => { signOut(); setMenuOpen(false); }} className="text-xs text-gray-500 hover:text-gray-300">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => { signIn(); setMenuOpen(false); }} className="text-sm text-gray-400 hover:text-gray-200">
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
