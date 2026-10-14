import React from 'react';

export default function PsoApprovalSource({ delivery, approverField, dateField }) {
  const scanned = delivery.pso_workbook_fields || [];
  const fields = [['Approved by', approverField], ['Date', dateField]];
  const sources = fields.map(([label, field]) => ({ label, source: delivery[field] ? (scanned.includes(field) ? 'Scan (PSO workbook)' : 'Manual entry') : 'Not entered' }));
  const entered = sources.filter(item => item.source !== 'Not entered');
  const source = !entered.length ? 'Not entered' : entered.every(item => item.source === entered[0].source) ? entered[0].source : 'Mixed';
  return <p className="mt-2 text-xs text-muted-foreground">Approval source: {source}{source === 'Mixed' && <span className="block">{sources.map(item => `${item.label}: ${item.source}`).join(' · ')}</span>}</p>;
}