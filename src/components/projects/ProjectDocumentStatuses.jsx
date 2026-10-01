import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import agreementNames from '@/components/projects/agreementNames';

const types = [
  ['pcsa', 'PCSA'],
  ['aa', 'Access Agreement (AA)'],
  ['dma', 'Development Management Agreement (DMA)'],
  ['jct', 'JCT'],
];

export default function ProjectDocumentStatuses({ projectId, projectNumber }) {
  const [statuses, setStatuses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setStatuses(null);
    setError('');
    base44.functions.invoke('manageValuation', { action: 'document_status', projectId })
      .then(({ data }) => { if (active) setStatuses(data.statuses); })
      .catch(() => { if (active) setError('Unable to load document statuses.'); });
    return () => { active = false; };
  }, [projectId]);

  return <section className="rounded-xl border border-slate-200 bg-white p-5">
    <h3 className="mb-4 text-sm font-semibold text-slate-900">Agreement & contract status</h3>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !statuses ? <p role="status" className="text-sm text-slate-500">Loading statuses…</p> :
      <div className="grid gap-3 sm:grid-cols-2">
        {types.map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
          <span className="text-sm font-medium text-slate-700">{key === 'aa' ? `${agreementNames(projectNumber).access} (${agreementNames(projectNumber).accessShort})` : key === 'dma' ? `${agreementNames(projectNumber).development} (${agreementNames(projectNumber).developmentShort})` : label}</span>
          <span className="text-sm text-slate-600">{statuses[key] || 'Not recorded'}</span>
        </div>)}
      </div>}
  </section>;
}