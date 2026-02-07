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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiGetGroupDetail(groupId)
      .then(setGroup)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;
  if (!group) return <div className="max-w-3xl mx-auto px-4 py-10 card text-center"><p className="text-gray-400">Group not found</p></div>;

  const code = group.joinCode || group.code || "";
  const inviteMessage = `Join my group "${group.name}" on Fantasy Arena!\n\nGroup Code: ${code}\n\nOpen the app and enter this code to join:`;
  const inviteUrl = `${window.location.origin}/groups?join=${code}`;
  const fullInvite = `${inviteMessage}\n${inviteUrl}`;

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(`Group code: ${code}`);
    }
  }

  async function handleShare() {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${group.name}`, text: inviteMessage, url: inviteUrl });
        return;
      } catch (err) {
        if (err.name === "AbortError") return; // User cancelled
      }
    }
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(fullInvite);
      toast.success("Invite link copied!");
    } catch {
      toast.info(fullInvite);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="card mb-4 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-gray-100 mb-1">{group.name}</h1>
        <p className="text-sm text-gray-500">{group.members.length} members</p>
      </div>

      {/* Invite Section */}
      <div className="card mb-8 animate-fade-in bg-gradient-to-br from-brand-900/30 to-purple-900/20 border-brand-800">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Invite Friends</p>
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-xl font-bold text-brand-300 tracking-widest select-all">{code}</span>
          <button
            onClick={handleCopyCode}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${copied ? "bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-200"}`}
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>
        <button
          onClick={handleShare}
          className="w-full btn-primary text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Invite Link
        </button>
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
