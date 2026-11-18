import { base44 } from '@/api/base44Client';
import { TASK_SOURCES, assignedTaskQuery, taskRow } from '@/components/tasks/assignedTaskQueries';
import { insuranceAttentionRow } from '@/components/adaptive/adaptiveData';

import {deadlineQuery} from '@/components/adaptive/attentionDeadlines';

export function attentionSources(data,filter='all') {
 const totals=data.totals || {};
 return [
  ...(data.identityUnavailable ? [] : TASK_SOURCES.filter(s=>data.taskCounts?.[s.entity]>0).map(s=>s.entity)),
  ...['risks','decisions','proposals','dates','approvals'].filter(key=>totals[key]>0),
  ...(totals.approvals>0 ? ['projectApprovals'] : []),
  ...['signing','drafting'].filter(key=>totals[key]>0).flatMap(key=>['LegalDocument','DMA','JCT'].map(entity=>`${key}-${entity}`)),
  ...(totals.warranties>0 ? ['due-Warranty'] : []),
  ...(data.insuranceTotal>0 ? ['insurance'] : [])
 ].filter(source=>filter==='all'||(!['risks','proposals','approvals','projectApprovals'].includes(source) && (source!=='decisions'||filter==='overdue') && (source!=='dates'||filter!=='overdue') && (!source.startsWith('signing-')||filter==='overdue'))).map(source=>({source,cursor:null}));
}

export async function loadAttentionSource({source,cursor},data,user,filter='all',window) {
 const deadline=deadlineQuery(filter,window||{});
 const options={limit:20,...(cursor ? {cursor} : {})};
 const task=TASK_SOURCES.find(entry=>entry.entity===source);
 let page,format;
 if(task){
  const query=assignedTaskQuery(task,user,data.identityContacts||[]);
  if(deadline)query.$and.push({[task.due]:deadline});
  page=await base44.entities[task.entity].filter(query,{...options,sort:task.due});
  format=record=>({...taskRow(task,record),detail:`Assigned to you · ${task.label}`,label:'Open task',severity:'attention'});
 } else if(source==='insurance'){
  page=await base44.entities.SupplierInsurance.filter(deadline?{$and:[data.insuranceQuery,{expiry_date:deadline}]}:data.insuranceQuery,{...options,sort:'expiry_date',fields:['name','account_id','expiry_date','policy_type']});
  format=insuranceAttentionRow;
 } else if(source==='projectApprovals'){
  const response=await base44.functions.invoke('manageProjectApprovals',{action:'list',view:'pending',cursor});
  page=response.data;
  format=record=>({key:`approval-project-${record.id}`,title:record.project_name || 'Project approval',detail:'Project approval pending',to:'/approvals',label:'Review approval',severity:'attention'});
 } else {
  const {data:result}=await base44.functions.invoke('getTodayBriefing',{projectIds:data.projects.map(p=>p.id),source,cursor,deadlineFilter:filter});
  return result;
 }
 return {items:page.items.map(format),nextCursor:page.has_more ? page.next_cursor : null};
}