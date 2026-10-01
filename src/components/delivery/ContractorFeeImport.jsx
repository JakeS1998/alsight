import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, Loader2 } from 'lucide-react';
import ContractorImportRows from '@/components/delivery/ContractorImportRows';
export default function ContractorFeeImport({ projectId, onImport }) {
  const [busy, setBusy] = useState(false), [rows, setRows] = useState([]), [note, setNote] = useState(''), [error, setError] = useState(''), [open, setOpen] = useState(false), [notice, setNotice] = useState('');
  const analyse = async file => {
    setError(''); setNotice('');
    if (!file) return;
    if (!/\.(pdf|xlsx)$/i.test(file.name) || file.size > 10 * 1024 * 1024) { setError('Choose Excel (.xlsx) or PDF, up to 10 MB.'); return; }
    setBusy(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { data } = await base44.functions.invoke('interpretContractorFees', { projectId, fileUri: file_uri });
      if (data.error) throw new Error(data.error);
      if (!data.fees?.length) throw new Error('No contractor fee lines found. Try another file or add them manually.');
      setRows(data.fees.map(row => ({ ...row, id: crypto.randomUUID(), selected: true })));
      setNote(data.note || ''); setOpen(true);
    } catch (e) { setError(e.response?.data?.error || e.message || 'Unable to interpret the file.'); }
    finally { setBusy(false); }
  };
  const add = () => {
    const selected = rows.filter(row => row.selected);
    if (!selected.length) { setError('Select at least one line.'); return; }
    if (selected.some(row => !row.type || !row.stage || !row.description.trim() || row.amount === '' || !Number.isFinite(Number(row.amount)) || Number(row.amount) < 0 || (row.type === 'authorised_activity' ? row.stage !== 'riba_5_7' : row.stage === 'riba_5_7'))) { setError('Complete category, stage, description and a valid base fee for each selected line.'); return; }
    onImport(selected.map(({ selected, ...row }) => ({ ...row, amount: Number(row.amount) })));
    setOpen(false); setRows([]); setError(''); setNotice(`${selected.length} lines added. Save team to keep your changes.`);
  };
  return <div className="space-y-2">
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{busy ? 'Interpreting fees…' : 'Import Excel / PDF'}
      <input aria-label="Import contractor fees" type="file" accept=".xlsx,.pdf" disabled={busy || !projectId} className="hidden" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; analyse(file); }} />
    </label>
    {error && !open && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm text-success">{notice}</p>}
    <Dialog open={open} onOpenChange={value => { setOpen(value); setError(''); }}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Review contractor fee import</DialogTitle></DialogHeader>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{note} Review the categories, stages and base fees before adding. Existing entries will not be replaced; OHP is set separately.</p>
      <ContractorImportRows rows={rows} setRows={setRows} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" onClick={() => { setOpen(false); setError(''); }}>Cancel</Button><Button type="button" onClick={add}>Add selected lines</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}