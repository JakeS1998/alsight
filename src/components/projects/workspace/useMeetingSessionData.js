import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function useMeetingSessionData(session,user,projectIds=[]) {
 const key=session?.key_points;
 const query=useQuery({queryKey:['meeting-session-data',user.id,key],enabled:!!key,queryFn:async()=>{
  const [totals,ends]=await Promise.all([base44.entities.CRMActivity.aggregate({query:{key_points:key},groupBy:'next_action',countDistinct:'commitments',limit:10}),base44.entities.CRMActivity.filter({key_points:key,next_action:'meeting_end'},{sort:'-occurred_at',limit:1})]);
  const counts={reviewed:0,actions:0,completed:0,notes:0},names={meeting_review:'reviewed',meeting_action:'actions',meeting_completed:'completed',meeting_note:'notes'};
  for(const row of totals.rows)if(names[row.next_action])counts[names[row.next_action]]=row.next_action==='meeting_note' ? row.count : row.count_distinct_commitments;
  return {counts,end:ends.items[0] || null};
 }});
 const marks=useQuery({queryKey:['meeting-session-marks',user.id,key,projectIds],enabled:!!key && !!projectIds.length,queryFn:()=>base44.entities.CRMActivity.filter({key_points:key,next_action:'meeting_review',project_id:{$in:projectIds}},{distinct:'project_id',limit:100})});
 return {query,marks,counts:query.data?.counts || {reviewed:0,actions:0,completed:0,notes:0},ended:!!query.data?.end,reviewed:marks.data?.items || []};
}