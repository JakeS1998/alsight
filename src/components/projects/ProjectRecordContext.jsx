import React from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {projectStage} from '@/components/dashboard/pipelineStage';
export default function ProjectRecordContext({project,client,user,isSupplier}) {
 const ids=[project.bdm_aad_id,project.bsm_aad_id].filter(Boolean);
 const staff=useQuery({queryKey:['project-record-owners',project.id,user?.id,user?.role,...ids],enabled:ids.length>0 && !isSupplier,queryFn:async()=>(await base44.entities.Contact.filter({aad_id:{$in:ids}},{limit:4,fields:['aad_id','full_name']})).items});
 const owner=id=>id===user?.id ? user.full_name || user.email : staff.data?.find(person=>person.aad_id===id)?.full_name || (id ? 'Assigned; name unavailable' : 'Not assigned');
 return <div className="mt-3 space-y-2 text-xs text-sidebar-foreground/80"><p>Journey: {projectStage(project) ? 'Project' : 'Handover'} · {project.site_postcode || 'Location not recorded'}</p><p>Client: {client ? <Link to={`/accounts/${client.id}`} className="underline">{client.name}</Link> : project.client_name || 'Not recorded'}</p>{!isSupplier && <p>BDM: {owner(project.bdm_aad_id)} · BSM: {owner(project.bsm_aad_id)}</p>}<nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Connected project records">{!isSupplier && <Link className="font-semibold underline" to={`/projects/${project.id}?tab=delivery`}>Open Project Pathway</Link>}<Link className="font-semibold underline" to={`/projects/${project.id}?tab=drafting`}>Review documents</Link>{client && <Link className="font-semibold underline" to={`/accounts/${client.id}`}>Open client relationship</Link>}</nav></div>;
}