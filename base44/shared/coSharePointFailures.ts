import {configuration,requireAdmin,fail} from './coCore.ts';
export async function readSharePointFailures(b,m,input){
 requireAdmin(m);
 if(input.cursor!==undefined&&input.cursor!==null&&(typeof input.cursor!=='string'||input.cursor.length>3000))fail('Invalid list continuation.');
 const E=b.asServiceRole.entities,c=await configuration(b),coverage=c.policy?.project_legals||{};
 const discovery=m.global&&Array.isArray(coverage.errors)?coverage.errors:[];
 const query={kind:'sharepoint',enabled:true,'state.error':{$exists:true,$nin:[null,'']},...(!m.global?{id:{$in:m.dataset_ids}}:{})};
 const [page,total]=await Promise.all([E.CODataset.filter(query,{sort:'-updated_date',limit:50,...(input.cursor?{cursor:input.cursor}:{})}),E.CODataset.count(query)]);
 const errors=input.cursor?[]:discovery;
 const ids=[...new Set([...errors.map(e=>e.project_id),...page.items.map(d=>d.mapping?.project_id)].filter(Boolean))];
 const projects=ids.length?(await E.Project.filter({id:{$in:ids}},{limit:150})).items:[],index=new Map(projects.map(p=>[p.id,p]));
 const items=errors.map((e,i)=>{const p=index.get(e.project_id);return {id:`discovery-${e.project_id}-${i}`,project:e.project_name||p?.name||'',project_number:e.project_number||p?.project_number||'',source:'Project legal folder',stage:'Folder discovery',url:e.folder_url||p?.link_to_legals||'',link_basis:e.folder_url?'Recorded failed link':p?.link_to_legals?'Current project link; original failed link not recorded':'Link not recorded',error:e.error||'',failed_at:e.failed_at||''};});
 for(const d of page.items){const p=index.get(d.mapping?.project_id);items.push({id:`backup-${d.id}`,project:d.mapping?.project_name||p?.name||'',project_number:p?.project_number||'',source:d.label,stage:'Backup copying',url:d.mapping?.folder_url||'',link_basis:d.mapping?.folder_url?'Configured backup link':'Link not recorded',error:d.state.error,failed_at:d.state.last_attempt||''});}
 return {items,total:discovery.length+total,next_cursor:page.next_cursor||null,has_more:page.has_more,discovery_in_progress:!!coverage.scan_in_progress,last_scan:coverage.last_scan||'',history_limited:discovery.length>=100};
}