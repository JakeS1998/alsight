import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

const TYPES = [
  { key: 'payment_notice', label: 'Payment Notice' },
  { key: 'interim_certificate', label: 'Interim Certificate' },
  { key: 'statement_of_retention', label: 'Statement of Retention' },
];

export default function ValuationExport({ value }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const generate = async (type) => {
    setBusy(type); setError('');
    try {
      const res = await base44.functions.invoke('exportValuation', { valuationId: value.id, projectId: value.project_id, documentType: type });
      const data = res.data || res;
      if (data.error) { setError(data.error); return; }
      const binary = atob(data.content);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = data.filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to generate document');
    } finally { setBusy(''); }
  };

  return <section className="rounded-2xl border border-border bg-card p-5">
    <h3 className="font-heading font-semibold text-als-navy">Generate document</h3>
    <p className="mt-1 text-xs text-muted-foreground">Produce a formal PDF using the project manager's company branding and current valuation figures.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {TYPES.map(t => <button key={t.key} disabled={!!busy} onClick={() => generate(t.key)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50">
        {busy === t.key ? 'Generating\u2026' : t.label}
      </button>)}
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </section>;
}