import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiGetGroupDetail } from "../api";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";

const RANK_STYLE = {
  1: "from-yellow-400 to-amber-600 text-gray-900",
  2: "from-gray-300 to-gray-500 text-gray-900",
  3: "from-amber-600 to-amber-800 text-amber-100",
};

export default function GroupDetail() {
  const { groupId } = useParams();
  const toast = useToast();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetGroupDetail(groupId)
      .then(setGroup)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;
  if (!group) return <div className="max-w-3xl mx-auto px-4 py-10 card text-center"><p className="text-gray-400">Group not found</p></div>;

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(group.code);
      toast.success("Group code copied!");
    } catch {
      toast.info(`Group code: ${group.code}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="card mb-8 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-gray-100 mb-1">{group.name}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="font-mono">{group.code}</span>
          <button onClick={handleCopyCode} className="text-brand-400 hover:text-brand-300 text-xs">Copy code</button>
          <span className="ml-auto">{group.members.length} members</span>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 text-gray-200">Leaderboard</h2>
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
            {group.leaderboard.map((m) => (
              <tr key={m.userId} className={`border-b border-gray-800/50 last:border-0 ${m.rank <= 3 ? "bg-gray-800/30" : "hover:bg-gray-800/20"}`}>
                <td className="px-5 py-3.5">
                  {RANK_STYLE[m.rank] ? (
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-gradient-to-br ${RANK_STYLE[m.rank]}`}>
                      {m.rank}
                    </span>
                  ) : (
                    <span className="text-gray-500 font-medium text-sm pl-1.5">{m.rank}</span>
                  )}
                </td>
                <td className="px-5 py-3.5 font-semibold text-gray-200">{m.displayName}</td>
                <td className="px-5 py-3.5 text-right font-bold text-gray-300">{m.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
