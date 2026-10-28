import {flowRequest} from './dataverseFlowApi.ts';
import {resolveNetworxRecipient} from './networxRecipients.ts';
import {networxActivityFingerprint,networxActivityDescription} from './networxActivityMetadata.ts';
import {existingNetworxActivity,validateExistingNetworxActivity,createNetworxActivityRecord,networxActivityParty} from './networxActivityRecords.ts';
import networxMeetingCalendar from './networxMeetingCalendar.ts';
export default async function networxActivitySave(client,context,input) {
 const hash=await networxActivityFingerprint(input),call=input.kind==='call';
 const notes=[call ? `Call direction: ${input.direction==='incoming' ? 'Incoming' : 'Outgoing'}${input.phone ? `\nPhone: ${input.phone}` : ''}` : input.kind==='in_person' ? `Location: ${input.location.trim()}` : 'Microsoft Teams meeting',input.notes].filter(Boolean).join('\n\n');
 let saved=await existingNetworxActivity(context,input),metadata=saved ? validateExistingNetworxActivity(saved,hash,input.kind) : {hash,kind:input.kind,phase:'draft'};
 const result=meta=>({state:'ready',saved:true,activityId:input.activityId,message:call ? 'Completed phone call saved in Dataverse.' : 'Meeting invitations sent through your Outlook calendar and linked to this relationship in Dataverse.',joinUrl:meta.joinUrl || null,webLink:meta.webLink || null});
 if(metadata.phase==='complete')return result(metadata);
 const people=[];
 for(let offset=0;offset<input.people.length;offset+=5)people.push(...await Promise.all(input.people.slice(offset,offset+5).map(person=>resolveNetworxRecipient(context,person))));
 const owner={entity:'systemuser',id:context.principalId};
 const native={activityid:input.activityId,subject:input.subject.trim(),description:networxActivityDescription(notes,metadata),[`regardingobjectid_${context.entity}@odata.bind`]:`/${context.entity==='account' ? 'accounts' : 'contacts'}(${context.sourceId})`,'ownerid@odata.bind':`/systemusers(${context.principalId})`,scheduledstart:input.start,scheduledend:input.end};
 if(call)Object.assign(native,{directioncode:input.direction==='outgoing',phonenumber:input.phone,actualstart:input.start,actualend:input.end,actualdurationminutes:Math.max(1,Math.round((Date.parse(input.end)-Date.parse(input.start))/60000)),phonecall_activity_parties:[networxActivityParty(owner,input.direction==='outgoing' ? 1 : 2),...people.map(person=>networxActivityParty(person,input.direction==='outgoing' ? 2 : 1))]});
 else Object.assign(native,{isdraft:true,location:input.kind==='teams' ? 'Microsoft Teams' : input.location.trim(),appointment_activity_parties:[networxActivityParty(owner,7),...people.filter(person=>person.entity!=='systemuser' || person.id.toLowerCase()!==context.principalId.toLowerCase()).map(person=>networxActivityParty(person,5))]});
 if(!saved)saved=await createNetworxActivityRecord(context,input,native);
 metadata=validateExistingNetworxActivity(saved,hash,input.kind);
 if(metadata.phase==='complete')return result(metadata);
 if(!call)metadata=await networxMeetingCalendar(client,input,people,metadata);
 metadata={...metadata,phase:'complete'};
 const update={description:networxActivityDescription(notes,metadata),statecode:call ? 1 : 3,statuscode:call ? (input.direction==='incoming' ? 4 : 2) : 5,...(!call ? {isdraft:false,...(metadata.globalObjectId ? {globalobjectid:metadata.globalObjectId} : {})} : {})};
 await flowRequest(context.environment,context.token,`${call ? 'phonecalls' : 'appointments'}(${input.activityId})`,{method:'PATCH',body:JSON.stringify(update)});
 return result(metadata);
}