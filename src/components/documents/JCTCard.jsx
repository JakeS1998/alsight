import React, { useState } from "react";
import { FORM_OF_JCT, formatDate, JCT_CHECKLIST_ITEMS } from "@/lib/portal";
import { jctName } from "@/components/documents/documentNames";
import { ExecutedBadge, FormOfJCTBadge } from "@/components/StatusBadge";
import { ProgressTracker, getJCTSteps } from "@/components/documents/ProgressTracker";
import { ChecklistGrid } from "@/components/documents/TriStateToggle";
import { ChevronDown, ChevronRight, FileText, ExternalLink } from "lucide-react";

export function JCTCard({ doc, projectName, accountName, contractorName, hideCommentsAndLinks = false }) {
  const [open, setOpen] = useState(false);
  const steps = getJCTSteps(doc);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left">
        <div className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50">
          <div className="min-w-0 flex items-center gap-3">
            {open ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{jctName(projectName, contractorName || accountName)}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="inline-block rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600">JCT</span>
                {doc.form_of_jct && <FormOfJCTBadge status={doc.form_of_jct} />}
              </div>
            </div>
          </div>
          <ExecutedBadge status={doc.executed} />
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-4">
          <ProgressTracker steps={steps} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Document & Execution</p>
              <Row label="Document ID" value={doc.document_id} />
              <Row label="Form of JCT" value={FORM_OF_JCT[doc.form_of_jct]?.label || "—"} />
              <Row label="Executed" value={<ExecutedBadge status={doc.executed} />} />
              <Row label="Date of Execution" value={formatDate(doc.date_of_execution)} />
              <Row label="Sent for Signing" value={formatDate(doc.sent_for_signing)} />
              <Row label="Signing Target" value={formatDate(doc.signing_target_date)} />
              <Row label="LOI Expiry" value={formatDate(doc.loi_expiry_date)} />
              <Row label="Practical Completion" value={formatDate(doc.practical_completion)} />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Parties & Drafting</p>
              <Row label="Account" value={accountName} />
              <Row label="Contractor" value={contractorName} />
              <Row label="Drafted Date" value={formatDate(doc.drafted_date)} />
              <Row label="Drafting Due" value={formatDate(doc.drafting_due_date)} />
              <Row label="Shared with Contractor" value={doc.shared_with_contractor ? "Yes" : "No"} />
              <Row label="BSM Owner" value={doc.is_bsm_document_owner ? "Yes" : "No"} />
            </div>
            {!hideCommentsAndLinks && <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Comments & Links</p>
              {doc.comments && <p className="text-xs text-slate-600 whitespace-pre-line">{doc.comments}</p>}
              {doc.variation_comments && <p className="text-xs text-slate-500">Variation: {doc.variation_comments}</p>}
              {doc.link_to_file && (
                <a href={doc.link_to_file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ExternalLink className="h-3 w-3" /> File
                </a>
              )}
            </div>}
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Contract Particulars Checklist</p>
            <ChecklistGrid items={JCT_CHECKLIST_ITEMS} data={doc} hideComments={hideCommentsAndLinks} />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-700 text-right">{value || "—"}</span>
    </div>
  );
}