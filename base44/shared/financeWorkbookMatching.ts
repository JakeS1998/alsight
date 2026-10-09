const normalize=value=>String(value||'').trim().toUpperCase();
export async function workbookFinanceMatches(base44,rows){
 const db=base44.asServiceRole.entities,codes=[...new Set(rows.map(r=>normalize(r.Code)).filter(Boolean))];
 if(!codes.length)return new Map();
 const page=await db.FinanceProjectCodeLink.filter({sage_code:{$in:codes}},{limit:500});
 if(page.has_more)throw new Error('Workbook mapping batch exceeds its limit.');
 const links=page.items,numbers=[...new Set(links.map(r=>r.project_number))];
 const projectPage=numbers.length?await db.Project.filter({project_number:{$in:numbers}},{limit:500,fields:['project_number','name','client_name','dataverse_id']}):{items:[]};
 if(projectPage.has_more)throw new Error('Workbook project matching batch exceeds its limit.');
 const matches=new Map();
 for(const code of codes){
  const references=links.filter(r=>r.sage_code===code);if(!references.length)continue;
  const expected=[...new Set(references.map(r=>r.project_number))];
  const candidates=projectPage.items.filter(p=>expected.includes(p.project_number));
  // A shared Sage code cannot be assigned wholly to whichever project happens to exist.
  const unique=expected.length===1&&candidates.length===1?candidates[0]:null;
  matches.set(code,{project_id:unique?.id||'',project_name:unique?.name||'',project_code:unique?.project_number||'',status:unique?'automatic':expected.length>1||candidates.length>1?'ambiguous':'unmatched',...(unique?{matching_method:'number'}:{}),candidates:candidates.slice(0,3),linked_by:'Call Off Contract project-to-Sage table'});
 }
 return matches;
}
export async function applyWorkbookFinanceMappings(base44,state,input){
 if(!state?.namespace)throw new Error('No Dataverse finance snapshot is configured.');
 if(String(input.cursor||'').length>8192)throw new Error('Invalid mapping cursor.');
 const db=base44.entities,page=await db.FinanceProjectMapping.filter({dataset_id:state.namespace,status:{$ne:'manual'}},{limit:100,sort:'source_key',...(input.cursor?{cursor:input.cursor}:{})});
 const matches=await workbookFinanceMatches(base44,page.items.map(m=>({Code:m.source_code}))),updates=[];
 let linked=0,review=0;
 for(const m of page.items){const match=matches.get(normalize(m.source_code));if(!match)continue;updates.push({id:m.id,...match,linked_at:new Date().toISOString()});if(match.project_id)linked++;else review++;}
 if(updates.length)await db.FinanceProjectMapping.bulkUpdate(updates);
 return {processed:page.items.length,linked,review,has_more:page.has_more,next_cursor:page.next_cursor||null};
}