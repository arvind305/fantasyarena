import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { resolveIdentity } from "../auth/identity";

export default function Profile() {
  const { user, signOut } = useAuth();
  const identity = resolveIdentity(user);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg mb-2">Sign in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="card mb-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-16 h-16 rounded-full ring-2 ring-brand-600/40" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-400">
              {identity.displayName[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-gray-100">{identity.displayName}</h1>
            {user.email && <p className="text-gray-500 text-sm">{user.email}</p>}
          </div>
        </div>
        <button onClick={signOut} className="btn-secondary text-sm">Sign Out</button>
      </div>

      <h2 className="text-xl font-bold mb-4 text-gray-200">Groups</h2>
      <Link to="/groups" className="text-brand-400 hover:text-brand-300 text-sm">View My Groups</Link>
    </div>
  );
}
