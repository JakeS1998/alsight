import React from 'react';
import useDeliveryCapacity from '@/components/dashboard/useDeliveryCapacity';
import CapacityResponsibilityPanel from '@/components/dashboard/CapacityResponsibilityPanel';
import CapacityManagementInsights from '@/components/dashboard/CapacityManagementInsights';
export default function CapacityOrganisation({options,view}) {
  const query=useDeliveryCapacity({...options,action:'intelligence'});
  if(query.isPending)return <p role="status" className="text-xs text-muted-foreground">Loading responsibility intelligence…</p>;
  if(query.error)return <p role="alert" className="text-xs text-destructive">{query.error.message} <button onClick={()=>query.refetch()} className="underline">Try again</button></p>;
  const data=query.data?.organisation;
  if(!data)return null;
  return <div className="space-y-4">{view==='responsibilities' ? <div className="grid gap-5 xl:grid-cols-2"><CapacityResponsibilityPanel data={data.bdm} role="bdm" options={options}/><CapacityResponsibilityPanel data={data.bsm} role="bsm" options={options}/></div> : <CapacityManagementInsights data={data}/>}
    <details className="rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground"><summary className="cursor-pointer font-semibold text-foreground">Criteria, visibility and evidence limits</summary><p className="mt-2">BDMs and BSMs are assessed separately, alphabetically, not ranked. Concentrated means a person owns more of a measured responsibility than the rest of the visible scope combined. Potential dependency additionally requires repeated records for a client attributed solely to that person in the same role. This is a continuity review prompt, not proof that no deputy exists. Balanced means no majority concentration in measured responsibilities, not equal effort or spare capacity. Fewer than two identifiable role peers, or unresolved identities, means insufficient information.</p><ul className="mt-2 space-y-1">{data.limitations.map(text=><li key={text}>{text}</li>)}</ul><p className="mt-2">{data.gaps.missingBdm} missing BDM · {data.gaps.missingBsm} missing BSM · {data.gaps.missingManager} missing project manager · {data.gaps.missingProgramme} without usable programme evidence · {data.gaps.missingStart} without a recorded start · {data.gaps.unresolved} unresolved staff references.</p></details>
  </div>;
}