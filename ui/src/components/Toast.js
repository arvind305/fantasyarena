import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const toast = React.useMemo(
    () => ({
      success: (msg) => addToast(msg, "success"),
      error: (msg) => addToast(msg, "error"),
      info: (msg) => addToast(msg, "info"),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 flex flex-col gap-3 max-w-sm sm:ml-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-up px-5 py-3 rounded-xl shadow-2xl text-sm font-medium backdrop-blur-sm border ${
              t.type === "success"
                ? "bg-emerald-900/90 border-emerald-700 text-emerald-100"
                : t.type === "error"
                ? "bg-red-900/90 border-red-700 text-red-100"
                : "bg-brand-900/90 border-brand-700 text-brand-100"
            }`}
          >
            <span className="mr-2">
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
