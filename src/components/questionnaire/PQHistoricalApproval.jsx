import React from 'react';
export default function PQHistoricalApproval({record,recordedApproval}) {
 const answers=record?.answers||{},date=answers.access_date||recordedApproval?.approvedAt;
 if(!recordedApproval&&!answers.access_name&&!answers.access_position&&!date)return null;
 return <div className="space-y-3 rounded-lg border border-border bg-card p-4" aria-label="Historical questionnaire approval">
  <div className="flex flex-wrap items-center justify-between gap-2"><h5 className="text-sm font-bold">Recorded historical approval</h5><span className={recordedApproval?'text-sm font-semibold text-success':'text-sm text-muted-foreground'}>{recordedApproval?'Approved':'Source details recorded'}</span></div>
  <dl className="grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-xs text-muted-foreground">Approver</dt><dd className="mt-1 font-semibold">{answers.access_name||'Name not recorded'}</dd></div><div><dt className="text-xs text-muted-foreground">Position</dt><dd className="mt-1">{answers.access_position||'Not recorded'}</dd></div><div><dt className="text-xs text-muted-foreground">Approval date</dt><dd className="mt-1">{date&&Number.isFinite(Date.parse(date))?new Date(date).toLocaleDateString('en-GB'):'Not recorded'}</dd></div></dl>
  <p className="text-xs text-muted-foreground">Recorded from {record?.source_import?.document_name||recordedApproval?.source||'the existing questionnaire'}. This is historical evidence, not a new email-verified decision.</p>
 </div>;
}