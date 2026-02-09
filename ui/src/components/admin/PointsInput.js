import React from "react";

/**
 * Reusable number input for point values.
 * Shows label, value, and optional description.
 */
export default function PointsInput({ label, value, onChange, min, max, step, description, disabled }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-300 block mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step || 1}
        disabled={disabled}
        className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200
          ${disabled ? "opacity-70 cursor-not-allowed" : "focus:outline-none focus:border-brand-600"}`}
      />
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
}
