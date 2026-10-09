import {useEffect} from 'react';
import {base44} from '@/api/base44Client';
const fields=new Set(['full_value','submitted_proposal_value','submitted_proposal_id','estimated_value','updated_date']);
export default function useProjectReportingRefresh(projectId,setProject) {
 useEffect(()=>{
  if(!projectId)return;
  return base44.entities.Project.subscribe(event=>{
   if(event.type!=='update' || event.id!==projectId || !Object.prototype.hasOwnProperty.call(event.data || {},'full_value'))return;
   const values=Object.fromEntries(Object.entries(event.data).filter(([field])=>fields.has(field)));
   setProject(project=>project?.id===projectId ? {...project,...values} : project);
  });
 },[projectId,setProject]);
}