import React, { useEffect, useState } from 'react';
import { loadProjectPOs } from '@/components/projects/poLinking';
import { useAuth } from '@/lib/AuthContext';
import { INTERNAL_ROLES } from '@/lib/portal';

export default function ProjectPOReferences({ project }) {
  const { user } = useAuth();
  const [refs, setRefs] = useState([]);
  const sharedCode = Number(String(project.project_number || '').match(/(\d+)$/)?.[1]) > 600;
  const supplierCompanyNumber = user?.company_number || user?.data?.company_number;
  const allowed = INTERNAL_ROLES.includes(user?.role) || (user?.role === 'supplier' && !!supplierCompanyNumber);
  useEffect(() => {
    if (sharedCode || !allowed || !project.project_number) return;
    let active = true;
    loadProjectPOs(project, user?.role === 'supplier' ? supplierCompanyNumber : undefined).then(orders => {
      if (active) setRefs([...new Set(orders.map(o => o.project_ref).filter(ref => ref && ref !== project.project_number))].sort());
    }).catch(() => { if (active) setRefs([]); });
    return () => { active = false; };
  }, [sharedCode, allowed, project.id, project.project_number, supplierCompanyNumber, user?.role]);
  if (!project.project_number) return null;
  return <span className="inline-flex flex-wrap items-center gap-x-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-normal text-muted-foreground">
    <span>{sharedCode ? project.project_number : `Legal: ${project.project_number}`}</span>
    {!sharedCode && allowed && refs.length > 0 && <span>· PO project: {refs.join(', ')}</span>}
  </span>;
}