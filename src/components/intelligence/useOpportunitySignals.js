import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import useIntelligenceUpdates from '@/components/intelligence/useIntelligenceUpdates';
export const interactionTypes=['call','email','meeting','teams_meeting','client_visit','internal_meeting','lunch','site_visit'];
export function opportunityActivityQuery(item,user) {
  return {queryKey:['opportunity-attention',item.id,user.id,user.role],staleTime:60000,retry:false,refetchOnWindowFocus:false,queryFn:async()=>{
    const [activity,conversation,changes]=await Promise.all([base44.entities.CRMActivity.filter({opportunity_id:item.id,type:{$in:interactionTypes}},{sort:'-occurred_at',limit:1,fields:['occurred_at']}),base44.entities.Conversation.filter({opportunity_id:item.id},{sort:'-occurred_at',limit:1,fields:['occurred_at']}),base44.entities.CRMActivity.filter({opportunity_id:item.id,type:{$in:['stage_change','decision','note','document_sent','proposal_sent','task_completed']}},{sort:'-occurred_at',limit:1,fields:['subject','occurred_at','type']})]);
    return {last:[activity.items[0]?.occurred_at,conversation.items[0]?.occurred_at].filter(Boolean).sort().at(-1),change:changes.items[0]};
  }};
}
export default function useOpportunitySignals(item,user) {
  const activity=useQuery(opportunityActivityQuery(item,user));
  const tasks=useQuery({queryKey:['ase-opportunity-tasks',item.id,user.id,user.role],staleTime:60000,retry:false,refetchOnWindowFocus:false,queryFn:async()=>{
    const query={opportunity_id:item.id,status:{$in:['open','in_progress']}};
    const [page,overdue]=await Promise.all([base44.entities.CRMTask.filter(query,{sort:'due_date',limit:1}),base44.entities.CRMTask.count({...query,due_date:{$lt:new Date().toISOString().slice(0,10),$nin:[null,'']}})]);
    return {next:page.items[0],overdue};
  }});
  useIntelligenceUpdates(item.id,'opportunity_id',['CRMActivity','Conversation','CRMTask'],[['opportunity-attention',item.id],['ase-opportunity-tasks',item.id]]);
  return {activity:activity.data,tasks:tasks.data,loading:activity.isPending || tasks.isPending,error:activity.error || tasks.error};
}