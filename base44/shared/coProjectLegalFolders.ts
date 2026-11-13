import {lease,incident,configuration,now,audit,fail,safeError} from './coCore.ts';
import {nightlyDueQuery,retryDueQuery} from './coNightlyEligibility.ts';
import {graphClient,resolveFolder} from './coMicrosoft.ts';
import {replicate} from './coReplication.ts';
export const legalFolderQuery={link_to_legals:{$exists:true,$nin:[null,'']}};
export async function approveProjectLegalFolders(b,u,c){
 if(c.mode!=='production')fail('Project legal-folder coverage requires production standby.');
 const policy={...c.policy,project_legals:{...c.policy?.project_legals,enabled:true,field:'link_to_legals',approved_by:u.id,approved_at:now(),cursor:'',last_scan:'',errors:[]}};
 const linked=await b.asServiceRole.entities.Project.count(legalFolderQuery);
 policy.project_legals.linked_projects=linked;
 await b.asServiceRole.entities.COConfig.update(c.id,{policy});
 await audit(b,u,'Project legal-folder standby coverage approved',{field:'link_to_legals',linked_projects:linked});
 return{ok:true,message:`Continuous copying approved for the legal folders linked to ${linked} projects. Folder discovery and first copies run in bounded batches.`};
}
async function discoverFolders(b,u){return lease(b,async c=>{
 const policy=c.policy?.project_legals;
 if(!policy?.enabled||!c.enabled||c.mode!=='production'||await incident(b))return{skipped:true};
 if(!policy.cursor&&policy.last_scan&&(!c.policy?.nightly_sync_at||policy.last_scan>=c.policy.nightly_sync_at))return {current:true};
 const E=b.asServiceRole.entities,at=now(),page=await E.Project.filter(legalFolderQuery,{sort:'created_date',limit:10,...(policy.cursor?{cursor:policy.cursor}:{})});
 const existing=page.items.length?(await E.CODataset.filter({'mapping.project_id':{$in:page.items.map(p=>p.id)}},{sort:'-created_date',limit:100})).items:[];
 const changes=[],errors=[],graph=await graphClient(b),root=await graph('/v1.0/sites/root'),host=new URL(root.webUrl).hostname;
 let added=0;
 for(let offset=0;offset<page.items.length;offset+=3){await Promise.all(page.items.slice(offset,offset+3).map(async project=>{
  const link=String(project.link_to_legals||'').trim(),sources=existing.filter(d=>d.mapping?.auto_project_legals&&d.mapping.project_id===project.id);
  const current=sources.find(d=>d.mapping.folder_url===link);
  if(!link){for(const d of sources)if(d.enabled)changes.push({id:d.id,enabled:false});return;}
  if(current){for(const d of sources)if(d.id!==current.id&&d.enabled)changes.push({id:d.id,enabled:false});return;}
  try{const folder=await resolveFolder(b,link,graph,host,project.project_number);
   await E.CODataset.create({...folder,kind:'sharepoint',label:`${project.name} — Legal folder`.slice(0,120),scope_ids:[],enabled:true,version:1,interval_minutes:c.policy?.rpo_minutes||60,retention_days:c.policy?.retention_days||365,state:{},mapping:{auto_project_legals:true,project_id:project.id,project_name:project.name,folder_url:link,approved_by:policy.approved_by,approved_at:policy.approved_at}});
   for(const d of sources)if(d.enabled)changes.push({id:d.id,enabled:false});added++;
  }catch(e){for(const d of sources)if(d.enabled)changes.push({id:d.id,enabled:false});errors.push({project_id:project.id,project_name:project.name,project_number:project.project_number||'',folder_url:link,failed_at:at,error:safeError(e)});}
 }));}
 if(changes.length)await E.CODataset.bulkUpdate(changes);
 const complete=!page.has_more,report=[...(policy.cursor?policy.errors||[]:[]),...errors].slice(-100);
 await E.COConfig.update(c.id,{...(added?{acceptance:{},owner_approvals:[]}:{}),policy:{...c.policy,project_legals:{...policy,cursor:page.next_cursor||'',last_scan:complete?at:policy.last_scan,scan_in_progress:!complete,errors:report,discovered_at:at}}});
 await audit(b,u,'Project legal-folder discovery batch',{projects_checked:page.items.length,added,failed:errors.length,complete});
 return{added,failed:errors.length,scan_in_progress:!complete};
 });}
export async function projectLegalFolderTick(b,u){
 const start=Date.now(),discovery=await discoverFolders(b,u);if(discovery.skipped)return discovery;
 const at=now(),c=await configuration(b);
 const page=await b.asServiceRole.entities.CODataset.filter({enabled:true,'mapping.auto_project_legals':true,$and:[retryDueQuery(at),nightlyDueQuery(c)]},{sort:'state.last_attempt',limit:8});
 const projects=page.items.length?(await b.asServiceRole.entities.Project.filter({id:{$in:page.items.map(d=>d.mapping.project_id)}},{limit:8})).items:[];
 const obsolete=page.items.filter(d=>!projects.some(p=>p.id===d.mapping.project_id&&String(p.link_to_legals||'').trim()===d.mapping.folder_url));
 if(obsolete.length)await b.asServiceRole.entities.CODataset.bulkUpdate(obsolete.map(d=>({id:d.id,enabled:false})));
 const results=[];for(const d of page.items.filter(d=>!obsolete.some(old=>old.id===d.id))){if(Date.now()-start>90000)break;
  if(d.state?.retry_after&&d.state.retry_after>now())continue;
  results.push(await replicate(b,u,{dataset_id:d.id}));
 }
 return{discovery,batches:results.length,results};
}