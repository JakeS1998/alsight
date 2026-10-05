import React from 'react';
import {FilterSelect} from '@/components/FilterSelect';
import {projectStaffName} from '@/components/projects/projectStaffName';
export default function ProjectWorkspaceFilters({value,onChange,options,projects,serverPaging,staffMap,accountMap}) {
 const values=(field,key)=>serverPaging ? options?.[key] || [] : [...new Set(projects.map(p=>p[field]).filter(Boolean))];
 const pm=values('project_manager_id','pm').map(id=>({value:id,label:projectStaffName(id,staffMap)||'Unnamed project manager'})),clients=values('client_account_id','client').map(id=>({value:id,label:accountMap[id]?.name || 'Client name not available'}));
 const set=(key,v)=>onChange({...value,[key]:v});
 return <><FilterSelect label="Project scope" allLabel="All permitted projects" value={value.scope} onChange={v=>set('scope',v)} options={[{value:'mine',label:'My Projects'}]}/><FilterSelect label="Project Manager" value={value.pm} onChange={v=>set('pm',v)} options={pm}/><FilterSelect label="Client" value={value.client} onChange={v=>set('client',v)} options={clients}/></>;
}