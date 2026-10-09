import React from 'react';
import projectFullValue from '@/components/projects/projectFullValue';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import useProject360 from '@/components/projects/useProject360';
import project360Summary from '@/components/projects/project360Summary';
import {formatDate,formatCurrency} from '@/lib/portal';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import ProjectAttention from '@/components/projects/ProjectAttention';
import ProjectTeamsMeeting from '@/components/teams/ProjectTeamsMeeting';
export default function ProjectMeetingOverview({project,user}) {
 const overview=useProject360(project);
 const extra=useQuery({queryKey:['meeting-overview',project.id,user.id,user.role],queryFn:async()=>{
  const [risks,valuation,activity]=await Promise.all([
   base44.entities.ProjectRisk.filter({project_id:project.id,status:'open'},{limit:5,sort:'-risk_index'}),
   base44.entities.Valuation.filter({project_id:project.id,status:{$ne:'draft'}},{limit:1,sort:'-number'}),
   base44.entities.CRMActivity.filter({project_id:project.id},{limit:1,sort:'-occurred_at'}),
  ]);return {risks,valuation:valuation.items[0],activity:activity.items[0]};
 }});
 const delivery=overview.data?.delivery || {},summary=project360Summary(project,overview.data),financial=!['supplier','project_manager','client'].includes(user.role),v=extra.data?.valuation;
 const fields=[...summary.fields,{label:'Contract start',value:formatDate(delivery.contract_start)},{label:'Forecast PC',value:formatDate(delivery.forecast_pc)},{label:'Handover',value:delivery.handover_applicability?.replaceAll('_',' ') || 'Not assessed'}];
 if(financial) fields.push({label:'Commercial position',value:delivery.contract_sum!=null ? `Contract sum ${formatCurrency(delivery.contract_sum)}` : (project.submitted_proposal_value ?? project.estimated_value)!=null ? `${project.submitted_proposal_value!=null ? 'Submitted proposal' : 'Estimated'} ${formatCurrency(projectFullValue(project))}` : 'Not recorded'},{label:'Latest valuation / payment',value:v ? `Valuation ${v.number}: ${v.status.replaceAll('_',' ')}${v.amount_paid!=null ? ` · Paid ${formatCurrency(v.amount_paid)}` : ''}` : 'No accessible valuation recorded'});
 return <div className="space-y-5">{['admin','director','regional_director','bsm','bdm','finance'].includes(user?.role) && <ProjectTeamsMeeting project={project} />}{financial && <ProjectAttention project={project}/>}<ReviewQueryState query={overview}><dl className="grid grid-cols-2 gap-4">{fields.map(f=><div key={f.label}><dt className="text-xs text-muted-foreground">{f.label}</dt><dd className="mt-1 text-sm font-medium">{f.value}</dd></div>)}</dl><div><h3 className="text-sm font-semibold">Latest recorded project update</h3><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{delivery.key_site_issues || delivery.next_action || project.comments || 'No update recorded.'}</p></div></ReviewQueryState>
  <ReviewQueryState query={extra}><section><h3 className="text-sm font-semibold">Current risks / issues</h3>{extra.data?.risks.items.length ? extra.data.risks.items.map(r=><p key={r.id} className="mt-2 text-sm">{r.title}<span className="text-muted-foreground"> · {r.owner || 'Owner not recorded'}{r.target_resolution ? ` · ${formatDate(r.target_resolution)}` : ''}</span></p>) : <p className="mt-1 text-sm text-muted-foreground">No accessible open risks recorded.</p>}{extra.data?.risks.has_more && <p className="mt-2 text-xs text-muted-foreground">Highest five shown; open the full project for the complete register.</p>}</section><section><h3 className="text-sm font-semibold">What changed · latest recorded activity</h3><p className="mt-1 text-sm text-muted-foreground">{extra.data?.activity ? `${extra.data.activity.subject} · ${formatDate(extra.data.activity.occurred_at)}` : 'No accessible dated activity is recorded here; a last-edited timestamp is not treated as a meaningful change.'}</p>{extra.data?.activity?.description && <p className="mt-1 whitespace-pre-wrap text-sm">{extra.data.activity.description}</p>}</section></ReviewQueryState>
 </div>;
}