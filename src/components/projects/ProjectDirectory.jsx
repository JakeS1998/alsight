import React from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import ProjectDirectoryField from '@/components/projects/ProjectDirectoryField';
export default function ProjectDirectory({project,assignments,onUpdated}) {
 const {user}=useAuth();
 const data=useQuery({queryKey:['project-directory',project.id,user?.id,user?.role],queryFn:async()=>{const {data}=await base44.functions.invoke('manageProjectDirectory',{action:'read',projectId:project.id});if(data.error)throw new Error(data.error);return data;},retry:false});
 return <section className="ws-card ws-panel"><div className="ws-panelhead"><h3 className="ws-sectiontitle">Project Directory</h3></div>{data.isError&&<p role="alert" className="text-xs text-destructive">Directory editing unavailable: {data.error.response?.data?.error||data.error.message}</p>}<div className="ws-teamgrid">{assignments.map(([label,value,to])=><div className="ws-teamitem" key={label}><ProjectDirectoryField label={label} project={project} override={data.data?.assignments.find(a=>a.field===label)} editable={data.data?.editable.includes(label)} onUpdated={onUpdated}>{to?<Link to={to} className="underline underline-offset-2 hover:text-primary">{value}</Link>:value}</ProjectDirectoryField></div>)}</div></section>;
}