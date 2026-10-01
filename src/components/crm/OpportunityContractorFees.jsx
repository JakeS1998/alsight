import React from 'react';
import ContractorFeeBuilder from '@/components/delivery/ContractorFeeBuilder';
import ContractorStageOhp from '@/components/delivery/ContractorStageOhp';
const STAGES = ['riba_1', 'riba_2', 'riba_3', 'riba_4', 'riba_5_7'];
export default function OpportunityContractorFees({ member, onChange, readOnly }) {
  const fees = member.contractor_fees || STAGES.filter(stage => Number(member.fees?.[stage]) > 0).map(stage => ({ id: `legacy-${stage}`, stage, type: stage === 'riba_5_7' ? 'authorised_activity' : 'survey', amount: Number(member.fees[stage]) }));
  return <fieldset disabled={readOnly} className="space-y-3">
    <ContractorFeeBuilder fees={fees} onChange={value => onChange({ contractor_fees: value })} />
    <ContractorStageOhp member={member} onChange={value => onChange({ contractor_ohp: value })} />
  </fieldset>;
}