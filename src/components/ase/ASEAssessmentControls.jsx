import React from 'react';
import ASEAutomationPanel from '@/components/ase/ASEAutomationPanel';
export default function ASEAssessmentControls({accountId,data}) {
  if(!data.model) return <p className="rounded-lg border border-border p-4 text-sm">Automatic ASE supports UK Limited Companies, UK PLCs and English Local Authorities. Set a supported organisation type in Account details first.</p>;
  return <ASEAutomationPanel accountId={accountId}/>;
}