import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, regionName } from '@/lib/portal';
import CapacityResponsibilityRecords from '@/components/dashboard/CapacityResponsibilityRecords';
export default function CapacityResponsibilityDetail({owner,role,options}) {
  return <div className="mt-2 space-y-3 rounded-md bg-secondary/50 p-3 text-xs">
    {owner.contactId && <Link to={`/people/${owner.contactId}`} className="font-semibold text-chart-2 underline">View person</Link>}
    <p>{owner.projects} live projects · {owner.near} with milestones within 30 days · {owner.demanding} in late design / construction · {owner.transitions} approaching late-stage completions</p>
    {role==='bdm' ? <p>{owner.opportunities} active opportunities · {formatCurrency(owner.pipelineValue)} recorded pipeline value · {owner.valuedOpportunities} with a value · {owner.clients} linked clients</p> : <p>{owner.administration} outstanding legal documents · {owner.dueDocuments} with dates in the next 90 days · {owner.warranties} outstanding warranties ({owner.dueWarranties} due within 90 days) · {owner.approvals} pending approvals on supported projects</p>}
    <p className="text-muted-foreground">{owner.regions.map(region=>`${regionName(region.id) || 'Region not recorded'}: ${region.count} projects`).join(' · ')}</p>
    <ul className="space-y-1 text-muted-foreground">{owner.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>
    {owner.overlaps.map(overlap=><div key={overlap.month}><p>{overlap.projects} projects have commitments in {new Date(overlap.month+'-01T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}; review coordination, not a confirmed diary clash.</p><div className="mt-1 flex flex-wrap gap-2">{overlap.records.map(record=><Link key={record.href} to={record.href} className="text-chart-2 underline">{record.label}</Link>)}</div></div>)}
    <CapacityResponsibilityRecords options={options} owner={owner.key} role={role}/>
  </div>;
}