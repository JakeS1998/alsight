import React from 'react';
export default function FinanceCoverageGauges({data}) {
  const kinds=[['purchase_orders','Purchase orders'],['line_items','PO line items'],['invoices','Sales invoices']];
  return <div className="finance-gauges">{kinds.map(([kind,label])=>{
    const row=data.coverage.find(t=>t.kind===kind), available=!!row?.active, percent=available?row.valued/row.active*100:0;
    return <div key={kind} className="finance-gauge"><div className={`finance-ring ${available?'':'finance-ring-unavailable'}`} style={available?{background:`conic-gradient(hsl(var(--${percent>0?'als-navy':'destructive'})) 0 ${percent||100}%, hsl(var(--secondary)) 0)`}:undefined}><span className={!available?'text-destructive':''}>{available?`${row.valued.toLocaleString('en-GB')} / ${row.active.toLocaleString('en-GB')}`:'Unavailable'}</span></div><p className="finance-small">{label}{available?' have net values':''}</p></div>;
  })}</div>;
}