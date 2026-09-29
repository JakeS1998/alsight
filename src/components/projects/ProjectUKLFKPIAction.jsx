import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ProjectUKLFKPIAction({ projectId, onEdit }) {
  const [hasReport, setHasReport] = useState(false);

  useEffect(() => {
    let active = true;
    setHasReport(false);
    base44.functions.invoke('getStakeholderFrameworkReport', { projectId })
      .then(({ data }) => { if (active) setHasReport(Boolean(data.report)); })
      .catch(() => { if (active) setHasReport(false); });
    return () => { active = false; };
  }, [projectId]);

  if (!hasReport) return null;
  return <button type="button" onClick={onEdit} className="rounded-md border border-input bg-white px-3 py-1.5 text-sm font-medium text-als-navy hover:bg-muted">Edit UKLF KPIs</button>;
}