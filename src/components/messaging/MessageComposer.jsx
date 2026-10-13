import React,{useState} from 'react';
import {Send} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {messageCall} from '@/components/messaging/messageClient';
export default function MessageComposer({peer,onSent}) {
 const [text,setText]=useState(''),[sending,setSending]=useState(false),[error,setError]=useState('');
 async function send(event){event.preventDefault();if(!text.trim()||sending)return;setSending(true);setError('');try{await messageCall({action:'send',peer_id:peer.id,body:text});setText('');onSent();}catch(e){setError(e.message);}finally{setSending(false);}}
 return <form onSubmit={send} className="shrink-0 border-t border-border p-3"><div className="flex items-end gap-2"><textarea aria-label={`Message ${peer.name}`} placeholder="Write a message…" value={text} maxLength={4000} disabled={sending} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send(e);}}} rows={2} className="max-h-28 min-h-10 flex-1 resize-none rounded-lg border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"/><Button type="submit" size="icon" disabled={sending||!text.trim()} aria-label={sending?'Sending message':'Send message'}><Send className="h-4 w-4"/></Button></div>{error&&<p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}</form>;
}