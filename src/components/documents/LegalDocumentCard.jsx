import React, { useState } from "react";
import agreementNames from '@/components/projects/agreementNames';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import DataverseRecordEdit from '@/components/dataverse/DataverseRecordEdit';
import useEditableRecord from '@/components/dataverse/useEditableRecord';
import InlineDataverseField from '@/components/dataverse/InlineDataverseField';
import { DOCUMENT_TYPE, formatDate } from "@/lib/portal";
import { legalDocumentName } from "@/components/documents/documentNames";
import { DocTypeBadge, ExecutedBadge } from "@/components/StatusBadge";
import { ProgressTracker, getLegalDocSteps } from "@/components/documents/ProgressTracker";
import { ChevronDown, ChevronRight, Download, ExternalLink, FileText, AlertCircle } from "lucide-react";

export function LegalDocumentCard({ doc: sourceDoc, projectName, projectNumber, accountName, psoOutstanding, hideCommentsAndLinks = false, hideFinancials = false }) {
  const [doc, setDoc] = useEditableRecord(sourceDoc);
  const [open, setOpen] = useState(false);
  const steps = getLegalDocSteps(doc);
  const typeCfg = doc.document_type === 'access_agreement' ? { label: agreementNames(projectNumber).access } : DOCUMENT_TYPE[doc.document_type] || { label: doc.document_type };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left">
        <div className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50">
          <div className="min-w-0 flex items-center gap-3">
            {open ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{legalDocumentName(doc, projectName, accountName, projectNumber)}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <DocTypeBadge type={doc.document_type} projectNumber={projectNumber} />
                {accountName && <span className="truncate text-xs text-slate-500">{accountName}</span>}
              </div>
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
        <div className="border-t border-slate-100 bg-slate-50/60 p-3 space-y-3">
          <RecordUpdatedAt record={doc} />
          <DataverseRecordEdit table="documents" record={doc} onUpdated={setDoc}>
          <ProgressTracker steps={steps} />
          <div className="grid gap-4 sm:grid-cols-3 items-start">
            <DetailColumn title="Document & Execution">
              <DetailRow label="Document ID" value={doc.document_id} />
              <DetailRow label="Type" value={typeCfg.label} />
              <DetailRow label="Executed" value={<ExecutedBadge status={doc.executed} />} />
              <DetailRow label="Date of Execution" value={formatDate(doc.date_of_execution)} />
              <DetailRow label="Signing Target" value={formatDate(doc.signing_target_date)} />
              <DetailRow label="Sent to Client" value={formatDate(doc.sent_to_client)} />
            </DetailColumn>
            <DetailColumn title="Drafting & Approval">
              <DetailRow label="Drafted Date" value={formatDate(doc.drafted_date)} />
              <DetailRow label="Drafting Due" value={formatDate(doc.drafting_due_date)} />
              <DetailRow label="Approval Status" value={doc.approval_status || "—"} />
              <DetailRow label="Approver" value={doc.approvers_name || "—"} />
              <DetailRow label="Approval Comments" value={doc.approval_comments || "—"} />
              <DetailRow label="Approval Date" value={formatDate(doc.approval_date)} />
              {!hideFinancials && <DetailRow label="Fee Proposal Date" value={formatDate(doc.fee_proposal_date)} />}
              <DetailRow label="BSM Owner" value={doc.is_bsm_document_owner ? "Yes" : "No"} />
            </DetailColumn>
            {!hideCommentsAndLinks && <DetailColumn title="Comments & Links">
              <InlineDataverseField field="comments"><p className="text-xs text-slate-600 whitespace-pre-line">{doc.comments || '—'}</p></InlineDataverseField>
              <div className="space-y-1">
                {doc.link_to_file && <LinkRow href={doc.link_to_file} label="File" />}
                {doc.link_to_client_proposal && <LinkRow href={doc.link_to_client_proposal} label="Client Proposal" />}
                {doc.link_to_fee_proposal && !hideFinancials && <LinkRow href={doc.link_to_fee_proposal} label="Fee Proposal" />}
              </div>
            </DetailColumn>}
          </div>
          </DataverseRecordEdit>
        </div>
      )}
    </div>
  );
}

function DetailColumn({ title, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      {children}
    </div>
  );
}
function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-slate-500 shrink-0">{label}</span>
      <div className="min-w-0 text-slate-700 text-right"><InlineDataverseField label={label}>{value || "—"}</InlineDataverseField></div>
    </div>
  );
}
function LinkRow({ href, label }) {
  const field = { File: 'link_to_file', 'Client Proposal': 'link_to_client_proposal', 'Fee Proposal': 'link_to_fee_proposal' }[label];
  return <InlineDataverseField field={field} label={label}><a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
    <ExternalLink className="h-3 w-3" /> {label}
  </a></InlineDataverseField>;
}