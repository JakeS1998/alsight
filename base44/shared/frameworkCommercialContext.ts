import {frameworkProjectNumber} from './frameworkCommercialValues.ts';
export async function frameworkCommercialContext(db,source,scope) {
 const grouped=await source.aggregate({query:scope,groupBy:['project_id','project_number','framework_ref'],sum:'calloff_value',limit:1000});
 if(grouped.truncated)throw new Error('Framework commercial summary exceeded its reporting limit.');
 const refs=[...new Set(grouped.rows.map(row=>row.project_id).filter(Boolean))];
 const numbers=[...new Set(grouped.rows.map(row=>frameworkProjectNumber(row.project_number || row.framework_ref)).filter(Boolean))];
 const projects=new Map();
 const native=refs.filter(ref=>/^[a-f0-9]{24}$/i.test(ref)),legacy=refs.filter(ref=>!/^[a-f0-9]{24}$/i.test(ref));
 for(const [field,values] of [['id',native],['dataverse_id',legacy],['project_number',numbers]]) {
  if(!values.length)continue;
  const result=await db.Project.aggregate({query:{[field]:{$in:values},procurement_route:{$ne:false}},groupBy:['id','dataverse_id','project_number'],sum:'estimated_value',limit:1000});
  if(result.truncated)throw new Error('Framework project estimate lookup exceeded its reporting limit.');
  for(const project of result.rows)projects.set(project.id,project);
 }
 const aliases=[...projects.values()].flatMap(project=>[project.id,project.dataverse_id].filter(Boolean));
 const proposals=new Map(),documents=new Map();
 if(aliases.length) {
  const docs=await db.LegalDocument.aggregate({query:{project_id:{$in:aliases},document_type:{$in:['access_agreement','equipment_only_agreement','single_task_agreement']}},groupBy:['project_id','document_type'],limit:1000});
  if(docs.truncated)throw new Error('Framework agreement lookup exceeded its reporting limit.');
  for(const row of docs.rows){const types=documents.get(row.project_id) || new Set();types.add(row.document_type);documents.set(row.project_id,types);}
  let cursor;
  do {
   const page=await db.FeeProposal.filter({project_id:{$in:aliases},status:{$in:['sent','negotiation','accepted']}},{sort:'-revision_number',limit:50,cursor,fields:['project_id','revision_number','external_cost','line_items']});
   for(const proposal of page.items){const current=proposals.get(proposal.project_id);if(!current || Number(proposal.revision_number)>Number(current.revision_number))proposals.set(proposal.project_id,proposal);}
   cursor=page.has_more ? page.next_cursor : null;
  }while(cursor);
 }
 const settings=await db.FrameworkFeeSettings.filter({key:{$in:['uklf-fee-bands','uklf-fee-bands-fw4','uklf-fee-bands-single_task','uklf-fee-bands-equipment_only','uklf-fee-bands-fw4-single_task','uklf-fee-bands-fw4-equipment_only']}},{limit:50});
 return {rows:grouped.rows,projects:[...projects.values()],proposals,documents,settings:settings.items};
}