import React from 'react';
import ContractorFeeImport from '@/components/delivery/ContractorFeeImport';
import ContractorFeeTable from '@/components/delivery/ContractorFeeTable';
import { groupContractorFees, flattenContractorRows, CONTRACTOR_STAGES, contractorFeeId } from '@/components/delivery/contractorFeeRows';
export default function ContractorFeeBuilder({ projectId, fees, onChange }) {
  const list = Array.isArray(fees) ? fees : [];
  const rows = groupContractorFees(list);
  const commit = next => onChange(flattenContractorRows(next));
  const add = type => commit([...rows, { id: contractorFeeId(), type, description: '', supplier: '', amounts: {} }]);
  const remove = id => commit(rows.filter(row => row.id !== id));
  const update = (id, field, value) => commit(rows.map(row => row.id !== id ? row : CONTRACTOR_STAGES.includes(field)
    ? { ...row, amounts: { ...row.amounts, [field]: value } } : { ...row, [field]: value }));
  return <div className="space-y-3">
    <ContractorFeeImport projectId={projectId} onImport={imported => commit(groupContractorFees([...list, ...imported]))} />
    {!rows.length && <p className="text-xs text-muted-foreground">Add surveys and consultants with fees across RIBA 1–4, or authorised activities with one RIBA 5–7 fee.</p>}
    <ContractorFeeTable title="Surveys & investigations" rows={rows.filter(row => row.type === 'survey')} update={update} remove={remove} addLabel="Add survey" onAdd={() => add('survey')} />
    <ContractorFeeTable title="Consultants" rows={rows.filter(row => row.type === 'consultant')} update={update} remove={remove} addLabel="Add consultant" onAdd={() => add('consultant')} />
    <ContractorFeeTable title="Authorised activities" rows={rows.filter(row => row.type === 'authorised_activity')} activity update={update} remove={remove} addLabel="Add authorised activity" onAdd={() => add('authorised_activity')} />
  </div>;
}