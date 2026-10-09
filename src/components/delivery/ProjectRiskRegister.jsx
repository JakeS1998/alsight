import React, { useState } from 'react';
import { RegisterList } from '@/components/delivery/RegisterList';
import { RISK_COLUMNS, prepareRisk } from '@/components/delivery/riskRegisterColumns';
import RiskRegisterGuidance from '@/components/delivery/RiskRegisterGuidance';
import RiskRegisterTools from '@/components/delivery/RiskRegisterTools';
import { projectStage } from '@/components/dashboard/pipelineStage';
import { FormSection } from '@/components/forms/PowerForm';
import RiskHeatLegend from '@/components/delivery/RiskHeatLegend';
import RiskRegisterApprovals from '@/components/delivery/RiskRegisterApprovals';
export default function ProjectRiskRegister({ project, delivery, accountMap }) {
  const [revision, setRevision] = useState(0);
  return <FormSection title="08 · De-risk">
    <div><p className="text-sm text-muted-foreground">{project.name} · {projectStage(project)}</p><p className="mt-2 text-xs text-muted-foreground">Client: {project.client_name || accountMap[project.client_account_id]?.name || 'Not recorded'} · Contractor: {delivery.contractor || 'Not recorded'}</p></div>
    <RiskRegisterGuidance />
    <RiskHeatLegend />
    <RiskRegisterTools key={project.id} project={project} onImported={() => setRevision(v => v + 1)} />
    <RegisterList key={`${project.id}-${revision}`} title="Risk" description="Alliance Leisure risk register" entityName="ProjectRisk" projectId={project.id} project={project} columns={RISK_COLUMNS} tableColumns={RISK_COLUMNS.filter(column => column.key !== 'status').map(column => column.key)} preparePayload={prepareRisk} paginated sortable sortBy="reference" addLabel="Add risk" />
    <RiskRegisterApprovals project={project} />
  </FormSection>;
}