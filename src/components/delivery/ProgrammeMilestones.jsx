import React, { useMemo } from "react";
import { FormSection } from "@/components/forms/PowerForm";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/portal";
import ChecklistHover from '@/components/delivery/ChecklistHover';
import { daysFromToday, programmeMilestones } from '@/components/delivery/programmeMilestones';



export function ProgrammeMilestones({ project, feeProposals, jcts, delivery }) {
  const milestones = useMemo(() => programmeMilestones(project, feeProposals, jcts, delivery), [project, feeProposals, jcts, delivery?.pc_achieved, delivery?.client_handover]);

  return (
    <FormSection title="5 · Programme" completed={milestones.every(milestone => milestone.done ?? !!milestone.date)} description="High-level milestone programme built from your existing RIBA and contract dates">
      <div className="flex flex-wrap items-stretch gap-2">
        {milestones.map((m, i) => {
          const done = m.done ?? !!m.date;
          const days = daysFromToday(m.date);
          const upcoming = !done && days !== null && days < 0;
          return (
            <div key={m.label} className="flex items-center">
              <ChecklistHover title={m.label} details={m.details}>
              <div className={`w-44 rounded-xl border p-3 ${done ? "border-emerald-200 bg-emerald-50" : upcoming ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center gap-2">
                  {done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : upcoming ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
                  <span className="text-sm font-semibold text-slate-800">{m.label}</span>
                </div>
                <div className="mt-1 text-xs text-slate-600">{m.text || (m.date ? formatDate(m.date) : "—")}</div>
                {done && days !== null && (
                  <div className={`mt-0.5 text-[11px] font-medium ${days < 0 ? "text-slate-400" : "text-emerald-700"}`}>
                    {days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d`}
                  </div>
                )}
              </div>
              </ChecklistHover>
              {i < milestones.length - 1 && <div className="mx-0.5 h-px w-4 bg-slate-300 sm:w-6" />}
            </div>
          );
        })}
      </div>
    </FormSection>
  );
}