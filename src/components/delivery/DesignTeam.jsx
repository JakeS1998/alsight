import React, { useMemo } from "react";
import { FormSection } from "@/components/forms/PowerForm";
import { CheckCircle2, XCircle, FileText, PoundSterling, PenLine, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/portal";

const APPT_ROLES = [
  { label: "Project Manager", type: "appointment_pm" },
  { label: "Principal Designer BR", type: "appointment_pd_br" },
  { label: "Principal Designer CDM", type: "appointment_pd_cdm" },
  { label: "Architect", type: "appointment_architect" },
];

export function DesignTeam({ legalDocs, jcts, warranties, accountMap }) {
  const cards = useMemo(() => {
    const out = [];
    APPT_ROLES.forEach((role) => {
      const doc = legalDocs.find((d) => d.document_type === role.type);
      out.push({
        label: role.label,
        appointed: !!doc,
        account: doc ? accountMap[doc.account_id]?.name : null,
        fee: doc?.total_fees,
        signed: doc?.executed === "yes",
        po: doc?.executed === "po",
        link: doc?.link_to_file,
      });
    });

    // Contractor from JCT (or contractor warranty)
    const jct = jcts.find((j) => j.executed === "yes") || jcts[0];
    const contractorName = jct ? (accountMap[jct.contractor_id]?.name || accountMap[jct.account_id]?.name) : null;
    out.push({
      label: "Contractor",
      appointed: !!jct || warranties.some((w) => w.category === "contractor"),
      account: contractorName,
      fee: null, signed: jct?.executed === "yes", po: false, link: jct?.link_to_file,
    });

    // Roles not yet tracked as dedicated docs
    ["Cost Consultant", "Structural Engineer", "M&E"].forEach((label) => out.push({ label, appointed: false, untracked: true }));
    return out;
  }, [legalDocs, jcts, warranties, accountMap]);

  return (
    <FormSection title="4 · Design & Consultant Team" description="Reuses your appointment documents — no duplicate data entry">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => <TeamCard key={c.label} {...c} />)}
      </div>
    </FormSection>
  );
}

function TeamCard({ label, appointed, account, fee, signed, po, link, untracked }) {
  if (untracked) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <span className="text-xs text-slate-400">Not tracked</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Add an appointment document to track this role.</p>
      </div>
    );
  }
  return (
    <div className={`rounded-xl border p-3 ${appointed ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {appointed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-slate-300" />}
      </div>
      {appointed ? (
        <div className="mt-2 space-y-1 text-xs text-slate-600">
          {account && <div className="font-medium text-slate-700">{account}</div>}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            <span className={fee ? "text-emerald-700" : "text-slate-400"}><PoundSterling className="mr-0.5 inline h-3 w-3" />{fee ? formatCurrency(fee) : "Fee —"}</span>
            <span className={signed ? "text-emerald-700" : "text-slate-400"}><PenLine className="mr-0.5 inline h-3 w-3" />{signed ? "Signed" : "Unsigned"}</span>
            {po && <span className="text-amber-700">PO issued</span>}
          </div>
          {link && <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"><FileText className="h-3 w-3" /> Open document</a>}
        </div>
      ) : (
        <p className="mt-1 text-xs text-slate-400">No appointment yet.</p>
      )}
    </div>
  );
}