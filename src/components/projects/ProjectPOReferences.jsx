import React, { useEffect, useState } from 'react';
import { loadProjectPOs } from '@/components/projects/poLinking';
import { useAuth } from '@/lib/AuthContext';
import { INTERNAL_ROLES } from '@/lib/portal';

export default function ProjectPOReferences({ project, compact = false }) {
  const { user } = useAuth();
  const [refs, setRefs] = useState([]);
  const allowed = INTERNAL_ROLES.includes(user?.role);
  useEffect(() => {
    if (!allowed || !project.project_number) return;
    let active = true;
    loadProjectPOs(project).then(orders => {
      if (active) setRefs([...new Set(orders.map(o => o.project_ref).filter(ref => ref && ref !== project.project_number))].sort());
    }).catch(() => { if (active) setRefs([]); });
    return () => { active = false; };
  }, [allowed, project.id, project.project_number]);
  if (!allowed || !refs.length) return null;
  return <div className={compact ? 'text-xs text-slate-500' : 'mt-2 text-sm text-slate-600'}>
    <span className="font-semibold">Legal: {project.project_number} · PO project: </span>{refs.join(', ')}
  </div>;
}