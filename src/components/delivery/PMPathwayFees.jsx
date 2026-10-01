import React from 'react';
import ContractorBuildUp from '@/components/delivery/ContractorBuildUp';
import { formatCurrency } from '@/lib/portal';
import { taskMemberAmounts } from '@/components/delivery/singleTaskFees';
import frameworkAgreementRoute from '@/components/delivery/frameworkAgreementRoute';

export default function PMPathwayFees({ data, project }) {
  const single = frameworkAgreementRoute(data.legalDocs, data.dmas, project.project_number).route === 'single_task';
  const ohp = data.contractorOhp;
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Contractor delivery costs only. Alliance fees, margins, FSF and other suppliers’ fees are restricted.</p>
    <p className="text-sm">Current proposal status: <strong>{data.feeProposals[0]?.status?.replaceAll('_', ' ') || 'Not recorded'}</strong></p>
    {!data.contractors.length ? <p className="text-sm text-muted-foreground">No contractor costs recorded yet.</p> : single ? data.contractors.map((member, index) => {
      const amounts = taskMemberAmounts(member);
      return <div key={index} className="rounded-lg border border-border p-3 text-sm"><strong>{member.name}</strong><p>Task fee: {formatCurrency(amounts.total)} (including OHP: {formatCurrency(amounts.ohp)})</p></div>;
    }) : <>
      <ContractorBuildUp deliveryTeam={data.contractors} ohpSurveysPct={ohp.ohp_surveys_pct} ohpRiba57Pct={ohp.ohp_riba57_pct} ohpSurveysType={ohp.ohp_surveys_type} ohpSurveysFixed={ohp.ohp_surveys_fixed} />
      {data.contractors.map((member, index) => <div key={index} className="space-y-2 text-sm"><h4 className="font-semibold">{member.name}</h4>{member.contractor_fees?.map((fee, i) => <div key={i} className="flex justify-between gap-4 border-b border-border py-2"><span>{fee.description || fee.type?.replaceAll('_', ' ') || 'Contractor activity'} · {fee.stage?.replaceAll('_', ' ').toUpperCase() || 'RIBA 5–7'}</span><span className="shrink-0 tabular-nums">{formatCurrency(fee.amount)}</span></div>)}</div>)}
    </>}
  </div>;
}