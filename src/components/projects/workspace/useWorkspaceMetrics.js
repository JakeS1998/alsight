import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function useWorkspaceMetrics(projects,user) {
 const ids=projects.map(p=>p.id).sort();
 return useQuery({queryKey:['workspace-action-metrics',user?.id,user?.role,ids],enabled:!!ids.length && !['supplier','project_manager'].includes(user?.role),staleTime:60000,queryFn:async()=>{
  const result=await base44.entities.ProjectAction.aggregate({query:{project_id:{$in:ids},status:{$ne:'done'}},groupBy:['project_id','due_date'],limit:1000});
  const today=new Date().toLocaleDateString('en-CA'),data={};
  for(const id of ids) data[id]={open:0,overdue:0};
  for(const row of result.rows) {const item=data[row.project_id];if(item){item.open+=row.count;if(row.due_date && row.due_date.slice(0,10)<today)item.overdue+=row.count;}}
  return {items:data,truncated:result.truncated};
 }});
}