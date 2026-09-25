import React from "react";
import { PSO_CHECK, EXECUTED_STATUS } from "@/lib/portal";

/**
 * Tri-state toggle display (read-only). Shows No/Yes/PO or No/Yes/N/A/TBC
 * with the active value highlighted in green.
 */
export function TriStateDisplay({ value, options = "pso" }) {
  const map = options === "executed" ? EXECUTED_STATUS : PSO_CHECK;
  const entries = Object.entries(map);

  return (
    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
      {entries.map(([key, cfg]) => {
        const isActive = value === key;
        return (
          <span
            key={key}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-emerald-500 text-white"
                : "bg-white text-slate-400"
            }`}
          >
            {cfg.label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Checklist grid for DMA and JCT — shows each checklist item with its
 * tri-state value and optional comments below.
 */
export function ChecklistGrid({ items, data }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const value = data[item.key] || "";
        const comments = item.commentsKey ? data[item.commentsKey] || "" : "";
        return (
          <div key={item.key} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">{item.label}</span>
              <TriStateDisplay value={value} />
            </div>
            {comments && (
              <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{comments}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}