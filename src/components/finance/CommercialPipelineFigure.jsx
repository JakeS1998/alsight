import React from 'react';
import { formatCurrency } from '@/lib/portal';
export default function CommercialPipelineFigure({query}) {
 return <div className="finance-hero-inner"><p className="finance-hero-label">Pipeline value</p>{query.isPending?<p className="finance-hero-note mt-4" role="status">Calculating pipeline value…</p>:query.error?<p className="finance-hero-note mt-4" role="alert">Pipeline value unavailable: {query.error.message}</p>:<><p className="finance-big">{formatCurrency(query.data.value)}</p><p className="finance-hero-note">{query.data.projects.toLocaleString('en-GB')} active, unfinished projects you can access. Submitted client proposals take precedence over project estimates; values exclude VAT.</p></>}</div>;
}