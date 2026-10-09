import {submittedProposalStatuses,submittedProposalTotal} from './submittedProjectValue.ts';
export async function backfillProjectValues(base44) {
 const db=base44.asServiceRole.entities,page=await db.Project.filter({full_value:{$exists:false}},{limit:50,fields:['estimated_value','dataverse_id']});
 if(!page.items.length)return {updated:0,hasMore:false};
 const aliases=page.items.flatMap(project=>[project.id,project.dataverse_id].filter(Boolean)),proposals=new Map();let cursor;
 do {
  const fees=await db.FeeProposal.filter({project_id:{$in:aliases},status:{$in:submittedProposalStatuses}},{sort:'-revision_number',limit:50,cursor,fields:['project_id','revision_number','external_cost','line_items']});
  for(const proposal of fees.items)if(!proposals.has(proposal.project_id))proposals.set(proposal.project_id,proposal);
  cursor=fees.has_more ? fees.next_cursor : null;
 }while(cursor);
 const updates=page.items.map(project=>{const proposal=[proposals.get(project.id),proposals.get(project.dataverse_id)].filter(Boolean).sort((a,b)=>Number(b.revision_number)-Number(a.revision_number))[0],value=proposal ? submittedProposalTotal(proposal) : null;return {id:project.id,full_value:value ?? (Number(project.estimated_value) || 0),submitted_proposal_value:value,submitted_proposal_id:value==null ? null : proposal.id};});
 await db.Project.bulkUpdate(updates);
 return {updated:updates.length,hasMore:page.has_more};
}