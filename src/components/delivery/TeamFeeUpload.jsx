import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload } from 'lucide-react';
import FeeProposalDocumentLink from '@/components/delivery/FeeProposalDocumentLink';
export default function TeamFeeUpload({ projectId, member, supplier, singleTask, onPatch, onBusy, disabled }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const analyse = async file => {
    if (!file) return;
    setError(''); setNotice('');
    const contractor = member.role?.trim().toLowerCase() === 'contractor' && !singleTask;
    if (!(contractor ? /\.(pdf|xlsx)$/i : /\.(pdf|docx|xlsx|csv)$/i).test(file.name) || file.size > 10 * 1024 * 1024) { setError(contractor ? 'Choose a PDF or Excel (.xlsx) proposal, up to 10 MB.' : 'Choose PDF, Word (.docx), Excel (.xlsx) or CSV, up to 10 MB.'); return; }
    if (!member.role) { setError('Select the team member’s role before uploading.'); return; }
    setBusy(true); onBusy(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      onPatch({ fee_proposal_link: file_uri });
      const { data } = await base44.functions.invoke(contractor ? 'interpretContractorFees' : 'interpretTeamFees', { projectId, fileUri: file_uri, ...(contractor ? {} : { role: member.role, supplier: supplier || '', singleTask: !!singleTask }) });
      if (data.error) throw new Error(data.error);
      if (contractor) {
        const fees = (data.fees || []).filter(row => row.type && row.stage && row.amount !== '' && Number.isFinite(Number(row.amount)) && (row.type === 'authorised_activity' ? row.stage === 'riba_5_7' : row.stage !== 'riba_5_7')).map(row => ({ ...row, id: crypto.randomUUID() }));
        if (fees.length) onPatch({ contractor_fees: fees });
        setNotice(`${fees.length ? 'Fee boxes populated.' : 'No clearly allocated fees found; existing values are unchanged.'} ${(data.fees || []).length > fees.length ? 'Some lines need manual allocation. ' : ''}${data.note || ''} Review and edit the values, then Save team.`);
      } else {
        if (data.found) onPatch(data.patch);
        setNotice(`${data.found ? 'Fee boxes populated.' : 'No clearly allocated fees found; existing values are unchanged.'} ${data.note || ''} Review and edit the values, then Save team.`);
      }
    } catch (e) { setError(e.response?.data?.error || e.message || 'Unable to scan the proposal. You can enter fees manually.'); }
    finally { setBusy(false); onBusy(false); }
  };
  return <div className="space-y-1"><div className="flex min-h-10 flex-wrap items-center gap-3">
    {member.fee_proposal_link && <FeeProposalDocumentLink uri={member.fee_proposal_link} />}
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{busy ? 'Scanning fees…' : member.fee_proposal_link ? 'Replace & scan' : 'Upload & scan'}
      <input aria-label="Upload and scan supplier fee proposal" type="file" accept={member.role?.toLowerCase() === 'contractor' && !singleTask ? '.pdf,.xlsx' : '.pdf,.docx,.xlsx,.csv'} className="hidden" disabled={busy || disabled || !projectId} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; analyse(file); }} />
    </label></div>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}{notice && <p role="status" className="whitespace-pre-wrap text-xs text-muted-foreground">{notice}</p>}</div>;
}