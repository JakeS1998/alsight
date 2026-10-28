import {flowRequest} from './dataverseFlowApi.ts';
import {isGuid} from './dataverseFlowFields.ts';
import {networxEmailFields,networxEmailScope} from './networxEmailThreads.ts';
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const emailAddress=value=>typeof value==='string' && value.length<=320 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
const sets={account:'accounts',contact:'contacts',systemuser:'systemusers',queue:'queues'};
export async function networxReplySource(context,id,requireSent=true) {
 const query=new URLSearchParams({'$select':networxEmailFields,'$filter':`${networxEmailScope(context)} and activityid eq ${id}`,'$expand':'email_activity_parties($select=activitypartyid,_partyid_value,participationtypemask,addressused)','$top':'1'});
 const source=(await flowRequest(context.environment,context.token,`emails?${query}`,{headers:{Prefer:'odata.include-annotations="*"'}})).value?.[0];
 if(!source)throw fail('This email is no longer available under this relationship and your Dataverse permissions.',404);
 if(requireSent && ![3,4].includes(source.statuscode))throw fail('Replies are available for sent or received emails. Refresh Networx once this email has finished sending.');
 return source;
}
export function networxReplyRecipients(context,source,mailbox) {
 const own=party=>party._partyid_value?.toLowerCase()===context.principalId.toLowerCase() || (party.addressused && party.addressused.toLowerCase()===mailbox.sender?.toLowerCase());
 const parties=source.email_activity_parties || [],from=parties.filter(p=>p.participationtypemask===1 && !own(p));
 const targets=from.length ? from : parties.filter(p=>p.participationtypemask===2 && !own(p));
 return targets.map(party=>{
  const entity=party['_partyid_value@Microsoft.Dynamics.CRM.lookuplogicalname'],id=sets[entity] && isGuid(party._partyid_value) ? party._partyid_value : null,address=emailAddress(party.addressused) ? party.addressused : '';
  return {key:party.activitypartyid,id,address,name:party['_partyid_value@OData.Community.Display.V1.FormattedValue'] || address || 'Email participant',binding:id ? {[`partyid_${entity}@odata.bind`]:`/${sets[entity]}(${id})`} : {}};
 }).filter(person=>isGuid(person.key) && (person.id || person.address));
}
export function networxReplyPreparation(context,source,mailbox) {
 const recipients=networxReplyRecipients(context,source,mailbox);
 if(!recipients.length)throw fail('No reply recipient is available on this email. Review its sender and recipients in Dataverse.');
 const subject=(/^re\s*:/i.test(source.subject || '') ? source.subject : `Re: ${source.subject || 'Email'}`).slice(0,200);
 return {state:'ready',mailbox,recipients:[],reply:{id:source.activityid,subject,recipients:recipients.map(({key,name,address})=>({key,name,address}))}};
}
export function networxReplyBinding(source) {
 return {'parentactivityid@odata.bind':`/emails(${source.activityid})`,conversationtrackingid:source.conversationtrackingid || source._parentactivityid_value || source.activityid};
}