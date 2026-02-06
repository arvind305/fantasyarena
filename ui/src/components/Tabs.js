import React from "react";

/**
 * Reusable Tabs component
 * Props:
 *   tabs - Array of { key: string, label: string }
 *   activeKey - Currently active tab key
 *   onChange - Callback when tab changes: (key) => void
 *   className - Optional additional className for wrapper
 */
export default function Tabs({ tabs, activeKey, onChange, className = "" }) {
  return (
    <div className={`flex gap-1 bg-gray-900/50 p-1 rounded-xl border border-gray-800 overflow-x-auto ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeKey === tab.key
              ? "bg-brand-600/20 text-brand-300 shadow-sm"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Hook to sync tab state with URL query param
 * Returns [activeTab, setActiveTab] where setActiveTab updates URL
 */
export function useTabsWithUrl(paramName, validTabs, defaultTab) {
  const searchParams = new URLSearchParams(window.location.search);
  const urlTab = searchParams.get(paramName);
  const isValid = validTabs.includes(urlTab);
  const currentTab = isValid ? urlTab : defaultTab;

  const setTab = (newTab) => {
    const url = new URL(window.location.href);
    url.searchParams.set(paramName, newTab);
    window.history.pushState({}, "", url.toString());
    // Force re-render by dispatching popstate
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return [currentTab, setTab];
}

/**
 * React hook that listens for popstate events (back/forward)
 * Call this in your component to re-render on navigation
 */
export function useUrlSync() {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const handler = () => forceUpdate();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
}
