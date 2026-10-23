import { pathwayBmsCatalog } from './pathwayBmsCatalog.ts';
export const bmsFail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const normal = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function bmsLinkedRecord(entity, row, gate = false) {
 const decision = entity === 'ProjectDecision';
 const date = row.date_agreed;
 const approved = !gate || (decision && !!row.decision_maker?.trim() && Number.isFinite(Date.parse(date)) && Date.parse(date) <= Date.now() && !!(row.decision || row.supporting_document));
 return { entity, id:row.id, label:decision ? row.decision_title : row.action, done:(decision ? row.status==='agreed' : row.status==='done') && approved, status:row.status, detail:gate&&!approved ? 'Formal approval needs an agreed decision, decision maker, date and approval evidence in the existing decision register.' : `Existing ${decision?'decision':'action'}: ${row.status || 'open'}`, approver:row.decision_maker || '', approval_date:date || '' };
}
export async function readBmsReviews(db, projectId) {
 const page = await db.PathwayBMSReview.filter({project_id:projectId},{sort:'-updated_date',limit:200});
 if(page.has_more)bmsFail('Too many BMS review records. Ask an administrator to reconcile them.',409);
 return page.items;
}
export async function bmsExistingMatches(base44, projectId, reviews) {
 const manual = pathwayBmsCatalog.filter(task=>!task.source);
 const aliases = manual.flatMap(task=>[task.label,...(task.aliases||[])]);
 const matches = {}, jobs=[];
 for(const entity of ['ProjectAction','ProjectDecision']) {
  const title=entity==='ProjectAction'?'action':'decision_title',ids=reviews.filter(r=>r.linked_entity===entity&&r.linked_id).map(r=>r.linked_id);
  for(let offset=0;offset<aliases.length;offset+=8){
   const regex=`^\\s*(?:${aliases.slice(offset,offset+8).map(escapeRegex).join('|')})[.!]?\\s*$`;
   jobs.push({entity,title,query:{project_id:projectId,[title]:{$regex:regex,$options:'i'}}});
  }
  if(ids.length)jobs.push({entity,title,query:{project_id:projectId,id:{$in:ids}}});
 }
 for(let offset=0;offset<jobs.length;offset+=6)await Promise.all(jobs.slice(offset,offset+6).map(async ({entity,title,query})=>{
  const page=await base44.entities[entity].filter(query,{sort:'-updated_date',limit:100});
  for(const row of page.items){
   const explicit=reviews.find(r=>r.linked_entity===entity&&r.linked_id===row.id);
   const task=explicit ? manual.find(t=>t.key===explicit.requirement_key) : manual.find(t=>(entity==='ProjectDecision'||!t.gate)&&[t.label,...(t.aliases||[])].some(alias=>normal(alias)===normal(row[title])));
   if(task && (!matches[task.key]||explicit))matches[task.key]=bmsLinkedRecord(entity,row,task.gate);
  }
 }));
 return matches;
}