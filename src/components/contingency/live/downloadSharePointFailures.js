import {coCall} from '@/components/contingency/live/useContingencyOperations';
function cell(value){const text=String(value??''),safe=/^\s*[=+\-@]/.test(text)?`'${text}`:text;return `"${safe.replace(/"/g,'""')}"`;}
export default async function downloadSharePointFailures(){
 const rows=[['Project','Project number','Source','Failure stage','SharePoint link','Link basis','Failure reason','Failure recorded at']];
 let cursor=null;
 do{const page=await coCall('sharepoint_failures',cursor?{cursor}:{});for(const item of page.items)rows.push([item.project,item.project_number,item.source,item.stage,item.url,item.link_basis,item.error,item.failed_at]);cursor=page.has_more?page.next_cursor:null;}while(cursor);
 const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}));
 const link=document.createElement('a');link.href=url;link.download=`sharepoint-link-failures-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}