import React from 'react';
import COAccess from '@/components/contingency/live/COAccess';
import COPilotAcceptance from '@/components/contingency/live/COPilotAcceptance';
import COCustomSource from '@/components/contingency/live/COCustomSource';
import COStandbyPolicy from '@/components/contingency/live/COStandbyPolicy';
import COApprovedSourceForm from '@/components/contingency/live/COApprovedSourceForm';
import COApprovedSources from '@/components/contingency/live/COApprovedSources';
export default function COSources({data,run,busy}){
 return <div className="space-y-4"><COStandbyPolicy data={data} run={run} busy={busy}/><COApprovedSourceForm key={data.config.mode} data={data} run={run} busy={busy}/><COApprovedSources data={data} run={run} busy={busy}/><COCustomSource key={data.config.mode+'-custom'} mode={data.config.mode} run={run} busy={busy}/><COAccess data={data} run={run} busy={busy}/><COPilotAcceptance data={data} run={run} busy={busy}/></div>;
}