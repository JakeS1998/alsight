import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AliceReply from '@/components/alice/AliceReply';

export default function ProjectBriefChat({ brief, onManual, onReview, ready }) {
  const [text, setText] = useState('');
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [brief.messages, brief.busy]);
  const submit = async event => { event.preventDefault(); if (await brief.send(text)) setText(''); };
  return <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
    <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground"><Bot className="h-5 w-5 text-assistant" /> Brief ALICE <span className="ml-auto text-xs font-normal text-muted-foreground">{brief.confirmed.length} of {brief.totalFields} fields covered</span></div>
    <div className="max-h-[35dvh] min-h-0 space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-3" aria-live="polite" aria-label="Project brief conversation">
      {brief.messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'ml-6 rounded-lg bg-primary/10 p-3 text-sm' : 'mr-6 rounded-lg bg-secondary p-3 text-sm'}>{message.role === 'user' ? <p className="whitespace-pre-wrap">{message.content}</p> : <AliceReply content={message.content} />}</div>)}
      {brief.busy && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> ALICE is filling in your draft…</p>}<div ref={end} />
    </div>
    {brief.error && <p role="alert" className="text-sm text-destructive">{brief.error}</p>}
    <form onSubmit={submit} className="flex shrink-0 flex-col gap-3">
      <label htmlFor="project-alice-brief" className="text-sm font-medium">{brief.messages.length === 1 ? 'Your project brief' : 'Your answer or correction'}</label>
      <textarea id="project-alice-brief" rows={4} maxLength={6000} value={text} onChange={event => setText(event.target.value)} disabled={brief.busy} placeholder="Describe your project, or answer ALICE’s follow-up questions…" className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      <Button type="submit" disabled={!text.trim() || brief.busy || !ready}>{brief.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{ready ? brief.messages.length === 1 ? 'Give brief to ALICE' : 'Send to ALICE' : 'Loading project choices…'}</Button>
    </form>
    {brief.complete && <Button type="button" onClick={onReview} disabled={brief.busy}>Review populated form</Button>}
    <Button type="button" variant="outline" onClick={onManual} disabled={brief.busy}>Fill in Form Manually</Button>
  </div>;
}