import React, { useState } from "react";
import agreementNames from '@/components/projects/agreementNames';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import DataverseRecordEdit from '@/components/dataverse/DataverseRecordEdit';
import useEditableRecord from '@/components/dataverse/useEditableRecord';
import InlineDataverseField from '@/components/dataverse/InlineDataverseField';
import { formatDate, DMA_PSO_ITEMS } from "@/lib/portal";
import { dmaName } from "@/components/documents/documentNames";
import { ExecutedBadge } from "@/components/StatusBadge";
import { ProgressTracker, getDMASteps } from "@/components/documents/ProgressTracker";
import { ChecklistGrid, TriStateDisplay } from "@/components/documents/TriStateToggle";
import { ChevronDown, ChevronRight, FileText, ExternalLink, AlertCircle } from "lucide-react";

export function DMACard({ doc: sourceDoc, projectName, projectNumber, psoOutstanding }) {
  const [doc, setDoc] = useEditableRecord(sourceDoc);
  const [open, setOpen] = useState(false);
  const steps = getDMASteps(doc);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left">
        <div className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50">
          <div className="min-w-0 flex items-center gap-3">
            {open ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{dmaName(projectName, projectNumber)}</p>
              <span className="inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">{agreementNames(projectNumber).developmentShort}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {psoOutstanding && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <AlertCircle className="h-3 w-3" /> PSO outstanding
              </span>
            )}
            <ExecutedBadge status={doc.executed} />
          </div>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-4">
          <RecordUpdatedAt record={doc} />
          <DataverseRecordEdit table="dma" record={doc} onUpdated={setDoc}>
          <ProgressTracker steps={steps} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Document & Execution</p>
              <Row label="Document ID" value={doc.document_id} />
              <Row label="Executed" value={<ExecutedBadge status={doc.executed} />} />
              <Row label="Date of Execution" value={formatDate(doc.date_of_execution)} />
              <Row label="Sent for Signing" value={formatDate(doc.sent_for_signing)} />
              <Row label="Signing Target" value={formatDate(doc.signing_target_date)} />
              <Row label="Shared with Council" value={doc.shared_with_council ? "Yes" : "No"} />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Drafting & Approval</p>
              <Row label="Drafted Date" value={formatDate(doc.drafted_date)} />
              <Row label="Drafting Due" value={formatDate(doc.drafting_due_date)} />
              <Row label="Approval Status" value={doc.approval_status || "—"} />
              <Row label="Approver" value={doc.approvers_name || "—"} />
              <Row label="Approval Comments" value={doc.approval_comments || "—"} />
              <Row label="Approval Date" value={formatDate(doc.approval_date)} />
              <Row label={`${agreementNames(projectNumber).developmentShort} Version`} field="dma_version" value={doc.dma_version ? "Yes" : "No"} />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Comments & Links</p>
              <InlineDataverseField field="comments"><p className="text-xs text-slate-600 whitespace-pre-line">{doc.comments || '—'}</p></InlineDataverseField>
              {doc.link_to_file && (
                <a href={doc.link_to_file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ExternalLink className="h-3 w-3" /> File
                </a>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">PSO Checklist</p>
            <ChecklistGrid items={DMA_PSO_ITEMS} data={doc} />
          </div>
          </DataverseRecordEdit>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, field }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-slate-500 shrink-0">{label}</span>
      <div className="min-w-0 text-slate-700 text-right"><InlineDataverseField label={label} field={field}>{value || "—"}</InlineDataverseField></div>
    </div>
  );
}