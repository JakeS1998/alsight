import React, { useState } from 'react';
import { Bot, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import useRiskImport from '@/components/delivery/useRiskImport';
import RiskImportReview from '@/components/delivery/RiskImportReview';
import RiskPdfOptionsDialog from '@/components/delivery/RiskPdfOptionsDialog';
export default function RiskRegisterTools({ project, onImported }) {
  const { user } = useAuth();
  const importer = useRiskImport(project, onImported);
  const [expanded, setExpanded] = useState(false), [exporting, setExporting] = useState(''), [exportError, setExportError] = useState('');
  const [pdfOptions, setPdfOptions] = useState(false);
  const canImport = ['admin','director','bdm','bsm'].includes(user?.role);
  const download = async (format, certified = false) => {
    setExporting(format); setExportError('');
    try {
      const { data } = await base44.functions.invoke('exportRiskRegister', { projectId: project.id, format, ...(format === 'pdf' ? { certified } : {}) });
      if (data.error) throw new Error(data.error);
      const bytes = Uint8Array.from(atob(data.content), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: data.mime })); const link = document.createElement('a');
      link.href = url; link.download = data.filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      if (format === 'pdf') setPdfOptions(false);
    } catch (e) { setExportError(e.response?.data?.error || e.message || 'Unable to download register.'); }
    finally { setExporting(''); }
  };
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">{canImport && <Button type="button" variant="outline" disabled={!!importer.busy} onClick={() => setExpanded(v => !v)}><Bot />ALICE: Import risk register</Button>}{['pdf','xlsx'].map(format => <Button key={format} type="button" variant="outline" disabled={!!exporting} onClick={() => { if (format === 'pdf') { setExportError(''); setPdfOptions(true); } else download(format); }}><Download />{exporting === format ? 'Preparing…' : `Download ${format === 'xlsx' ? 'Excel' : 'PDF'}`}</Button>)}</div>
    {expanded && canImport && <form onSubmit={importer.analyse} className="space-y-3 rounded-lg border border-border bg-muted/40 p-4"><p className="text-sm">ALICE will read your register and populate the relevant fields for review before anything is saved.</p><label className="block text-xs text-muted-foreground">PDF, Word (.docx), Excel (.xlsx) or CSV · up to 10 MB · maximum 100 risks per upload<input key={importer.file ? 'selected' : 'empty'} type="file" accept=".pdf,.docx,.xlsx,.csv" disabled={!!importer.busy} onChange={e => importer.setFile(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm" /></label><p className="text-xs text-muted-foreground">Uploads are private. ALICE does not invent missing owners, scores or costs.</p><Button type="submit" disabled={!!importer.busy || !importer.file}>{importer.busy === 'analysing' ? 'ALICE is interpreting…' : 'Interpret with ALICE'}</Button>{importer.rows.length > 0 && !importer.review && <Button type="button" variant="outline" disabled={!!importer.busy} onClick={() => importer.setReview(true)}>Reopen draft</Button>}</form>}
    {(importer.error && !importer.review || exportError) && <p role="alert" className="text-sm text-destructive">{exportError || importer.error}</p>}
    {importer.notice && <p role="status" className="text-sm text-muted-foreground">{importer.notice}</p>}
    <RiskImportReview importer={importer} />
    <RiskPdfOptionsDialog open={pdfOptions} onOpenChange={setPdfOptions} busy={exporting === 'pdf'} error={exportError} onDownload={certified => download('pdf', certified)} />
  </div>;
}