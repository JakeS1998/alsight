export const submittedProposalStatuses=['sent','negotiation','accepted'];
export function submittedProposalTotal(proposal) {
 const lines=JSON.parse(proposal.line_items || '[]');
 if(!Array.isArray(lines))throw new Error('Fee proposal lines must be an array.');
 // An unpopulated builder is not a priced submission. An explicitly saved zero is valid.
 if(proposal.external_cost==null)return null;
 const amount=line=>Math.round(Object.values(line.stage_fees && typeof line.stage_fees==='object' ? line.stage_fees : {fee:line.internal_fee}).reduce((sum,value)=>sum+(Number(value) || 0),0)*100)/100;
 const value=Number(proposal.external_cost)+lines.filter(line=>line.include_on_client!==false).reduce((sum,line)=>sum+amount(line),0);
 if(!Number.isFinite(value) || value<0)throw new Error('The submitted fee proposal has an invalid client total.');
 return Math.round(value*100)/100;
}
export async function refreshSubmittedProjectValue(base44,project) {
 const aliases=[project.id,project.dataverse_id].filter(Boolean),db=base44.asServiceRole.entities;
 const page=await db.FeeProposal.filter({project_id:{$in:aliases},status:{$in:submittedProposalStatuses}},{sort:'-revision_number',limit:1,fields:['revision_number','external_cost','line_items']});
 const proposal=page.items[0],value=proposal ? submittedProposalTotal(proposal) : null,id=value==null ? null : proposal.id,fullValue=value ?? (Number(project.estimated_value) || 0);
 if((project.submitted_proposal_value ?? null)!==value || (project.submitted_proposal_id ?? null)!==id || project.full_value!==fullValue)await db.Project.update(project.id,{full_value:fullValue,submitted_proposal_value:value,submitted_proposal_id:id});
 return {projectId:project.id,value,source:value==null ? 'estimate' : 'submitted_proposal'};
}