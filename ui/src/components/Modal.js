import React from "react";

export default function Modal({ open, onClose, onConfirm, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-md w-full animate-pop border-gray-700">
        <h3 className="text-lg font-bold text-gray-100 mb-3">{title}</h3>
        <div className="text-gray-300 text-sm mb-6">{children}</div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm min-h-[44px]">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary text-sm min-h-[44px]">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
