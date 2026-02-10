import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./auth/AuthProvider";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Play from "./pages/Play";
import Schedule from "./pages/Schedule";
import MatchBetting from "./pages/MatchBetting";
import LongTermBets from "./pages/LongTermBets";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Players from "./pages/Players";
import PlayerProfile from "./pages/PlayerProfile";
import Leaderboard from "./pages/Leaderboard";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Profile from "./pages/Profile";
import Stats from "./pages/Stats";
import Rules from "./pages/Rules";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import { trackAppOpen } from "./analytics";
import { ENGINE_MODE, IS_SHADOW_MODE } from "./config";
import { startPolling } from "./shadow/poll";
import Spinner from "./components/Spinner";
import AdminMatchResults from "./pages/AdminMatchResults";
import AdminDashboardV2 from "./pages/admin/AdminDashboardV2";
import MatchList from "./pages/admin/MatchList";
import MatchConfig from "./pages/admin/MatchConfig";
import LongTermConfig from "./pages/admin/LongTermConfig";
import ScoreMatch from "./pages/admin/ScoreMatch";
import InAppBrowserWarning from "./components/InAppBrowserWarning";
import { isSupabaseConfigured } from "./lib/supabase";

trackAppOpen();
startPolling();

// CRITICAL: Log configuration status for debugging
console.log("========================================");
console.log("[CONFIG] Fantasy Arena Startup Check");
console.log("========================================");
console.log("[CONFIG] Engine mode:", ENGINE_MODE);
console.log("[CONFIG] Supabase configured:", isSupabaseConfigured() ? "YES" : "NO - BETS WILL BE LOST!");
console.log("[CONFIG] Google Client ID:", process.env.REACT_APP_GOOGLE_CLIENT_ID ? "SET" : "MISSING");
if (!isSupabaseConfigured()) {
  console.error("[CONFIG] CRITICAL: Supabase is NOT configured. All bets will go to localStorage only!");
}
console.log("========================================");

if (IS_SHADOW_MODE) {
  console.log(`[app] Running in SHADOW mode — bet submissions disabled, data polling active.`);
}

// Load admin config before rendering
async function loadAdminConfig() {
  try {
    const res = await fetch("/data/admin.json");
    if (res.ok) {
      const data = await res.json();
      if (data.adminEmail) {
        window.__FA_ADMIN_EMAIL__ = data.adminEmail;
        console.log("[app] Admin email loaded from admin.json");
      }
    }
  } catch (err) {
    console.warn("[app] Failed to load admin.json, using env fallback:", err.message);
  }
  if (!window.__FA_ADMIN_EMAIL__) {
    window.__FA_ADMIN_EMAIL__ = "";
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <InAppBrowserWarning />
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/play" element={<Play />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/match/:matchId" element={<MatchBetting />} />
                <Route path="/long-term-bets" element={<LongTermBets />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/teams/:teamId" element={<TeamDetail />} />
                <Route path="/players" element={<Players />} />
                <Route path="/players/:playerId" element={<PlayerProfile />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/groups/:groupId" element={<GroupDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/about" element={<About />} />
                <Route path="/admin/match/:matchId" element={<MatchConfig />} />
                <Route path="/admin/match/:matchId/results" element={<AdminMatchResults />} />
                <Route path="/admin/dashboard" element={<AdminDashboardV2 />} />
                <Route path="/admin/matches" element={<MatchList />} />
                <Route path="/admin/long-term" element={<LongTermConfig />} />
                <Route path="/admin/score/:matchId" element={<ScoreMatch />} />
              </Routes>
            </main>
            <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
              Fantasy Arena — Built for friends, played with passion.
            </footer>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Wait for admin config before rendering
loadAdminConfig().then(() => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<App />);
});
