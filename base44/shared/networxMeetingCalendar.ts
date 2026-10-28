import {networxMeetingLink} from './networxActivityMetadata.ts';
export default async function networxMeetingCalendar(client,input,people,metadata) {
 if(metadata.eventId)return metadata;
 const response=await client.functions.invoke('manageOutlookCalendar',{action:'create',timeZone:'UTC',requestId:input.activityId,event:{subject:input.subject.trim(),description:input.notes,location:input.kind==='teams' ? 'Microsoft Teams' : input.location.trim(),start:input.start.slice(0,19),end:input.end.slice(0,19),isAllDay:false,isOnlineMeeting:input.kind==='teams',attendees:[...new Set(people.map(person=>person.address.toLowerCase()))]}});
 if(response.data?.error || !response.data?.event?.id)throw Object.assign(new Error(response.data?.error || 'Outlook did not confirm this meeting. Retry the unchanged form.'),{status:409});
 const event=response.data.event;
 return {...metadata,eventId:event.id,globalObjectId:typeof event.iCalUId==='string' && event.iCalUId.length<=300 ? event.iCalUId : null,webLink:networxMeetingLink(event.webLink),joinUrl:networxMeetingLink(event.onlineMeeting?.joinUrl,true)};
}