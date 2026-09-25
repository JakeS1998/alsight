import React from "react";

export function FilterSelect({ label, value, onChange, options, allLabel = "All" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <option value="">{label ? `All ${label}` : allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}