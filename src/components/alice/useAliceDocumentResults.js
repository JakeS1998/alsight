import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import aliceDocumentAttachments from '@/components/alice/aliceDocumentAttachments';

export default function useAliceDocumentResults(conversationId, messages) {
  const [recovered, setRecovered] = useState({});
  const requested = useRef(new Set());
  useEffect(() => { requested.current = new Set(); setRecovered({}); }, [conversationId]);
  const lastReply = [...messages].reverse().find(message => message.role === 'assistant' && message.content)?.id;
  const completed = messages.flatMap(message => (message.tool_calls || []).filter(call =>
    call.name?.includes('createAliceDocument') && ['completed', 'success'].includes(call.status)));
  const missing = completed.filter(call => !aliceDocumentAttachments({ tool_calls: [call] }).length);
  const signature = missing.map(call => call.id).join('|');
  useEffect(() => {
    if (!conversationId || !signature) return;
    const key = `${conversationId}:${signature}:${lastReply || ''}`;
    if (requested.current.has(key)) return;
    requested.current.add(key);
    let active = true;
    base44.agents.getConversation(conversationId).then(chat => {
      if (!active) return;
      const calls = (chat.messages || []).flatMap(message => message.tool_calls || []);
      setRecovered(previous => ({ ...previous, ...Object.fromEntries(calls.filter(call =>
        aliceDocumentAttachments({ tool_calls: [call] }).length).map(call => [call.id, call])) }));
    });
    return () => { active = false; requested.current.delete(key); };
  }, [conversationId, signature, lastReply]);
  return messages.map(message => ({ ...message, tool_calls: message.tool_calls?.map(call =>
    recovered[call.id] && !aliceDocumentAttachments({ tool_calls: [call] }).length ? recovered[call.id] : call) }));
}