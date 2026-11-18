import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

export default function ApprovalDigestSettings() {
 const { user } = useAuth();
 const [busy,setBusy] = useState('');
 const [notice,setNotice] = useState(null);
 async function run(action) {
  setNotice(null);
  setBusy(action);
  try {
   const {data} = await base44.functions.invoke('manageDailyApprovalDigest',{action});
   const text = data.reason || (action === 'preview'
    ? `${data.eligible} registered approver(s) have approval access and a connected Dataverse account. Their pending approvals are checked before sending. No emails sent.`
    : data.sent ? 'The email service accepted your test digest. Check your inbox.' : 'The email service did not confirm the test send. Check your inbox before trying again.');
   setNotice({text});
  } catch (error) {
   setNotice({text:error.response?.data?.error || 'Unable to complete the digest check. Please try again.',error:true});
  } finally { setBusy(''); }
 }
 return <section className="space-y-3 rounded-lg border border-border bg-card p-5">
  <h2 className="text-base font-semibold">Microsoft approval digest</h2>
  <p className="text-sm text-muted-foreground">At 4:00 pm London time when the schedule is enabled, each approver receives only their own pending Microsoft approvals, with due dates where available. The digest skips empty inboxes and requires approval access and a connected Dataverse account.</p>
  <p className="text-sm text-muted-foreground">The test sends only to your signed-in address, <strong className="break-all">{user?.email}</strong>. It does not enable the daily schedule or affect daily sends.</p>
  <div className="flex flex-wrap gap-2">
   <Button type="button" variant="outline" disabled={!!busy} onClick={() => run('preview')}>{busy === 'preview' ? 'Checking…' : 'Check eligible approvers'}</Button>
   <Button type="button" disabled={!!busy || !user?.email} onClick={() => run('testSelf')}>{busy === 'testSelf' ? 'Sending test…' : 'Send test to me'}</Button>
  </div>
  {notice && <p role={notice.error ? 'alert' : 'status'} className={notice.error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>{notice.text}</p>}
 </section>;
}