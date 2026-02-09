import React from "react";
import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/matches", label: "Matches" },
  { to: "/admin/long-term", label: "Long-Term Config" },
];

export default function AdminNav() {
  const location = useLocation();

  return (
    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800 overflow-x-auto">
      {links.map((link) => {
        const isActive = location.pathname === link.to ||
          (link.to === "/admin/matches" && location.pathname.startsWith("/admin/match/")) ||
          (link.to === "/admin/dashboard" && location.pathname === "/admin/dashboard");

        return (
          <Link
            key={link.to}
            to={link.to}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-brand-600/20 text-brand-300 border border-brand-700"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
