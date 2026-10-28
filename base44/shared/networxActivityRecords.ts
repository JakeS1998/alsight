import {flowRequest} from './dataverseFlowApi.ts';
import recipientTypes from './networxRecipientTypes.ts';
import {networxActivityMetadata} from './networxActivityMetadata.ts';
export const networxActivityConflict=message=>Object.assign(new Error(message),{status:409});
export function networxActivityParty(person,role) {return {[`partyid_${person.entity}@odata.bind`]:`/${recipientTypes[person.entity].set}(${person.id})`,participationtypemask:role,...(person.address ? {addressused:person.address} : {})};}
export async function existingNetworxActivity(context,input) {
 const filter=`activityid eq ${input.activityId} and _ownerid_value eq ${context.principalId} and regardingobjectid_${context.entity}/${context.entity}id eq ${context.sourceId}`;
 const query=new URLSearchParams({'$select':'activityid,description,statecode','$filter':filter,'$top':'1'});
 return (await flowRequest(context.environment,context.token,`${input.kind==='call' ? 'phonecalls' : 'appointments'}?${query}`)).value?.[0] || null;
}
export function validateExistingNetworxActivity(row,hash,kind) {
 const metadata=networxActivityMetadata(row.description);
 if(!metadata || metadata.hash!==hash || metadata.kind!==kind)throw networxActivityConflict('This reference belongs to a different saved activity. Close this form, review the timeline and start a new activity.');
 return metadata;
}
export async function createNetworxActivityRecord(context,input,payload) {
 const path=input.kind==='call' ? 'phonecalls' : 'appointments';
 try {await flowRequest(context.environment,context.token,path,{method:'POST',body:JSON.stringify(payload)});}
 catch(error) {const recovered=await existingNetworxActivity(context,input);if(recovered)return recovered;throw error;}
 const saved=await existingNetworxActivity(context,input);
 if(!saved)throw networxActivityConflict('The saved activity could not be confirmed. Retry this unchanged form to reuse the same reference.');
 return saved;
}