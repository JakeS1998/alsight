import React from 'react';
import AlsightJourney from '@/components/journey/AlsightJourney';
import {projectStage} from '@/components/dashboard/pipelineStage';
export default function ProjectJourney({project,client,data,query,onSelect,compact}) {
  const delivery=data?.delivery || {},past=value=>!!value && Number.isFinite(Date.parse(value)) && Date.parse(value)<=Date.now();
  const active=delivery.handover_started_at || past(delivery.pc_achieved) || past(project.practical_completion_date) ? 'handover' : past(delivery.contract_start) || projectStage(project)==='RIBA 5–7' ? 'delivery' : 'project';
  return <AlsightJourney compact={compact} activeStage={active} links={{relationship:client ? `/accounts/${client.id}` : null,opportunity:data?.source ? `/opportunities/${data.source.opportunity_id}` : null,fee:()=>onSelect('delivery'),project:()=>onSelect('general'),delivery:()=>onSelect('delivery'),handover:()=>onSelect('handover')}} statuses={{relationship:client ? 'Linked organisation' : 'Organisation not linked',opportunity:query.isPending ? 'Checking connection…' : query.error ? 'Connection unavailable' : data?.source ? 'Linked opportunity' : 'No accessible source link',fee:project.submitted_proposal_id ? 'Submitted proposal recorded' : 'Review fee proposals'}}/>;
}