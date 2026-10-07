import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {internalRoles} from '../../shared/allianceLayerAccess.ts';
import {readLessons,readImpact} from '../../shared/allianceLayerReads.ts';
export default async function(req) {
  try {
    const base44=createClientFromRequest(req),user=await base44.auth.me();
    if(!user) return Response.json({error:'Unauthorized'},{status:401});
    if(!internalRoles.includes(user.role)) return Response.json({error:'Alliance internal access only.'},{status:403});
    const input=await req.json();
    if(input.cursor && (typeof input.cursor!=='string' || input.cursor.length>4000)) return Response.json({error:'Invalid continuation.'},{status:400});
    if(input.search && (typeof input.search!=='string' || input.search.length>80)) return Response.json({error:'Search must be 80 characters or fewer.'},{status:400});
    if(input.related && !input.projectId) return Response.json({error:'Select a project for similar lessons.'},{status:400});
    if(input.action==='lessons') return Response.json(await readLessons(base44,input));
    if(input.action==='impact') return Response.json(await readImpact(base44,input));
    return Response.json({error:'This knowledge operation is read-only; choose lessons or impact.'},{status:400});
  } catch(error) { return Response.json({error:error.message || 'No matching accessible evidence.'},{status:/rate limit|too many requests/i.test(error.message) ? 429 : 400}); }
}