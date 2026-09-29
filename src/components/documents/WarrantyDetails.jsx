import React from "react";
import { formatDate } from "@/lib/portal";
import { ExternalLink } from "lucide-react";

function Row({ label, value }) {
  return <div className="flex justify-between gap-2 text-xs"><span className="shrink-0 text-slate-500">{label}</span><span className="text-right text-slate-700">{value || "—"}</span></div>;
}

export function WarrantyDetails({ warranty: w, accountMap, hideCommentsAndLinks = false }) {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-3">
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Warranty & parties</p>
        <Row label="Warranty ID" value={w.warranty_id} />
        <Row label="Supplier" value={accountMap[w.supplier_id]?.name} />
        <Row label="Account" value={accountMap[w.account_id]?.name} />
        <Row label="Services" value={w.services} />
        <Row label="Beneficiary" value={w.beneficiary === "council" ? "Council" : w.beneficiary} />
        <Row label="Format" value={w.format === "deed" ? "Deed" : w.format} />
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dates & approval</p>
        <Row label="JCT Signed" value={formatDate(w.jct_signed)} />
        <Row label="Drafted" value={formatDate(w.drafted_date)} />
        <Row label="Warranty Due" value={formatDate(w.warranty_due)} />
        <Row label="Practical Completion" value={formatDate(w.practical_completion)} />
        <Row label="Reminder" value={formatDate(w.reminder_date)} />
        <Row label="Approval Status" value={w.approval_status} />
        <Row label="Approver" value={w.approvers_name} />
        <Row label="Approval Date" value={formatDate(w.approval_date)} />
        <Row label="Execution Date" value={formatDate(w.date_of_execution)} />
      </div>
      {!hideCommentsAndLinks && <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Comments & links</p>
        {w.approval_comments && <p className="whitespace-pre-line text-xs text-slate-600">Approval: {w.approval_comments}</p>}
        {w.comments && <p className="whitespace-pre-line text-xs text-slate-600">{w.comments}</p>}
        {w.link_to_file && <a href={w.link_to_file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><ExternalLink className="h-3 w-3" /> View file</a>}
      </div>}
    </div>
  );
}