import { base44 } from '@/api/base44Client';
import { TASK_SOURCES, assignedTaskQuery, taskRow } from '@/components/tasks/assignedTaskQueries';
import { insuranceAttentionRow } from '@/components/adaptive/adaptiveData';

export function attentionSources(data) {
 const totals=data.totals || {};
 return [
  ...(data.identityUnavailable ? [] : TASK_SOURCES.filter(s=>data.taskCounts?.[s.entity]>0).map(s=>s.entity)),
  ...['risks','decisions','proposals','dates','approvals'].filter(key=>totals[key]>0),
  ...(totals.approvals>0 ? ['projectApprovals'] : []),
  ...['signing','drafting'].filter(key=>totals[key]>0).flatMap(key=>['LegalDocument','DMA','JCT'].map(entity=>`${key}-${entity}`)),
  ...(data.insuranceTotal>0 ? ['insurance'] : [])
 ].map(source=>({source,cursor:null}));
}

export async function loadAttentionSource({source,cursor},data,user) {
 const options={limit:20,...(cursor ? {cursor} : {})};
 const task=TASK_SOURCES.find(entry=>entry.entity===source);
 let page,format;
 if(task){
  page=await base44.entities[task.entity].filter(assignedTaskQuery(task,user,data.identityContacts||[]),{...options,sort:task.due});
  format=record=>({...taskRow(task,record),detail:`Assigned to you · ${task.label}`,label:'Open task',severity:'attention'});
 } else if(source==='insurance'){
  page=await base44.entities.SupplierInsurance.filter(data.insuranceQuery,{...options,sort:'expiry_date',fields:['name','account_id','expiry_date','policy_type']});
  format=insuranceAttentionRow;
 } else if(source==='projectApprovals'){
  const response=await base44.functions.invoke('manageProjectApprovals',{action:'list',view:'pending',cursor});
  page=response.data;
  format=record=>({key:`approval-project-${record.id}`,title:record.project_name || 'Project approval',detail:'Project approval pending',to:'/approvals',label:'Review approval',severity:'attention'});
 } else {
  const {data:result}=await base44.functions.invoke('getTodayBriefing',{projectIds:data.projects.map(p=>p.id),source,cursor});
  return result;
 }
 return {items:page.items.map(format),nextCursor:page.has_more ? page.next_cursor : null};
}