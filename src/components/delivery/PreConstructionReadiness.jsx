import React, { useMemo } from "react";
import { FormSection, FormField, formInputClass } from "@/components/forms/PowerForm";
import { Button } from "@/components/ui/button";
import SearchableSelect from '@/components/forms/SearchableSelect';
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import ChecklistHover from '@/components/delivery/ChecklistHover';
import { readinessChecklistDetails } from '@/components/delivery/checklistDetails';

const APPT_TYPES = ["appointment_pm", "appointment_pd_cdm", "appointment_architect", "appointment_pd_br"];

const GATEWAYS = [
  { key: "pq", label: "Project Questionnaire (PQ)" },
  { key: "aa", label: "Access Agreement (AA)" },
  { key: "aa_variations", label: "AA Variations" },
  { key: "dma", label: "DMA" },
];

export function PreConstructionReadiness({ project, legalDocs, dmas, jcts, warranties, feeProposals, delivery, setField, onSave, saving }) {
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

    const details = readinessChecklistDetails({ project, legalDocs, dmas, jcts, warranties, feeProposals });
    const mk = (label, done, partial, extra) => ({ label, status: done ? "done" : partial ? "partial" : "pending", extra, details: details[label] });
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
    <FormSection title="3 · Pre-Construction" completed={doneCount === items.length} description="Consolidated readiness view pulled from your existing legal, finance and delivery records">
      <div className="space-y-5">
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

        {/* PSO sign-off gateways */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">PSO Sign-off Gateways</h4>
              <p className="text-xs text-slate-500">Record PSO approval at each ready-to-proceed gateway</p>
            </div>
            <Button type="button" size="sm" onClick={onSave} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save PSO
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {GATEWAYS.map((g) => {
              const received = !!delivery[`pso_${g.key}_date`];
              return (
                <div key={g.key} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{g.label}</p>
                    {received ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3" /> PSO received</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"><AlertTriangle className="h-3 w-3" /> PSO outstanding</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Approved by">
                      <SearchableSelect value={delivery[`pso_${g.key}_approved_by`] || ""} onChange={(e) => setField(`pso_${g.key}_approved_by`, e.target.value)} className={formInputClass}>
                        <option value="">Select approver</option>
                        <option value="Sarah Watts">Sarah Watts</option>
                        <option value="Paul Cluett">Paul Cluett</option>
                      </SearchableSelect>
                    </FormField>
                    <FormField label="Date">
                      <input type="date" value={delivery[`pso_${g.key}_date`] ? String(delivery[`pso_${g.key}_date`]).slice(0, 10) : ""} onChange={(e) => setField(`pso_${g.key}_date`, e.target.value)} className={formInputClass} />
                    </FormField>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FormSection>
  );
}

function ReadinessItem({ label, status, extra, details }) {
  const map = {
    done: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, cls: "border-emerald-200 bg-emerald-50" },
    partial: { icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, cls: "border-amber-200 bg-amber-50" },
    pending: { icon: <XCircle className="h-4 w-4 text-slate-400" />, cls: "border-slate-200 bg-white" },
  };
  const s = map[status];
  return (
    <ChecklistHover title={label} details={details}>
      <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${s.cls}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">{s.icon}{label}</div>
        {extra && <span className="text-xs font-semibold text-slate-500">{extra}</span>}
      </div>
    </ChecklistHover>
  );
}