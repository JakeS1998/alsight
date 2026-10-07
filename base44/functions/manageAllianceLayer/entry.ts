import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {internalRoles} from '../../shared/allianceLayerAccess.ts';
import {readLessons,readImpact,readHome} from '../../shared/allianceLayerReads.ts';
import {addLesson,addPulse,removeItem,savePurpose} from '../../shared/allianceLayerWrites.ts';
import {managePulseGroups} from '../../shared/pulseGroupActions.ts';
import {researchProjectPurpose} from '../../shared/projectPurposeResearch.ts';
import {mentionPeople} from '../../shared/pulseMentions.ts';
import {updateAllianceNotification} from '../../shared/allianceNotificationActions.ts';
export default async function(req) {
  try {
    const base44=createClientFromRequest(req),user=await base44.auth.me();
    if(!user) return Response.json({error:'Unauthorized'},{status:401});
    if(!internalRoles.includes(user.role)) return Response.json({error:'Alliance internal access only.'},{status:403});
    const input=await req.json();
    if(input.search && (typeof input.search!=='string' || input.search.length>80)) return Response.json({error:'Search must be 80 characters or fewer.'},{status:400});
    if(input.related && !input.projectId) return Response.json({error:'Select a project for similar lessons.'},{status:400});
    if(input.cursor && (typeof input.cursor!=='string' || input.cursor.length>4000)) return Response.json({error:'Invalid continuation.'},{status:400});
    if(['groups','groupCreate','groupPeople','groupMembers','groupMemberAdd','groupMemberRemove','groupOwner','groupLeave'].includes(input.action)) return Response.json(await managePulseGroups(base44,user,input));
    if(input.action==='notificationRead') return Response.json(await updateAllianceNotification(base44,user,input));
    if(input.action==='mentionPeople') return Response.json(await mentionPeople(base44,user,input));
    if(input.action==='lessons') return Response.json(await readLessons(base44,input));
    if(input.action==='impact') return Response.json(await readImpact(base44,input));
    if(input.action==='home') return Response.json(await readHome(base44,input,user));
    if(input.action==='lessonAdd') return Response.json(await addLesson(base44,user,input));
    if(input.action==='pulseAdd') return Response.json(await addPulse(base44,user,input));
    if(input.action==='remove') return Response.json(await removeItem(base44,user,input));
    if(input.action==='purposeSave') return Response.json(await savePurpose(base44,user,input));
    if(input.action==='purposeResearch') return Response.json(await researchProjectPurpose(base44,user,input));
    return Response.json({error:'Unsupported Alliance operation.'},{status:400});
  } catch(error) { return Response.json({error:error.message || 'Unable to complete this Alliance request.'},{status:/rate limit|too many requests/i.test(error.message) ? 429 : 400}); }
}