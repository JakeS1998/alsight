const escape=v=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function namePattern(name){
 const words=String(name||'').toLowerCase().replace(/&/g,' and ').match(/[a-z0-9]+/g)||[];
 return words.length?'^[^a-z0-9]*'+words.map(w=>w==='and'?'(?:and|&)':escape(w)).join('[^a-z0-9]*')+'[^a-z0-9]*$':null;
}
export async function sourceKey(dataset,name,code){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([dataset,name,code])));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export async function resolveFinanceProjects(base44,config,rows){
 const db=base44.asServiceRole.entities;
 const keyed=await Promise.all(rows.map(async row=>({...row,source_key:await sourceKey(config.dataset_id,row.Project,row.Code)})));
 if(!keyed.length)return [];
 const previous=(await db.FinanceProjectMapping.filter({dataset_id:config.dataset_id,source_key:{$in:keyed.map(r=>r.source_key)}},{limit:100})).items;
 const updates=[],result=[];
 for(let i=0;i<keyed.length;i+=3){const batch=await Promise.all(keyed.slice(i,i+3).map(async row=>{
 const old=previous.find(m=>m.source_key===row.source_key);
 if(old)return {...row,mapping:old};
 const pattern=namePattern(row.Project), candidates=pattern?(await db.Project.filter({name:{$regex:pattern,$options:'i'}},{limit:3,fields:['name','project_number','dataverse_id']})).items:[];
 const unique=candidates.length===1?candidates[0]:null;
 const mapping={source_key:row.source_key,dataset_id:config.dataset_id,source_name:String(row.Project||''),source_code:String(row.Code||''),project_id:unique?.id||'',project_name:unique?.name||'',project_code:unique?.project_number||'',status:unique?'automatic':candidates.length?'ambiguous':'unmatched',candidates};
 updates.push(mapping);return {...row,mapping};
 }));result.push(...batch);}
 if(updates.length)await db.FinanceProjectMapping.upsert(updates,{key:'source_key'});
 return result;
}
export async function saveFinanceMapping(base44,user,input,config){
 const db=base44.asServiceRole.entities,m=(await db.FinanceProjectMapping.filter({source_key:input.sourceKey,dataset_id:config.dataset_id},{limit:1})).items[0];
 if(!m)throw new Error('Discover this Power BI project before linking it.');
 const p=await base44.entities.Project.get(input.projectId);if(!p)throw new Error('Choose an existing project.');
 await db.FinanceProjectMapping.update(m.id,{project_id:p.id,project_name:p.name,project_code:p.project_number||'',status:'manual',linked_by:user.id,linked_at:new Date().toISOString()});
 return {notice:'Project mapping saved. Original project and order codes are unchanged.'};
}