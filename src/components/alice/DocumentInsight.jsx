import React from 'react';
import useProject360 from '@/components/projects/useProject360';
import AliceInsight from '@/components/alice/AliceInsight';
export default function DocumentInsight({ project, legalDocs, dmas, jcts, warranties }) {
  const { data, isPending, error } = useProject360(project);
  if (isPending) return <p role="status" className="text-sm text-muted-foreground">Loading ALICE Insight…</p>;
  if (error) return <AliceInsight statements={[{ text: 'Document position could not be established from the accessible records.' }]} />;
  const to = `/projects/${project.id}?tab=drafting`;
  const warrantyTo = `/projects/${project.id}?tab=warranties`;
  const statements = [{ text: !data.legalTotal ? 'No applicable legal records are recorded.' : data.legalPending ? `${data.legalPending} of ${data.legalTotal} recorded applicable legal documents have no execution or PO evidence.` : 'All recorded applicable legal documents have execution or PO evidence.', to }, { text: `${data.outstanding} active warranties remain outstanding. Product warranties are excluded.`, to: warrantyTo }];
  const evidence = [...legalDocs, ...dmas, ...jcts].map(d => ({ text: `${d.document_id || 'Agreement'} — ${d.executed === 'yes' || d.date_of_execution ? 'Executed' : d.executed === 'po' ? 'PO issued' : 'Execution not recorded'}${d.status === 'inactive' ? ' — superseded/inactive' : ''}`, to }));
  evidence.push(...warranties.map(w => ({ text: `${w.warranty_id || 'Warranty'} — ${w.category || 'Category not recorded'} — ${(w.warranty_status || 'Status not recorded').replaceAll('_', ' ')}${w.status === 'inactive' ? ' — inactive' : ''}`, to: warrantyTo })));
  return <AliceInsight statements={statements} evidence={evidence} detail="The legal position reflects applicable recorded documents, including executed inactive records. It does not establish that every required agreement is present. Warranty totals exclude inactive, executed and product warranties and records with an execution date." />;
}