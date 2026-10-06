import React from 'react';
const tones={strong:'bg-success/10 text-success',developing:'bg-chart-2/10 text-chart-2',cooling:'bg-primary/15 text-foreground',new:'bg-chart-4/25 text-foreground',limited:'bg-muted text-muted-foreground',established:'bg-success/10 text-success'};
export default function RelationshipStrength({profile,last}) {
  const days=last ? (Date.now()-Date.parse(last))/86400000 : null,value=profile?.relationship_strength || (days===null ? 'new' : days>90 ? 'cooling' : 'developing');
  return <span title={profile?.relationship_strength ? 'User Set · not a risk score' : 'System Suggested · based only on recorded interaction recency, not sentiment'} className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${tones[value] || tones.limited}`}>{value}</span>;
}