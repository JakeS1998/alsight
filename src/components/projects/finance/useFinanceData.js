import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { filterAll } from '@/components/data/loadAll';

// Loads all commercial data sources for the Finance tab in one pass.
export function useFinanceData(project) {
  const [data, setData] = useState({ loading: true });
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [deliveries, decisions, feeProposals, valuations, jcts, dmas] = await Promise.all([
          filterAll(base44.entities.ProjectDelivery, { project_id: project.id }).catch(() => []),
          filterAll(base44.entities.ProjectDecision, { project_id: project.id }).catch(() => []),
          filterAll(base44.entities.FeeProposal, { project_id: project.id }).catch(() => []),
          filterAll(base44.entities.Valuation, { project_id: project.id }).catch(() => []),
          filterAll(base44.entities.JCT, { project_id: project.dataverse_id }).catch(() => []),
          filterAll(base44.entities.DMA, { project_id: project.dataverse_id }).catch(() => []),
        ]);
        if (active) setData({ deliveries, decisions, feeProposals, valuations, jcts, dmas, loading: false });
      } catch {
        if (active) setData({ loading: false });
      }
    })();
    return () => { active = false; };
  }, [project.id, project.dataverse_id]);
  return data;
}