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
 return {...scope,restricted:true,projectIds:[project.id],codes,projectId:project.id};
}