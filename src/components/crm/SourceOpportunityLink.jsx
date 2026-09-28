import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
export default function SourceOpportunityLink({ projectId }) {
  const [source, setSource] = useState(null);
  useEffect(() => { base44.entities.CRMProjectLink.filter({ project_id: projectId }, { limit: 1 }).then(page => setSource(page.items[0] || null)); }, [projectId]);
  return source && <Link to={`/opportunities/${source.opportunity_id}`} className="inline-block text-sm text-primary hover:underline">Source opportunity →</Link>;
}