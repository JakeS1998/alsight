import React, { useState } from 'react';
import useValuationDocuments from '@/components/valuations/useValuationDocuments';
import ValuationIssueForm from '@/components/valuations/ValuationIssueForm';
import ValuationIssueHistory from '@/components/valuations/ValuationIssueHistory';

const TYPES = [
  { key: 'payment_notice', label: 'Payment Notice' },
  { key: 'interim_certificate', label: 'Interim Certificate' },
  { key: 'statement_of_retention', label: 'Statement of Retention' },
];

export default function ValuationExport({ value }) {
  const docs = useValuationDocuments(value);
  const { busy, error } = docs;
  const [issuing, setIssuing] = useState('');
  const issue = async (type, confirmation) => { if (await docs.generate(type, confirmation)) setIssuing(''); };

  return <section className="rounded-2xl border border-border bg-card p-5">
    <h3 className="font-heading font-semibold text-als-navy">Generate document</h3>
    <p className="mt-1 text-xs text-muted-foreground">Preview notices and certificates are drafts, not issued documents. Formal issue requires valuation approval and the assigned PM's per-issue confirmation of contractual authority; issue here does not constitute service.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {TYPES.map(t => <button type="button" key={t.key} disabled={!!busy} onClick={() => docs.generate(t.key)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50">
        {busy === t.key ? 'Generating…' : `${t.key === 'statement_of_retention' ? '' : 'Preview draft: '}${t.label}`}
      </button>)}
    </div>
    {docs.canIssue && <div className="mt-3 flex flex-wrap gap-2">{TYPES.slice(0, 2).map(t => <button type="button" key={t.key} disabled={!!busy} onClick={() => { docs.clearError(); setIssuing(t.key); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Authorise and issue {t.label}</button>)}</div>}
    {!docs.loading && !docs.canIssue && <p className="mt-2 text-xs text-muted-foreground">Only the assigned PM can formally issue an approved valuation's notice or certificate.</p>}
    {error && !issuing && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    {issuing && <ValuationIssueForm key={issuing} type={issuing} busy={busy} error={error} onClose={() => setIssuing('')} onIssue={issue} />}
    <ValuationIssueHistory issues={docs.issues} loading={docs.loading} hasMore={docs.hasMore} onMore={docs.more} onCopy={docs.copy} busy={busy} />
  </section>;
}