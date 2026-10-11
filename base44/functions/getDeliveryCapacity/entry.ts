import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { capacityRoles } from '../../shared/deliveryCapacityScope.ts';
import { deliveryCapacityReport } from '../../shared/deliveryCapacityReport.ts';
export default async function(req) {
  try {
    const base44=createClientFromRequest(req),user=await base44.auth.me();
    if(!user)return Response.json({error:'Unauthorized'},{status:401});
    if(!capacityRoles.includes(user.role))return Response.json({error:'Internal workforce information is not available to this role.'},{status:403});
    const input=await req.json();
    const validId=value=>typeof value==='string' && value.length>0 && value.length<=100;
    if(input.projectIds!==undefined && (!Array.isArray(input.projectIds) || input.projectIds.length>2000 || input.projectIds.some(id=>!validId(id))))return Response.json({error:'Invalid portfolio selection'},{status:400});
    if(input.projectId!==undefined && !validId(input.projectId) || input.person!==undefined && !validId(input.person) || input.days!==undefined && ![30,60,90].includes(input.days) || input.offset!==undefined && (!Number.isInteger(input.offset) || input.offset<0 || input.offset>1000) || input.action!==undefined && input.action!=='projects' || input.cursor!==undefined && (typeof input.cursor!=='string' || input.cursor.length>4000) || input.personal!==undefined && typeof input.personal!=='boolean')return Response.json({error:'Invalid capacity request'},{status:400});
    // Report identities use contact access and the current profile, not User directory permissions.
    return Response.json(await deliveryCapacityReport(base44.entities,user,input));
  } catch(error) {
    const upstreamStatus=Number(error.response?.status || error.status || 0);
    const message=error.response?.data?.error || error.message || 'Delivery capacity could not be loaded.';
    const limited=upstreamStatus===429 || /rate limit|too many requests|status code 429/i.test(String(message));
    console.error('Delivery capacity request failed', {message:String(message),upstreamStatus,stack:error.stack});
    return Response.json({error:limited ? 'Capacity reporting is temporarily busy. Please try again shortly.' : String(message)},{status:limited ? 429 : 500});
  }
}