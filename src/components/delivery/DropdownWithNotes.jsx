import React, { useState } from "react";
import { FormField, formInputClass } from "@/components/forms/PowerForm";

const norm = (o) => (typeof o === "string" ? { value: o, label: o } : o);

export function DropdownWithNotes({ label, value, onChange, options, notes, onNotesChange, placeholder = "—" }) {
  const [showNotes, setShowNotes] = useState(!!notes);
  const opts = options.map(norm);
  return (
    <div className="space-y-1">
      <FormField label={label}>
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={formInputClass}>
          <option value="">{placeholder}</option>
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </FormField>
      {showNotes ? (
        <div className="flex items-start gap-1">
          <textarea
            rows={2}
            value={notes || ""}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Commentary"
            className={`${formInputClass} h-auto py-1.5 text-xs`}
          />
          <button
            type="button"
            onClick={() => { onNotesChange(""); setShowNotes(false); }}
            className="mt-1 shrink-0 text-xs text-slate-400 hover:text-rose-500"
          >
            Clear
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowNotes(true)} className="text-xs text-primary hover:underline">
          + Add commentary
        </button>
      )}
    </div>
  );
}