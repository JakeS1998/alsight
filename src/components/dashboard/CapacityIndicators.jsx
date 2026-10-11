import React from 'react';
export default function CapacityIndicators({data}) {
  const indicators=[['Active projects',data.active],['Delivery suppliers',data.assigned],['Concentrated workloads',data.concentrated],['Upcoming commitments',data.upcoming]];
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{indicators.map(([label,value])=><div key={label} className="rounded-lg bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value.toLocaleString('en-GB')}</p></div>)}</div>;
}