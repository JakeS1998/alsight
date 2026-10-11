export async function capacityOrganisationReads(db,user,input,projects,read,ownerAliases=[]) {
  const f=input.filters || {},refs=projects.flatMap(project=>[project.id,project.dataverse_id]).filter(Boolean);
  const opportunityQuery={status:'open',stage:{$nin:['won','lost','on_hold']}};
  if(f.region || user.role==='regional_director')opportunityQuery.project_id={$in:refs};
  if(f.bdm)opportunityQuery.owner_id={$in:ownerAliases};
  if(f.period){const year=new Date().getFullYear()-(new Date().getMonth()<3 ? 1 : 0)-(f.period==='previous' ? 1 : 0);opportunityQuery.created_date={$gte:`${year}-04-01`,$lt:`${year+1}-04-01`};}
  // Opportunity access remains user-scoped, including owner/line-manager RLS.
  const opportunities=await read('responsibility-opportunities:v1',()=>db.Opportunity.aggregate({query:opportunityQuery,groupBy:'id',max:['title','owner_id','owner_name','account_id','contact_id','project_id','budget','stage','expected_project_start'],limit:1000}));
  if(opportunities.truncated)throw new Error('Opportunity responsibility reporting exceeds its limit. Narrow the portfolio filters.');
  const related={project_id:{$in:refs},status:{$ne:'inactive'}};
  const [documents,warranties,approvals]=refs.length ? await Promise.all([
    read('responsibility-documents:v1',()=>db.LegalDocument.aggregate({query:{...related,executed:{$ne:'yes'}},groupBy:['project_id','drafting_due_date','signing_target_date'],limit:1000})),
    read('responsibility-warranties:v1',()=>db.Warranty.aggregate({query:{...related,$or:[{date_of_execution:{$exists:false}},{date_of_execution:{$in:[null,'']}}]},groupBy:['project_id','warranty_due'],limit:1000})),
    read('responsibility-approvals:v1',()=>db.DocumentApprovalRequest.aggregate({query:{project_id:{$in:refs},status:'pending',source_requires_approval:true},groupBy:'project_id',limit:1000}))
  ]) : [{rows:[]},{rows:[]},{rows:[]}];
  if([documents,warranties,approvals].some(result=>result.truncated))throw new Error('Administration reporting exceeds its limit. Narrow the portfolio filters.');
  return {opportunities:opportunities.rows.map(row=>({id:row.id,...Object.fromEntries(Object.entries(row).filter(([key])=>key.startsWith('max_')).map(([key,value])=>[key.slice(4),value]))})),documents:documents.rows,warranties:warranties.rows,approvals:approvals.rows};
}