import React, { useState, useRef, useEffect } from "react";
import { apiSearchUsers } from "../../api";

/**
 * User search/select component for runner picks.
 * Searches leaderboard for other users.
 */
export default function RunnerPicker({ onSelect, disabled, excludeUserIds }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearchChange(value) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await apiSearchUsers(value.trim());
        // Filter out excluded users
        const filtered = users.filter(u => !excludeUserIds?.has(u.userId));
        setResults(filtered);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function handleSelect(user) {
    onSelect(user.userId, user.displayName);
    setSearch("");
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        disabled={disabled}
        placeholder="Search for a player by name..."
        className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500
          ${disabled ? "opacity-70 cursor-not-allowed" : "focus:outline-none focus:border-brand-600"}`}
      />

      {searching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.userId}
              type="button"
              onClick={() => handleSelect(user)}
              className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 transition-colors"
            >
              {user.displayName}
            </button>
          ))}
        </div>
      )}

      {isOpen && !searching && search.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
          <div className="px-3 py-3 text-sm text-gray-500 text-center">No users found</div>
        </div>
      )}
    </div>
  );
}
