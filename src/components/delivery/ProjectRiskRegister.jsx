import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { RegisterList } from '@/components/delivery/RegisterList';
import { RISK_COLUMNS, prepareRisk } from '@/components/delivery/riskRegisterColumns';
import RiskRegisterGuidance from '@/components/delivery/RiskRegisterGuidance';
import RiskRegisterTools from '@/components/delivery/RiskRegisterTools';
const riskCurrency = value => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(value);
import { projectStage } from '@/components/dashboard/pipelineStage';
import { FormSection } from '@/components/forms/PowerForm';
import RiskHeatLegend from '@/components/delivery/RiskHeatLegend';
import RiskRegisterApprovals from '@/components/delivery/RiskRegisterApprovals';
export default function ProjectRiskRegister({ project, delivery, accountMap }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [revision, setRevision] = useState(0);
  const key = ['risk-contingency', user?.id, user?.role, project.id];
  const total = useQuery({ queryKey: key, queryFn: () => base44.entities.ProjectRisk.aggregate({ query: { project_id: project.id, owner: 'Client', status: 'open' }, sum: 'weighted_cost' }) });
  const refresh = () => client.invalidateQueries({ queryKey: key });
  useEffect(() => base44.entities.ProjectRisk.subscribe(refresh), [project.id, user?.id, user?.role]);
  return <FormSection title="08 · De-risk">
    <div><p className="text-sm text-muted-foreground">{project.name} · {projectStage(project)}</p><p className="mt-2 text-xs text-muted-foreground">Client: {project.client_name || accountMap[project.client_account_id]?.name || 'Not recorded'} · Contractor: {delivery.contractor || 'Not recorded'}</p></div>
    <RiskRegisterGuidance />
    <RiskHeatLegend />
    <RiskRegisterTools key={project.id} project={project} onImported={() => { setRevision(v => v + 1); refresh(); }} />
    <RegisterList key={`${project.id}-${revision}`} title="Risk" description="Alliance Leisure risk register" entityName="ProjectRisk" projectId={project.id} project={project} columns={RISK_COLUMNS} tableColumns={RISK_COLUMNS.filter(column => column.key !== 'status').map(column => column.key)} preparePayload={prepareRisk} onChanged={refresh} paginated sortable sortBy="reference" addLabel="Add risk" />
    {total.isPending ? <p role="status" className="text-sm text-muted-foreground">Calculating client contingency…</p> : total.error ? <p role="alert" className="text-sm text-destructive">Unable to calculate client contingency.</p> : <p className="text-sm font-medium">Proposed client contingency: {riskCurrency(total.data?.rows[0]?.sum_weighted_cost || 0)}<span className="block text-xs font-normal text-muted-foreground">Active Client-owned risks with recorded weighted costs only; existing unscored risks must be reviewed.</span></p>}
    <RiskRegisterApprovals project={project} />
  </FormSection>;
}