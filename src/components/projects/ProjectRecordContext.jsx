import React from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import ProjectPOReferences from '@/components/projects/ProjectPOReferences';
import {projectStaffName} from '@/components/projects/projectStaffName';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function ProjectRecordContext({project,client,user,isSupplier}) {
 const ids=[project.bdm_aad_id,project.bsm_aad_id].filter(Boolean);
 const staff=useQuery({queryKey:['project-record-owners','user-first',project.id,user?.id,user?.role,...ids],enabled:ids.length>0 && !!user?.id && !isSupplier,...organisationQueryPolicy,staleTime:300000,queryFn:async()=>{
  const {data}=await base44.functions.invoke('getProjectBDMManager',{action:'staff_names',projectId:project.id});
  if(data.error)throw new Error(data.error);
  return data.names;
 }});
 const staffMap={...(staff.data || {})};
 [user?.id,user?.staff_aad_id,user?.data?.staff_aad_id].filter(Boolean).forEach(id=>{if(user?.full_name)staffMap[id]=user.full_name;});
 const owner=id=>projectStaffName(id,staffMap) || (id ? staff.isPending ? 'Loading…' : staff.error ? 'Unable to load name' : 'Assigned; name unavailable' : 'Not assigned');
 return <div className="ws-record-context mt-3 text-xs text-sidebar-foreground/80">
 <div className="ws-record-bubbles flex flex-wrap items-center gap-2">
  <ProjectPOReferences project={project}/>
  <span className="ws-pill">Client: {client ? <Link to={`/accounts/${client.id}`} className="underline underline-offset-2">{client.name}</Link> : project.client_name || 'Not recorded'}</span>
  {!isSupplier && <><span className="ws-pill">BDM: {owner(project.bdm_aad_id)}</span><span className="ws-pill">BSM: {owner(project.bsm_aad_id)}</span></>}
 </div>
 <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-2" aria-label="Connected project records">
   {!isSupplier && <Link className="font-semibold underline underline-offset-4" to={`/projects/${project.id}?tab=delivery`}>Open Project Pathway</Link>}
   <Link className="font-semibold underline underline-offset-4" to={`/projects/${project.id}?tab=drafting`}>Review documents</Link>
   {client && <Link className="font-semibold underline underline-offset-4" to={`/accounts/${client.id}`}>Open client relationship</Link>}
  </nav>
 </div>;
}