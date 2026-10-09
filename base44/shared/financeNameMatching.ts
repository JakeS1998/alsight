import {legacyNamePattern} from './financeProjectNames.ts';
export async function legacyFinanceNameMatches(base44,rows){
 const patterns=rows.map(row=>({key:row.source_key,pattern:legacyNamePattern(row.Project)})).filter(r=>r.pattern);
 if(!patterns.length)return new Map();
 const db=base44.asServiceRole.entities,page=await db.Project.filter({$and:[{project_number:{$regex:'^PROJ\\s*0*(?:[1-5][0-9]{2}|[1-9][0-9]?|0)$',$options:'i'}},{$or:patterns.map(r=>({name:{$regex:r.pattern,$options:'i'}}))}]},{limit:500,fields:['name','project_number','dataverse_id']});
 if(page.has_more)throw new Error('Too many project-name candidates; reduce the matching batch.');
 const result=new Map();
 for(const row of patterns){const regex=new RegExp(row.pattern,'i'),candidates=page.items.filter(p=>regex.test(p.name||'')),p=candidates.length===1?candidates[0]:null;
  result.set(row.key,{project_id:p?.id||'',project_name:p?.name||'',project_code:p?.project_number||'',status:p?'automatic':candidates.length?'ambiguous':'unmatched',candidates:candidates.slice(0,3),...(p?{matching_method:'name',linked_by:'Unique project-name match below PROJ600',linked_at:new Date().toISOString()}:{})});
 }
 return result;
}
export async function applyLegacyFinanceNameMappings(base44,state,input){
 if(!state?.namespace)throw new Error('No Dataverse finance snapshot is configured.');
 if(String(input.cursor||'').length>8192)throw new Error('Invalid mapping cursor.');
 const db=base44.entities,page=await db.FinanceProjectMapping.filter({dataset_id:state.namespace,project_id:{$in:['',null]},status:{$in:['unmatched','ambiguous']}},{limit:50,sort:'source_key',...(input.cursor?{cursor:input.cursor}:{})});
 const matches=await legacyFinanceNameMatches(base44,page.items.map(m=>({source_key:m.source_key,Project:m.source_name}))),updates=[];
 for(const m of page.items){const match=matches.get(m.source_key);if(match?.project_id)updates.push({id:m.id,...match});}
 if(updates.length)await db.FinanceProjectMapping.bulkUpdate(updates);
 return {processed:page.items.length,linked:updates.length,has_more:page.has_more,next_cursor:page.next_cursor||null};
}