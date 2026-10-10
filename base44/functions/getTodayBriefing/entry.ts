import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { todayBriefing } from '../../shared/todayBriefing.ts';
export default async function(req) {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Unauthorized'},{status:401});
  if(!['admin','director','regional_director','bsm','bdm','finance'].includes(user.role))return Response.json({error:'Forbidden'},{status:403});
  const input=await req.json();
  if(!Array.isArray(input.projectIds) || input.projectIds.length>2000 || input.projectIds.some(id=>typeof id!=='string' || !/^[a-f0-9]{24}$/i.test(id)))return Response.json({error:'Invalid project selection'},{status:400});
  return Response.json(await todayBriefing(base44,input.projectIds,user));
 } catch(error) {return Response.json({error:error.message},{status:500});}
}