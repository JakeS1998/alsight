import {base44} from '@/api/base44Client';
import {YES_NO_FIELDS,SOCIAL_FIELDS,DATE_FIELDS,NUMBER_FIELDS} from '@/components/framework/frameworkKpiFields';
export default async function frameworkExport(filters,term) {
 const rows=[];let cursor;
 do {const {data}=await base44.functions.invoke('getStakeholderFrameworkReport',{workspaceAction:'list',filters,term,...(cursor ? {cursor} : {})});rows.push(...data.rows);cursor=data.has_more ? data.next_cursor : null;}while(cursor);
 const fields=[...new Set(['framework_ref','project_number','site','client','principal_contractor','linked','updated_date',...DATE_FIELDS.map(([key])=>key),...YES_NO_FIELDS.map(([key])=>key),...NUMBER_FIELDS.map(([key])=>key),...SOCIAL_FIELDS.flatMap(([actual,target,,postcodes])=>[actual,target,...(postcodes ? [postcodes] : [])]),'time_category','completion_delay_days','cost_category','budget_variance_pct','population_impact','population_source_url','population_source_year','high_level_evidence','kpis_complete'])];
 const cell=value=>{const text=String(value ?? '');return `"${(/^[=+@-]/.test(text) ? "'"+text : text).replace(/"/g,'""')}"`;};
 const csv=[fields.join(','),...rows.map(row=>fields.map(field=>cell(row[field])).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='UKLF-framework-projects.csv';link.click();URL.revokeObjectURL(url);
}