import React from 'react';
export default function AssessmentMovement({history,signals,expanded=false}) {
  const previous=history?.[1];
  if(!previous) return <p className="mt-2 text-xs text-muted-foreground">No earlier comparable observation. History starts with accessible Overview observations.</p>;
  const current=history[0],changed=signals.map(s=>{const old=previous.signals.find(p=>p.label===s.label);return old && old.value!==String(s.value) ? `${s.label}: ${old.value} → ${s.value}` : null;}).filter(Boolean);
  const date=new Date(previous.observed_at).toLocaleString('en-GB');
  if(!expanded) return <p className="mt-2 text-xs text-muted-foreground">{previous.classification!==current.classification ? `${previous.classification} → ${current.classification}` : 'Classification unchanged'} · compared with {date}</p>;
  return <div className="mt-4 rounded-lg bg-muted p-3"><h3 className="text-xs font-semibold">What changed since {date}</h3>{changed.length ? <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{changed.map(c=><li key={c}>{c}</li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">No comparable signal values changed.</p>}<p className="mt-2 text-[10px] text-muted-foreground">Observed snapshots, not continuous monitoring. Comparisons use your current role and the same assessment methodology; no historical numerical scores are inferred.</p></div>;
}