import React from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {projectStage} from '@/components/dashboard/pipelineStage';
export default function ProjectRecordContext({project,client,user,isSupplier}) {
 const ids=[project.bdm_aad_id,project.bsm_aad_id].filter(Boolean);
 const staff=useQuery({queryKey:['project-record-owners',project.id,user?.id,user?.role,...ids],enabled:ids.length>0 && !isSupplier,queryFn:async()=>(await base44.entities.Contact.filter({aad_id:{$in:ids}},{limit:4,fields:['aad_id','full_name']})).items});
 const owner=id=>id===user?.id ? user.full_name || user.email : staff.data?.find(person=>person.aad_id===id)?.full_name || (id ? 'Assigned; name unavailable' : 'Not assigned');
 return <div className="ws-record-context mt-4 text-xs text-sidebar-foreground/80">
  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
   <div className="sm:col-span-2"><dt className="text-sidebar-foreground/60">Client</dt><dd className="mt-1 font-medium">{client ? <Link to={`/accounts/${client.id}`} className="underline underline-offset-2">{client.name}</Link> : project.client_name || 'Not recorded'}</dd></div>
   <div><dt className="text-sidebar-foreground/60">Journey</dt><dd className="mt-1 font-medium">{projectStage(project) ? 'Project' : 'Handover'}</dd></div>
   <div><dt className="text-sidebar-foreground/60">Location</dt><dd className="mt-1 font-medium">{project.site_postcode || 'Location not recorded'}</dd></div>
   {!isSupplier && <><div><dt className="text-sidebar-foreground/60">BDM</dt><dd className="mt-1 font-medium">{owner(project.bdm_aad_id)}</dd></div><div><dt className="text-sidebar-foreground/60">BSM</dt><dd className="mt-1 font-medium">{owner(project.bsm_aad_id)}</dd></div></>}
  </dl>
  <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-sidebar-foreground/20 pt-3" aria-label="Connected project records">
   {!isSupplier && <Link className="font-semibold underline underline-offset-4" to={`/projects/${project.id}?tab=delivery`}>Open Project Pathway</Link>}
   <Link className="font-semibold underline underline-offset-4" to={`/projects/${project.id}?tab=drafting`}>Review documents</Link>
   {client && <Link className="font-semibold underline underline-offset-4" to={`/accounts/${client.id}`}>Open client relationship</Link>}
  </nav>
 </div>;
}