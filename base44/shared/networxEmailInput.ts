import { validateNetworxInput } from './networxQueries.ts';
import { isGuid } from './dataverseFlowFields.ts';
import { validateNetworxAttachments } from './networxAttachments.ts';
export default function networxEmailInput(input) {
  if (!input || typeof input!=='object' || Array.isArray(input)) return 'Choose a relationship record.';
  const sourceError = validateNetworxInput({...input,action:'list',cursor:null});
  if (sourceError) return sourceError;
  if (!['prepare','recipients','enable_tracking','send'].includes(input.action)) return 'Choose a valid Networx email operation.';
  if (input.search != null && (typeof input.search!=='string' || input.search.length>80)) return 'Search using 80 characters or fewer.';
  if (input.action==='send') {
    if (!isGuid(input.emailId)) return 'Start a new email before sending.';
    if (!input.recipient || !['account','contact'].includes(input.recipient.entity) || !isGuid(input.recipient.id)) return 'Select a Dataverse recipient.';
    if (typeof input.subject!=='string' || !input.subject.trim() || input.subject.length>200 || /[\r\n]/.test(input.subject)) return 'Enter a subject of up to 200 characters on one line.';
    if (typeof input.body!=='string' || !input.body.trim() || input.body.length>20000) return 'Enter an email message of up to 20,000 characters.';
    const attachmentError=validateNetworxAttachments(input.attachments);
    if(attachmentError)return attachmentError;
  }
  return null;
}