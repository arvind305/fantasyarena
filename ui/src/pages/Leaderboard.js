import React, { useState, useEffect } from "react";
import { apiGetLeaderboard, apiGetGroups } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { useToast } from "../components/Toast";
import Spinner, { SkeletonCard } from "../components/Spinner";

const RANK_STYLE = {
  1: { badge: "bg-gradient-to-br from-yellow-400 to-amber-600 text-gray-900", ring: "ring-2 ring-yellow-500/40", label: "\u{1F947}" },
  2: { badge: "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900", ring: "ring-2 ring-gray-400/30", label: "\u{1F948}" },
  3: { badge: "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100", ring: "ring-2 ring-amber-600/30", label: "\u{1F949}" },
};

const TABS = [
  { id: "global", label: "Global" },
  { id: "group", label: "Group" },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const identity = resolveIdentity(user);
  const toast = useToast();

  const [tab, setTab] = useState("global");
  const [data, setData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loading, setLoading] = useState(true);

  // Load groups for group tab
  useEffect(() => {
    if (user) {
      apiGetGroups(identity.userId).then(setGroups).catch(() => {});
    }
  }, [user]);

  // Load leaderboard data
  useEffect(() => {
    setLoading(true);
    const scope = tab === "group" ? "group" : tab;
    const scopeId = tab === "group" ? selectedGroup : undefined;

    if (tab === "group" && !selectedGroup) {
      setData([]);
      setLoading(false);
      return;
    }

    apiGetLeaderboard(scope, scopeId)
      .then(setData)
      .catch((err) => { toast.error(err.message); setData([]); })
      .finally(() => setLoading(false));
  }, [tab, selectedGroup]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            Leaderboard
          </span>
        </h1>
        <p className="text-gray-500">See who's leading the prediction game.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-brand-600/20 text-brand-300"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Group selector */}
      {tab === "group" && (
        <div className="mb-6">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="input text-sm"
          >
            <option value="">Select a group...</option>
            {groups.map((g) => <option key={g.groupId} value={g.groupId}>{g.name}</option>)}
          </select>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && data.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No data yet</p>
          <p className="text-gray-600 text-sm">
            {tab === "group" && !selectedGroup
              ? "Select a group to view its leaderboard."
              : "Start making predictions to see scores here."}
          </p>
        </div>
      )}

      {/* Top 3 Podium */}
      {!loading && data.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[data[1], data[0], data[2]].map((e, i) => {
            const rank = [2, 1, 3][i];
            const style = RANK_STYLE[rank];
            const isFirst = rank === 1;
            return (
              <div key={e.userId} className={`card text-center animate-slide-up ${style.ring} ${isFirst ? "sm:-mt-4" : ""}`} style={{ animationDelay: `${i * 120}ms` }}>
                <div className="text-3xl mb-2">{style.label}</div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${style.badge}`}>#{rank}</div>
                <h3 className={`font-bold truncate ${isFirst ? "text-lg text-yellow-300" : "text-sm text-gray-200"}`}>{e.displayName}</h3>
                <p className={`font-extrabold mt-1 ${isFirst ? "text-3xl text-yellow-400" : "text-xl text-gray-300"}`}>{e.totalScore ?? e.score}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">points</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      {!loading && data.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Rank</th>
                <th className="text-left px-5 py-3">Player</th>
                <th className="text-right px-5 py-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e, i) => {
                const rank = e.rank ?? i + 1;
                const style = RANK_STYLE[rank];
                return (
                  <tr key={e.userId} className={`border-b border-gray-800/50 last:border-0 animate-slide-up ${rank <= 3 ? "bg-gray-800/30" : "hover:bg-gray-800/20"}`} style={{ animationDelay: `${Math.min(i * 60, 600)}ms` }}>
                    <td className="px-5 py-3.5">
                      {style ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${style.badge}`}>{rank}</span>
                      ) : (
                        <span className="text-gray-500 font-medium text-sm pl-1.5">{rank}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${rank <= 3 ? "text-gray-100" : "text-gray-300"}`}>{e.displayName}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-bold text-lg ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-amber-500" : "text-gray-400"}`}>{e.totalScore ?? e.score}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
