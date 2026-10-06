import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import useIntelligenceUpdates from '@/components/intelligence/useIntelligenceUpdates';
const types=['call','email','meeting','teams_meeting','client_visit','internal_meeting','lunch','event','site_visit','project_meeting'];
export default function usePersonSignals(contact) {
  const {user}=useAuth();
  useIntelligenceUpdates(contact.id,'contact_id',['CRMActivity','Conversation','CRMContactTask','ContactProfile','Opportunity'],[['ase-person-signals',contact.id]]);
  return useQuery({queryKey:['ase-person-signals',contact.id,user.id,user.role],staleTime:60000,retry:false,refetchOnWindowFocus:false,queryFn:async()=>{
    const now=new Date().toISOString(),middle=new Date(Date.now()-30*86400000).toISOString(),start=new Date(Date.now()-60*86400000).toISOString();
    const a={contact_id:contact.id,type:{$in:types}},c={contact_id:contact.id,channel:{$in:['call','email','meeting']}};
    const [activity,conversation,next]=await Promise.all([base44.entities.CRMActivity.filter({...a,occurred_at:{$lte:now}},{sort:'-occurred_at',limit:1,fields:['occurred_at']}),base44.entities.Conversation.filter({...c,occurred_at:{$lte:now}},{sort:'-occurred_at',limit:1,fields:['occurred_at']}),base44.entities.CRMContactTask.filter({contact_id:contact.id,status:'open'},{sort:'due_at',limit:1})]);
    const [recentA,recentC,earlierA,earlierC]=await Promise.all([base44.entities.CRMActivity.count({...a,occurred_at:{$gte:middle,$lte:now}}),base44.entities.Conversation.count({...c,occurred_at:{$gte:middle,$lte:now}}),base44.entities.CRMActivity.count({...a,occurred_at:{$gte:start,$lt:middle}}),base44.entities.Conversation.count({...c,occurred_at:{$gte:start,$lt:middle}})]);
    const ids=[contact.id,contact.dataverse_id].filter(Boolean),scope={$or:['client_rep_id','client_rep2_id','project_manager_id','contractor_contact_id'].map(field=>({[field]:{$in:ids}}))};
    const [projects,opportunities]=await Promise.all([base44.entities.Project.aggregate({query:scope,groupBy:'live_project'}),base44.entities.Opportunity.count({contact_id:contact.id,status:'open'})]);
    return {last:[activity.items[0]?.occurred_at,conversation.items[0]?.occurred_at].filter(Boolean).sort().at(-1) || null,recent:recentA+recentC,earlier:earlierA+earlierC,next:next.items[0],projects:projects.rows,opportunities};
  }});
}