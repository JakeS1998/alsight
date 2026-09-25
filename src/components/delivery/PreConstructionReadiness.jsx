import React, { useMemo } from "react";
import { FormSection } from "@/components/forms/PowerForm";
import { CheckCircle2, AlertTriangle, XCircle, Circle } from "lucide-react";

const APPT_TYPES = ["appointment_pm", "appointment_pd_cdm", "appointment_architect", "appointment_pd_br"];

export function PreConstructionReadiness({ project, legalDocs, dmas, jcts, warranties, feeProposals }) {
  const items = useMemo(() => {
    const aa = legalDocs.find((d) => d.document_type === "access_agreement");
    const appts = legalDocs.filter((d) => APPT_TYPES.includes(d.document_type));
    const apptDone = appts.filter((d) => d.executed === "yes").length;
    const pcsa = legalDocs.find((d) => d.document_type === "pcsa");
    const dma = dmas[0];
    const feeAccepted = feeProposals.some((f) => f.status === "accepted");
    const feeAny = feeProposals.length > 0;
    const contractor = jcts.length > 0 || warranties.some((w) => w.category === "contractor");
    const riba2 = !!project.riba2_end;

    const mk = (label, done, partial, extra) => ({ label, status: done ? "done" : partial ? "partial" : "pending", extra });
    return [
      mk("Access Agreement", aa?.executed === "yes", !!aa),
      mk("Fee Proposal", feeAccepted, feeAny),
      mk("Appointments", apptDone >= 4, apptDone > 0, `${apptDone}/4`),
      mk("PCSA", pcsa?.executed === "yes", !!pcsa),
      mk("DMA", dma?.executed === "yes", !!dma),
      mk("Programme (RIBA 2)", riba2, false),
      mk("Contractor identified", contractor, false),
    ];
  }, [project, legalDocs, dmas, jcts, warranties, feeProposals]);

  const doneCount = items.filter((i) => i.status === "done").length;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <FormSection title="3 · Pre-Construction" description="Consolidated readiness view pulled from your existing legal, finance and delivery records">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${pct} 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-900">{pct}%</div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Project ready to proceed</p>
            <p className="text-xs text-slate-500">{doneCount} of {items.length} readiness items complete</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => <ReadinessItem key={it.label} {...it} />)}
        </div>
      </div>
    </FormSection>
  );
}

function ReadinessItem({ label, status, extra }) {
  const map = {
    done: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, cls: "border-emerald-200 bg-emerald-50" },
    partial: { icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, cls: "border-amber-200 bg-amber-50" },
    pending: { icon: <XCircle className="h-4 w-4 text-slate-400" />, cls: "border-slate-200 bg-white" },
  };
  const s = map[status];
  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${s.cls}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">{s.icon}{label}</div>
      {extra && <span className="text-xs font-semibold text-slate-500">{extra}</span>}
    </div>
  );
}