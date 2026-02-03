import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./auth/AuthProvider";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
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
import Rules from "./pages/Rules";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import { trackAppOpen } from "./analytics";
import { ENGINE_MODE, IS_SHADOW_MODE, USE_LOCAL_ENGINE } from "./config";
import { startPolling } from "./shadow/poll";
import { initializeAdapter } from "./mock/ExternalDataAdapter";
import Spinner from "./components/Spinner";

trackAppOpen();
startPolling();

if (IS_SHADOW_MODE) {
  console.log(`[app] Running in SHADOW mode — bet submissions disabled, data polling active.`);
} else {
  console.log(`[app] Engine mode: ${ENGINE_MODE}`);
}

function App() {
  const [ready, setReady] = useState(!USE_LOCAL_ENGINE);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (USE_LOCAL_ENGINE) {
      initializeAdapter()
        .then(() => setReady(true))
        .catch((err) => {
          console.error("[app] Failed to load static data:", err);
          setError(err.message);
        });
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="card text-center max-w-md">
          <h1 className="text-xl font-bold text-red-400 mb-2">Failed to Load Data</h1>
          <p className="text-gray-400 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-500 mt-4">Loading tournament data...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
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
                <Route path="/rules" element={<Rules />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/about" element={<About />} />
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

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
