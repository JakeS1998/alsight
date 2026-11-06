import React, { useEffect, useRef } from 'react';
import AliceReply from '@/components/alice/AliceReply';
import AliceDocumentAttachment from '@/components/alice/AliceDocumentAttachment';
import aliceDisplayMessages from '@/components/alice/aliceDisplayMessages';
import useAliceDocumentResults from '@/components/alice/useAliceDocumentResults';
export default function AliceMessages({ conversationId, messages, busy, draftMode, onApply }) {
  const bottom = useRef(null);
  const documentMessages = useAliceDocumentResults(conversationId, messages);
  const visible = aliceDisplayMessages(documentMessages);
  const lastReply = [...visible].reverse().find(m => m.role === 'assistant')?.content;
  const lastUser = visible.findLastIndex(m => m.role === 'user');
  const awaitingReply = busy && (lastUser < 0 || !visible.slice(lastUser + 1).some(m => m.role === 'assistant'));
  const attachmentCount = visible.reduce((total, message) => total + (message.documents?.length || 0), 0);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages, busy, attachmentCount]);
  return <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
    {visible.map((message, i) => <div key={message.id || i} className={message.role === 'user' ? 'ml-8 rounded-xl bg-primary/15 px-3 py-2 text-sm text-foreground' : 'mr-8 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground'}>
      {message.role === 'assistant' ? <AliceReply content={message.content} /> : <p className="whitespace-pre-wrap break-words">{message.content?.replace(/^(QUESTION|DRAFT FIELD) \| Current page: [^\n]*\n(?:Current contact ID: [^\n]*\nCurrent contact name: [^\n]*\n)?/, '')}</p>}
      {message.documents?.map(document => <AliceDocumentAttachment key={document.file_uri} document={document} />)}
      {message.documentCalls?.some(call => ['pending', 'running', 'in_progress'].includes(call.status)) && <p role="status" className="mt-2 text-xs text-muted-foreground">Creating your document...</p>}
      {!message.documents?.length && message.documentCalls?.some(call => ['completed', 'success'].includes(call.status)) && <p role="status" className="mt-2 text-xs text-muted-foreground">Loading your download attachment...</p>}
      {!message.documents?.length && message.documentCalls?.some(call => ['failed', 'error'].includes(call.status)) && <p role="alert" className="mt-2 text-xs text-destructive">The document could not be created. Ask ALICE to try again.</p>}
    </div>)}
    {awaitingReply && <div className="mr-8 w-fit rounded-xl bg-secondary px-4 py-2 text-sm font-semibold tracking-widest text-muted-foreground" role="status" aria-label="ALICE is thinking">...</div>}
    {draftMode && lastReply && !busy && <button type="button" onClick={() => onApply(lastReply)} className="rounded-lg bg-assistant px-3 py-2 text-xs font-semibold text-white">Insert draft into field</button>}
    <div ref={bottom} />
  </div>;
}