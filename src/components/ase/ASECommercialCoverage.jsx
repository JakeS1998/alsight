import React from 'react';
export default function ASECommercialCoverage({data}) {
  return <dl className="mb-4 grid grid-cols-3 gap-3 text-xs">
    {[['Contracts included',data.included_count],['Contracts excluded',data.excluded_count],['Turnover confidence',data.turnover?.status==='available' ? data.turnover.confidence || 'Not recorded' : 'Unavailable']].map(([label,value])=><div key={label} className="rounded-md border border-border bg-muted p-3"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 text-base font-semibold">{value ?? 'Not recorded'}</dd></div>)}
  </dl>;
}