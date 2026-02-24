import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./auth/AuthProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import AdminGuard from "./components/AdminGuard";
import Navbar from "./components/Navbar";
import Spinner from "./components/Spinner";
import InAppBrowserWarning from "./components/InAppBrowserWarning";
import { trackAppOpen } from "./analytics";

// Eagerly load the most common pages
import Home from "./pages/Home";
import Play from "./pages/Play";

// Lazy load everything else
const Schedule = lazy(() => import("./pages/Schedule"));
const MatchBetting = lazy(() => import("./pages/MatchBetting"));
const LongTermBets = lazy(() => import("./pages/LongTermBets"));
const Teams = lazy(() => import("./pages/Teams"));
const TeamDetail = lazy(() => import("./pages/TeamDetail"));
const Players = lazy(() => import("./pages/Players"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Stats = lazy(() => import("./pages/Stats"));
const Rules = lazy(() => import("./pages/Rules"));
const FAQ = lazy(() => import("./pages/FAQ"));
const About = lazy(() => import("./pages/About"));

// Admin pages always lazy
const AdminDashboardV2 = lazy(() => import("./pages/admin/AdminDashboardV2"));
const MatchList = lazy(() => import("./pages/admin/MatchList"));
const MatchConfig = lazy(() => import("./pages/admin/MatchConfig"));
const LongTermConfig = lazy(() => import("./pages/admin/LongTermConfig"));
const ScoreMatch = lazy(() => import("./pages/admin/ScoreMatch"));
const MatchReport = lazy(() => import("./pages/admin/MatchReport"));

trackAppOpen();

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <InAppBrowserWarning />
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
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
                    <Route path="/admin/match/:matchId" element={<AdminGuard><MatchConfig /></AdminGuard>} />
                    <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboardV2 /></AdminGuard>} />
                    <Route path="/admin/matches" element={<AdminGuard><MatchList /></AdminGuard>} />
                    <Route path="/admin/long-term" element={<AdminGuard><LongTermConfig /></AdminGuard>} />
                    <Route path="/admin/score/:matchId" element={<AdminGuard><ScoreMatch /></AdminGuard>} />
                    <Route path="/admin/match/:matchId/report" element={<AdminGuard><MatchReport /></AdminGuard>} />
                  </Routes>
                </Suspense>
              </main>
              <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
                Super Selector — Built for friends, played with passion.
              </footer>
            </div>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('[SW] Registered:', reg.scope))
    .catch(err => console.error('[SW] Registration failed:', err));
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
