import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {scopedReadCache} from '../../shared/scopedReadCache.ts';
import {readPortfolioStages} from '../../shared/portfolioStageSummary.ts';
export default async function(req) {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in required'},{status:401});
  const input=await req.json();
  if(!Array.isArray(input.projectIds) || input.projectIds.length>2000 || input.projectIds.some(id=>typeof id!=='string' || !/^[a-f0-9]{24}$/i.test(id)) || (input.valueVersion!=null && (typeof input.valueVersion!=='string' || input.valueVersion.length>100)))return Response.json({error:'Invalid project selection'},{status:400});
  const scope=JSON.stringify([user.id,user.role,user.data,user.account_id,user.region,user.staff_aad_id,user.delegate_of,input.projectIds.slice().sort(),input.valueVersion,input.stages===true]);
  const result=await scopedReadCache(`project-values:${scope}`,async()=>{
   const query={id:{$in:input.projectIds.length ? input.projectIds : ['000000000000000000000000']}},report=await base44.entities.Project.aggregate({query,groupBy:['department_id','live_project'],sum:'full_value',limit:1000});
   if(report.truncated)throw new Error('Project value summary exceeded its reporting limit.');
   const regions=new Map();let total=0,count=0,live=0;
   for(const row of report.rows){total+=row.sum_full_value || 0;count+=row.count;if(row.live_project===true)live+=row.count;const key=row.department_id || null,region=regions.get(key) || {department_id:key,value:0,count:0};region.value+=row.sum_full_value || 0;region.count+=row.count;regions.set(key,region);}
   const stages=input.stages===true ? await readPortfolioStages(base44.entities,query,new Date().toISOString(),(_key,read)=>read()) : undefined;
   return {total,count,live,average:count ? total/count : 0,regions:[...regions.values()],...(stages ? {stages} : {})};
  });
  return Response.json(result);
 }catch(error){return Response.json({error:error.message},{status:/rate limit|too many requests/i.test(error.message) ? 429 : 500});}
}