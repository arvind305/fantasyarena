import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiGetGroups, apiCreateGroup, apiJoinGroup } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";

export default function Groups() {
  const { user } = useAuth();
  const identity = resolveIdentity(user);
  const toast = useToast();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

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
      toast.success(`Group "${group.name}" created! Code: ${group.joinCode}`);
    } catch (err) { toast.error(err.message); }
    finally { setCreating(false); }
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
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="font-mono">{g.joinCode}</span>
                <span>{g.members.length} members</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
