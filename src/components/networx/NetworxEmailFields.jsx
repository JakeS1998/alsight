import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import NetworxEmailRecipients from '@/components/networx/NetworxEmailRecipients';
import NetworxReplyRecipient from '@/components/networx/NetworxReplyRecipient';
export default function NetworxEmailFields({entity,recordId,recipients,reply}) {
  return <>
    {reply ? <NetworxReplyRecipient reply={reply}/> : <NetworxEmailRecipients entity={entity} recordId={recordId} initial={recipients}/>}
    <div className="space-y-2"><label htmlFor="networx-email-subject" className="block text-sm font-medium">Subject</label><Input id="networx-email-subject" name="subject" required maxLength={200} defaultValue={reply?.subject || ''}/></div>
    <div className="space-y-2"><label htmlFor="networx-email-body" className="block text-sm font-medium">Message</label><Textarea id="networx-email-body" name="body" required maxLength={20000} rows={7}/></div>
    <p className="text-xs text-muted-foreground">Sent as a tracked Dataverse email regarding this record, through the mailbox shown above. No separate Outlook connection is needed.</p>
  </>;
}