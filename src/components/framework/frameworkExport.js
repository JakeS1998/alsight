import {base44} from '@/api/base44Client';
export default async function frameworkExport(filters,term) {
 const rows=[];let cursor;
 do {const {data}=await base44.functions.invoke('getStakeholderFrameworkReport',{workspaceAction:'list',filters,term,...(cursor ? {cursor} : {})});rows.push(...data.rows);cursor=data.has_more ? data.next_cursor : null;}while(cursor);
 const fields=['framework_ref','project_number','site','client','pq_date','aa_signed','calloff_date','completed_on_time','completed_to_budget','zero_riddor','linked','updated_date'];
 const cell=value=>{const text=String(value ?? '');return `"${(/^[=+@-]/.test(text) ? "'"+text : text).replace(/"/g,'""')}"`;};
 const csv=[fields.join(','),...rows.map(row=>fields.map(field=>cell(row[field])).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='UKLF-framework-projects.csv';link.click();URL.revokeObjectURL(url);
}