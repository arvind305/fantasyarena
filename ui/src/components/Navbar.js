import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getAdminEmail } from "../config";

// Streamlined 5-item navigation
const links = [
  { to: "/play", label: "Play" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/stats", label: "Stats" },
  { to: "/teams", label: "Teams" },
  { to: "/profile", label: "Profile" },
];

// Secondary links accessible from within pages or mobile menu
const moreLinks = [
  { to: "/schedule", label: "Schedule" },
  { to: "/players", label: "Players" },
  { to: "/groups", label: "Groups" },
  { to: "/rules", label: "Rules" },
  { to: "/faq", label: "FAQ" },
  { to: "/about", label: "About" },
];

// Admin links (only visible to admins)
const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", description: "Overview & match management" },
  { to: "/schedule", label: "Match Builder", description: "Select a match to configure questions", isMatchPicker: true },
  { to: "/schedule", label: "Match Results", description: "Select a match to enter results", isResultsPicker: true },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const adminDropdownRef = useRef(null);
  const location = useLocation();
  const { user, signIn, signOut } = useAuth();
  const adminEmail = getAdminEmail();
  const isAdmin = user && adminEmail && user.email?.trim().toLowerCase() === adminEmail;

  // Close admin dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setAdminDropdownOpen(false);
  }, [location.pathname]);

  // Check if current path is an admin page
  const isAdminPage = location.pathname.startsWith("/admin");

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

        {/* Desktop nav - 5 items */}
        <div className="hidden lg:flex items-center gap-0.5">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-gray-800 shrink-0">
          {isAdmin && (
            <div className="relative" ref={adminDropdownRef}>
              <button
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                  isAdminPage
                    ? "text-amber-400 bg-amber-900/30"
                    : "text-amber-500 hover:text-amber-400 bg-amber-900/20"
                }`}
              >
                Admin
                <svg
                  className={`w-3 h-3 transition-transform ${adminDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Admin Dropdown Menu */}
              {adminDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2 bg-amber-900/20 border-b border-amber-700/30">
                    <span className="text-xs text-amber-500 font-semibold uppercase tracking-wide">Admin Panel</span>
                  </div>

                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="block px-3 py-2.5 hover:bg-gray-800 transition-colors border-b border-gray-800"
                  >
                    <div className="text-sm text-gray-200 font-medium">Dashboard</div>
                    <div className="text-xs text-gray-500">View all matches, generate questions, publish</div>
                  </NavLink>

                  <div className="px-3 py-2 bg-gray-800/30 border-b border-gray-800">
                    <div className="text-xs text-gray-400 font-medium mb-1">Per-Match Actions</div>
                    <div className="text-xs text-gray-500">From Dashboard, click on any match:</div>
                  </div>

                  <div className="px-3 py-2 border-b border-gray-800 hover:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                      <span className="text-sm text-gray-300">Builder</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-4">Configure betting questions</div>
                  </div>

                  <div className="px-3 py-2 border-b border-gray-800 hover:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span className="text-sm text-gray-300">Results</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-4">Enter scores & calculate points</div>
                  </div>

                  <NavLink
                    to="/leaderboard"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="block px-3 py-2.5 hover:bg-gray-800 transition-colors"
                  >
                    <div className="text-sm text-gray-200">Leaderboard</div>
                    <div className="text-xs text-gray-500">View rankings after scoring</div>
                  </NavLink>
                </div>
              )}
            </div>
          )}
          {user ? (
            <>
              {user.avatar && (
                <img src={user.avatar} alt="" className="w-7 h-7 rounded-full ring-2 ring-brand-600/40" referrerPolicy="no-referrer" />
              )}
              <span className="text-sm text-gray-300 max-w-[100px] truncate">
                {user.name || user.email}
              </span>
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
          {/* Primary navigation */}
          {links.map((l) => (
            <NavLink
              key={l.to} to={l.to}
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

          {/* Divider and More links */}
          <div className="border-t border-gray-700/50 mt-1 pt-1">
            <div className="px-6 py-2 text-xs text-gray-600 uppercase tracking-wide">More</div>
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

          {/* Mobile admin section */}
          {isAdmin && (
            <div className="border-t border-amber-900/30 mt-1 pt-1 bg-amber-900/5">
              <div className="px-6 py-2 text-xs text-amber-600 uppercase tracking-wide font-semibold">Admin</div>
              <NavLink
                to="/admin/dashboard"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-6 py-3 text-sm font-medium border-b border-gray-800/50 ${
                    isActive ? "bg-amber-600/10 text-amber-300" : "text-amber-500"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <div className="px-6 py-2 border-b border-gray-800/50">
                <div className="text-xs text-gray-500">Access Match Builder & Match Results from Dashboard</div>
              </div>
            </div>
          )}

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
