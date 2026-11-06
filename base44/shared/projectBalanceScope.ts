import {mainProjectNumber,projectNumberPattern} from './financeProjectNumberGroups.ts';
export async function projectBalanceScope(base44,state,input,scope){
 if(input.projectId===undefined)return scope;
 if(typeof input.projectId!=='string'||!/^[a-f0-9]{24}$/i.test(input.projectId))throw new Error('Choose a valid project.');
 // Resolve through the caller's commercial scope and Project RLS before privileged mapping reads.
 const project=await scope.client.entities.Project.get(input.projectId);
 if(!project)throw new Error('Project not available.');
 if(!state?.active_generation)throw new Error('Activate the Power BI reporting source first.');
 const links=await base44.asServiceRole.entities.FinanceProjectMapping.filter({dataset_id:state.namespace,project_id:project.id,status:{$in:['automatic','manual']}},{limit:100,fields:['source_code']});
 if(links.has_more)throw new Error('Project finance links exceed the reporting limit.');
 const codes=[...new Set(links.items.map(link=>String(link.source_code||'').trim().toUpperCase()).filter(Boolean))];
 const consolidated=[...new Set(codes.map(mainProjectNumber))].filter(code=>!codes.includes(code));
 if(consolidated.length){
  // The ledger uses consolidated codes, while PO/SO mappings can carry RIBA suffixes.
  // Include the parent only when every mapped stage belongs to this same project.
  const groups=await base44.asServiceRole.entities.FinanceProjectMapping.aggregate({query:{dataset_id:state.namespace,source_code:{$regex:projectNumberPattern(consolidated),$options:'i'}},groupBy:['source_code','project_id','status'],limit:1000});
  if(groups.truncated)throw new Error('Consolidated project finance links exceed the reporting limit.');
  for(const code of consolidated){
   const matches=groups.rows.filter(row=>mainProjectNumber(row.source_code)===code);
   if(matches.length&&matches.every(row=>row.project_id===project.id&&['automatic','manual'].includes(row.status)))codes.push(code);
  }
 }
 return {...scope,restricted:true,projectIds:[project.id],codes,projectId:project.id};
}