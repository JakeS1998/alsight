import React, { useMemo } from "react";
import { FormSection } from "@/components/forms/PowerForm";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/portal";

function daysFromToday(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

export function ProgrammeMilestones({ project, feeProposals, jcts }) {
  const milestones = useMemo(() => {
    const acceptedFee = feeProposals.find((f) => f.status === "accepted");
    const jctExec = jcts.find((j) => j.executed === "yes") || jcts[0];
    return [
      { label: "Scoping", date: project.pq_approval_date || project.created_date },
      { label: "Fee Proposal", date: acceptedFee?.client_approval_date || acceptedFee?.date_issued },
      { label: "Agreement", date: project.aa_executed_date },
      { label: "RIBA 2", date: project.riba2_end },
      { label: "RIBA 3", date: project.riba3_end },
      { label: "RIBA 4", date: project.riba4_end },
      { label: "Contract", date: jctExec?.date_of_execution },
      { label: "Construction", date: project.ie_commencement_date },
      { label: "PC", date: project.practical_completion_date },
    ];
  }, [project, feeProposals, jcts]);

  return (
    <FormSection title="5 · Programme" description="High-level milestone programme built from your existing RIBA and contract dates">
      <div className="flex flex-wrap items-stretch gap-2">
        {milestones.map((m, i) => {
          const done = !!m.date;
          const days = daysFromToday(m.date);
          const overdue = !done ? null : (m.label === "PC" || m.label === "Construction" ? null : null);
          const upcoming = !done && days !== null && days < 0;
          return (
            <div key={m.label} className="flex items-center">
              <div className={`w-44 rounded-xl border p-3 ${done ? "border-emerald-200 bg-emerald-50" : upcoming ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center gap-2">
                  {done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : upcoming ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
                  <span className="text-sm font-semibold text-slate-800">{m.label}</span>
                </div>
                <div className="mt-1 text-xs text-slate-600">{m.date ? formatDate(m.date) : "—"}</div>
                {done && days !== null && (
                  <div className={`mt-0.5 text-[11px] font-medium ${days < 0 ? "text-slate-400" : "text-emerald-700"}`}>
                    {days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d`}
                  </div>
                )}
              </div>
              {i < milestones.length - 1 && <div className="mx-0.5 h-px w-4 bg-slate-300 sm:w-6" />}
            </div>
          );
        })}
      </div>
    </FormSection>
  );
}