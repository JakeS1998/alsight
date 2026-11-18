import React,{useState} from 'react';
import {Button} from '@/components/ui/button';
import {meetingSessionRequest} from '@/components/projects/workspace/meetingSessionClient';
export default function MeetingSummaryEmailButton({session,disabled}) {
 const [busy,setBusy]=useState(false),[result,setResult]=useState(null),[error,setError]=useState('');
 const send=async()=>{setBusy(true);setError('');try{setResult(await meetingSessionRequest('sendSummary',session.id));}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <div className="space-y-2"><Button size="sm" variant="outline" disabled={disabled || busy || !!result} onClick={send}>{busy ? 'Sending…' : 'Email summary to everyone'}</Button>{result && <p role="status" className="text-sm">{result.sent ? `Summary sent to ${result.sent} participant${result.sent===1 ? '' : 's'}.` : 'No emails were confirmed sent.'}{result.unconfirmed>0 && ` ${result.unconfirmed} sends could not be confirmed.`}{result.unavailable>0 && ` ${result.unavailable} participants had no eligible email address.`}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}