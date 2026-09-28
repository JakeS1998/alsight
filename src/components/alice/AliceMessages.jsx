import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
export default function AliceMessages({ messages, busy, draftMode, onApply }) {
  const bottom = useRef(null);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages, busy]);
  const lastReply = [...messages].reverse().find(m => m.role === 'assistant' && m.content)?.content;
  return <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
    {messages.map((message, i) => <div key={message.id || i} className={message.role === 'user' ? 'ml-8 rounded-xl bg-primary/15 px-3 py-2 text-sm text-foreground' : 'mr-8 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground'}>
      {message.role === 'assistant' ? <div className="prose prose-sm max-w-none break-words"><ReactMarkdown>{message.content || ''}</ReactMarkdown></div> : <p className="whitespace-pre-wrap break-words">{message.content?.replace(/^(QUESTION|DRAFT FIELD) \| Current page: [^\n]*\n(?:Current contact ID: [^\n]*\nCurrent contact name: [^\n]*\n)?/, '')}</p>}
      {message.tool_calls?.map((call, index) => <p key={index} className="mt-1 text-xs text-muted-foreground">{call.display_projection?.hide_details ? (['failed','error'].includes(call.status) ? call.display_projection.error_label : ['pending','running','in_progress'].includes(call.status) ? call.display_projection.active_label : call.display_projection.label) || 'Looking that up…' : `${call.name || 'Lookup'} · ${call.status || 'working'}`}</p>)}
    </div>)}
    {busy && <p className="text-sm text-muted-foreground">ALICE is thinking…</p>}
    {draftMode && lastReply && !busy && <button type="button" onClick={() => onApply(lastReply)} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Insert draft into field</button>}
    <div ref={bottom} />
  </div>;
}