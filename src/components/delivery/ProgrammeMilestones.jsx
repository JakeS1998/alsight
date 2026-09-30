import React, { useMemo } from "react";
import { FormSection } from "@/components/forms/PowerForm";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/portal";
import ChecklistHover from '@/components/delivery/ChecklistHover';
import { documentChecklistDetails } from '@/components/delivery/checklistDetails';

function daysFromToday(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

export function ProgrammeMilestones({ project, feeProposals, jcts, delivery }) {
  const milestones = useMemo(() => {
    const pcDate = project.practical_completion_date || delivery?.pc_achieved;
    const pcAchieved = !!pcDate && daysFromToday(pcDate) !== null && daysFromToday(pcDate) <= 0;
    const handoverComplete = delivery?.client_handover === 'complete';
    const acceptedFee = feeProposals.find((f) => f.status === "accepted");
    const jctExec = jcts.find((j) => j.executed === "yes") || jcts[0];
    return [
      { label: "Scoping", date: project.pq_approval_date || project.created_date, details: project.pq_approval_date ? [`PQ approval recorded: ${formatDate(project.pq_approval_date)}.`] : ['Missing: PQ approval date.', 'The displayed date is project creation, not scoping sign-off.'] },
      { label: "Fee Proposal", date: acceptedFee?.client_approval_date || acceptedFee?.date_issued, details: acceptedFee ? ['Fee proposal accepted.', `Revision: R${acceptedFee.revision_number || 1}`, acceptedFee.client_approval_date ? `Client approval: ${formatDate(acceptedFee.client_approval_date)}` : 'Missing: client approval date; the milestone uses the issue date instead.'] : ['Outstanding: accepted fee proposal.', 'No accepted proposal date is available.'] },
      { label: "Agreement", date: project.aa_executed_date, details: project.aa_executed_date ? [`Access Agreement execution recorded: ${formatDate(project.aa_executed_date)}.`] : ['Missing: Access Agreement execution date.'] },
      ...[2, 3, 4].map(stage => ({ label: `RIBA ${stage}`, date: project[`riba${stage}_end`], details: [project[`riba${stage}_end`] ? `Recorded actual completion: ${formatDate(project[`riba${stage}_end`])}.` : `Missing: RIBA ${stage} actual completion date.`, 'The milestone uses the recorded date; separate stage approval is not recorded here.'] })),
      { label: "Contract", date: jctExec?.date_of_execution, details: documentChecklistDetails(jctExec, 'JCT contract') },
      { label: "Construction", date: pcDate, done: pcAchieved, details: pcDate ? [`Practical completion date recorded: ${formatDate(pcDate)}.`, pcAchieved ? 'Construction complete: PC achieved.' : 'PC date is in the future; construction is not yet complete.', 'Certificate sign-off is not confirmed by this date alone.'] : ['Outstanding: practical completion date.', 'Construction turns green when PC is achieved; no commencement date is required.'] },
      { label: "Handover", date: null, done: handoverComplete, text: handoverComplete ? 'Complete' : 'Outstanding', details: [handoverComplete ? 'Client handover recorded as complete.' : `Client handover: ${delivery?.client_handover || 'outstanding'}.`, 'Uses the client handover status in Practical Completion & Close-out, independently of PC.', 'No handover date is recorded.'] },
    ];
  }, [project, feeProposals, jcts, delivery?.pc_achieved, delivery?.client_handover]);

  return (
    <FormSection title="5 · Programme" description="High-level milestone programme built from your existing RIBA and contract dates">
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