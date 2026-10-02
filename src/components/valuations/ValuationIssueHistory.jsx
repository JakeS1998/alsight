import React from 'react';
import { formatDateTime } from '@/lib/portal';
export default function ValuationIssueHistory({ issues, loading, hasMore, onMore, onCopy, busy }) {
  return <section className="mt-5 border-t border-border pt-4"><h4 className="text-sm font-semibold">Issued document history</h4>
    {loading && <p role="status" className="mt-2 text-sm text-muted-foreground">Loading issue history…</p>}
    {!loading && !issues.length && <p className="mt-2 text-sm text-muted-foreground">No formally issued documents recorded. Earlier downloads have no recorded issuer.</p>}
    <div className="mt-3 space-y-3">{issues.map(issue => <div key={issue.id} className="rounded-lg bg-muted p-3 text-sm">
      <p className="font-medium">{issue.document_type === 'payment_notice' ? 'Payment Notice' : 'Interim Certificate'}</p>
      <p>Authorised by {issue.authorised_by_name} · {formatDateTime(issue.authorised_at)}</p>
      <p>Issued by {issue.issued_by_name} · {formatDateTime(issue.issued_at)}</p>
      <p className="text-xs text-muted-foreground">For {issue.named_authorised_party} · {issue.issuer_organisation}</p>
      <p className="mt-1 break-words text-xs">Contract: {issue.contract_reference} · Authority: {issue.authority_clause}</p>
      <p className="mt-1 break-all text-xs text-muted-foreground">Issue reference: {issue.issue_reference}</p>
      <button type="button" disabled={!!busy} onClick={() => onCopy(issue.id)} className="mt-2 text-xs font-medium text-als-navy-light underline disabled:opacity-50">{busy === issue.id ? 'Opening…' : 'Download archived copy'}</button>
    </div>)}</div>
    {hasMore && <button type="button" disabled={loading} onClick={onMore} className="mt-3 text-sm underline">Load more</button>}
  </section>;
}