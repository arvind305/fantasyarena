import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGetGroups, apiCreateGroup, apiJoinGroup } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";

export default function Groups() {
  const { user } = useAuth();
  const identity = resolveIdentity(user);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newlyCreated, setNewlyCreated] = useState(null); // Track newly created group for highlighting

  // Handle ?join=CODE URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get("join");
    if (codeFromUrl) {
      setJoinCode(codeFromUrl);
      // Clear the URL parameter
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    apiGetGroups(user ? identity.userId : null)
      .then(setGroups)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!user) return toast.error("Sign in to create a group");
    if (!newName.trim()) return toast.error("Enter a group name");
    setCreating(true);
    try {
      const group = await apiCreateGroup(newName.trim(), identity.userId, identity.displayName);
      setGroups((prev) => [...prev, group]);
      setNewName("");
      setNewlyCreated(group); // Show the newly created group with code
      toast.success(`Group created! Share the code with friends.`);
    } catch (err) { toast.error(err.message); }
    finally { setCreating(false); }
  }

  async function handleCopyCode(e, groupObj) {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    const code = groupObj?.joinCode || groupObj?.code || "";
    if (!code) {
      toast.error("Code not available");
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied!");
    } catch {
      toast.info(`Code: ${code}`);
    }
  }

  async function handleJoin() {
    if (!user) return toast.error("Sign in to join a group");
    if (!joinCode.trim()) return toast.error("Enter a group code");
    setJoining(true);
    try {
      const group = await apiJoinGroup(joinCode.trim(), identity.userId, identity.displayName);
      setGroups((prev) => {
        if (prev.some((g) => g.groupId === group.groupId)) return prev;
        return [...prev, group];
      });
      setJoinCode("");
      toast.success(`Joined "${group.name}"!`);
    } catch (err) { toast.error(err.message); }
    finally { setJoining(false); }
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-10 text-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="animate-fade-in mb-8">
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="bg-gradient-to-r from-brand-300 to-purple-400 bg-clip-text text-transparent">Groups</span>
        </h1>
        <p className="text-gray-500">Compete with friends in private groups.</p>
      </div>

      {/* Newly Created Group - Show prominently */}
      {newlyCreated && (
        <div className="card mb-6 animate-fade-in bg-gradient-to-br from-green-900/30 to-brand-900/20 border-green-700">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-green-400 uppercase tracking-wider mb-1">Group Created!</p>
              <h3 className="text-lg font-bold text-gray-100">{newlyCreated.name}</h3>
            </div>
            <button onClick={() => setNewlyCreated(null)} className="text-gray-500 hover:text-gray-300 text-xl leading-none">&times;</button>
          </div>
          <p className="text-sm text-gray-400 mb-3">Share this code with friends to invite them:</p>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-2xl font-bold text-brand-300 tracking-widest select-all">{newlyCreated.joinCode || newlyCreated.code}</span>
            <button
              onClick={(e) => handleCopyCode(e, newlyCreated)}
              className="px-4 py-2 rounded bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
            >
              Copy Code
            </button>
          </div>
          <Link to={`/groups/${newlyCreated.groupId}`} className="text-brand-400 hover:text-brand-300 text-sm">
            Go to group &rarr;
          </Link>
        </div>
      )}

      {/* Create + Join */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="card">
          <h2 className="text-lg font-bold mb-1">Create Group</h2>
          <p className="text-gray-500 text-xs mb-4">Start a new group and share the code.</p>
          <div className="flex gap-2">
            <input className="input flex-1 text-sm" placeholder="Group name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} disabled={creating} />
            <button onClick={handleCreate} disabled={creating} className="btn-primary text-sm whitespace-nowrap">
              {creating ? <Spinner size="sm" className="text-white" /> : "Create"}
            </button>
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold mb-1">Join Group</h2>
          <p className="text-gray-500 text-xs mb-4">Got a code? Enter it to join.</p>
          <div className="flex gap-2">
            <input className="input flex-1 text-sm uppercase tracking-widest" placeholder="ABC-1234" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleJoin()} disabled={joining} />
            <button onClick={handleJoin} disabled={joining} className="btn-secondary text-sm whitespace-nowrap">
              {joining ? <Spinner size="sm" /> : "Join"}
            </button>
          </div>
        </div>
      </div>

      {/* Group list */}
      <h2 className="text-lg font-bold mb-4 text-gray-300">{user ? "My Groups" : "All Groups"}</h2>
      {groups.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No groups yet</p>
          <p className="text-gray-600 text-sm">Create one or join with a friend's code.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map((g, i) => (
            <Link key={g.groupId} to={`/groups/${g.groupId}`} className="card hover:border-brand-700 transition-all group animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <h3 className="font-semibold text-gray-100 group-hover:text-brand-300 transition-colors">{g.name}</h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">{g.joinCode || g.code}</span>
                <button
                  onClick={(e) => handleCopyCode(e, g)}
                  className="text-brand-400 hover:text-brand-300 hover:underline"
                  title="Copy code"
                >
                  Copy
                </button>
                <span className="ml-auto">{g.members.length} members</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
