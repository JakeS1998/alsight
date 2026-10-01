import React from 'react';
import { contractorBuildUp } from '@/components/delivery/contractorBuildUp';
import ContractorStageSummary from '@/components/delivery/ContractorStageSummary';

export default function ContractorBuildUp({ deliveryTeam, ohpSurveysPct, ohpRiba57Pct, ohpSurveysType = 'percentage', ohpSurveysFixed = 0 }) {
  const build = contractorBuildUp(deliveryTeam, ohpSurveysPct, ohpRiba57Pct, ohpSurveysType, ohpSurveysFixed);
  if (!build.hasContractor) return <div className="rounded-lg border border-dashed border-border bg-muted p-3 text-sm text-muted-foreground">No contractor in the Delivery Team. Add a contractor with fees per RIBA stage to build up their fee.</div>;
  return <ContractorStageSummary build={build} />;
}