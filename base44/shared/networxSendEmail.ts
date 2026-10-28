import { flowRequest } from './dataverseFlowApi.ts';
import { networxMailbox } from './networxMailbox.ts';
import { resolveNetworxRecipient } from './networxRecipients.ts';
import recipientTypes from './networxRecipientTypes.ts';
import { networxAttachmentRecords, sameNetworxAttachments } from './networxAttachments.ts';
import {networxReplySource,networxReplyRecipients,networxReplyBinding} from './networxEmailReply.ts';
const escape = value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const fail = message=>Object.assign(new Error(message),{status:409});
async function savedEmail(context, id) {
  const filter = `activityid eq ${id} and _ownerid_value eq ${context.principalId} and regardingobjectid_${context.entity}/${context.entity}id eq ${context.sourceId}`;
  const query = new URLSearchParams({'$filter':filter,'$select':'activityid,subject,description,statuscode,_parentactivityid_value','$expand':'email_activity_parties($select=_partyid_value,participationtypemask,addressused),email_activity_mime_attachment($select=activitymimeattachmentid,filename,mimetype,body;$top=6)','$top':'1'});
  return (await flowRequest(context.environment,context.token,`emails?${query}`)).value?.[0] || null;
}
function accepted(email, id) {
  return [3,6,7].includes(email?.statuscode) ? {state:'ready',accepted:true,emailId:id,delivery:email.statuscode===3 ? 'sent' : 'queued',message:email.statuscode===3 ? 'Dataverse reports this email as sent.' : 'Dataverse accepted this email for sending. Delivery is handled by Microsoft.'} : null;
}
export async function sendNetworxEmail(context, input) {
  const {environment,token,principalId,sourceId,entity} = context;
  const [mailbox,selected,existing,reply] = await Promise.all([networxMailbox(context),input.replyToId ? null : resolveNetworxRecipient(context,input.recipient),savedEmail(context,input.emailId),input.replyToId ? networxReplySource(context,input.replyToId) : null]);
  const recipient=reply ? networxReplyRecipients(context,reply,mailbox).find(person=>person.key.toLowerCase()===input.replyRecipientKey.toLowerCase()) : selected;
  if(!recipient)throw fail('Choose a recipient from the original email before replying.');
  if(existing && (existing._parentactivityid_value || '').toLowerCase()!==(input.replyToId || '').toLowerCase())throw fail('This reference belongs to a different email. Close the form and start a new reply.');
  const recipientBinding=reply ? recipient.binding : {[`partyid_${recipient.entity}@odata.bind`]:`/${recipientTypes[recipient.entity].set}(${recipient.id})`};
  const previous = accepted(existing,input.emailId);
  if (previous) return previous;
  if (!mailbox.ready) throw fail(mailbox.issues.join(' '));
  const subject = input.subject.trim(), description = `<div>${escape(input.body.trim()).replace(/\r?\n/g,'<br>')}</div>`;
  const attachments=networxAttachmentRecords(input.attachments || []);
  const payload = {
    activityid:input.emailId,subject,description,directioncode:true,
    ...(reply ? networxReplyBinding(reply) : {}),
    ...(attachments.length ? {email_activity_mime_attachment:attachments} : {}),
    [`regardingobjectid_${entity}@odata.bind`]:`/${entity==='account' ? 'accounts' : 'contacts'}(${sourceId})`,
    email_activity_parties:[
      {'partyid_systemuser@odata.bind':`/systemusers(${principalId})`,participationtypemask:1,addressused:mailbox.sender},
      {...recipientBinding,participationtypemask:2,...(recipient.address ? {addressused:recipient.address} : {})}
    ]
  };
  let email = existing;
  if (!email) {
    try { await flowRequest(environment,token,'emails',{method:'POST',body:JSON.stringify(payload)}); }
    catch (error) {
      // A response can be lost after creation; the stable ID prevents another email.
      email = await savedEmail(context,input.emailId);
      if (!email) throw error;
    }
    email ||= await savedEmail(context,input.emailId);
  }
  if (!email) throw fail('The email could not be confirmed under this relationship and your Dataverse account. Refresh the activity feed before retrying.');
  if((email._parentactivityid_value || '').toLowerCase()!==(input.replyToId || '').toLowerCase())throw fail('This saved email is linked to a different conversation. Close the form and start a new reply.');
  const complete = accepted(email,input.emailId);
  if (complete) return complete;
  const parties = email.email_activity_parties || [];
  const from = parties.filter(p=>p.participationtypemask===1), to = parties.filter(p=>[2,3,4].includes(p.participationtypemask));
  if (email.statuscode!==1 || email.subject!==subject || email.description!==description || from.length!==1 || from[0]._partyid_value?.toLowerCase()!==principalId.toLowerCase() || to.length!==1 || (recipient.id && to[0]._partyid_value?.toLowerCase()!==recipient.id.toLowerCase()) || (recipient.address && (to[0].addressused || '').toLowerCase()!==recipient.address.toLowerCase())) throw fail('This saved email is no longer the same unsent draft. Refresh the feed and start a new email rather than sending it again.');
  if(!sameNetworxAttachments(email.email_activity_mime_attachment || [],attachments))throw fail('The saved draft has different attachments. Refresh the feed and start a new email rather than sending a changed draft.');
  try { await flowRequest(environment,token,`emails(${input.emailId})/Microsoft.Dynamics.CRM.SendEmail`,{method:'POST',body:JSON.stringify({IssueSend:true,TrackingToken:''})}); }
  catch (error) {
    const recovered = accepted(await savedEmail(context,input.emailId),input.emailId);
    if (recovered) return recovered;
    throw error;
  }
  return {state:'ready',accepted:true,emailId:input.emailId,delivery:'queued',message:'Dataverse accepted this email for sending. Delivery is handled by Microsoft.'};
}