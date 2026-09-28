import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, X } from 'lucide-react';
import AliceMessages from '@/components/alice/AliceMessages';
const SUGGESTIONS = ['What can you help me with?', 'Explain RIBA stages', 'What is a JCT contract?', 'Help draft a project update'];
const AGENT = 'alice';
export default function AliceWidget() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draftMode, setDraftMode] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const pendingAssistantCount = useRef(0);
  const field = useRef(null);
  useEffect(() => {
    const track = e => {
      const el = e.target;
      if (el.closest?.('[data-alice-widget]')) return;
      if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && ['text','email','search','url','tel'].includes(el.type))) field.current = el;
    };
    document.addEventListener('focusin', track);
    return () => document.removeEventListener('focusin', track);
  }, []);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const restore = async () => {
      setRestoring(true);
      try {
        const saved = sessionStorage.getItem('alice_conversation_id');
        if (!saved) return;
        const existing = await base44.agents.getConversation(saved);
        if (alive) { setConversation(existing); setMessages(existing.messages || []); }
      } catch { sessionStorage.removeItem('alice_conversation_id'); }
      finally { if (alive) setRestoring(false); }
    };
    restore(); return () => { alive = false; };
  }, [open]);
  useEffect(() => {
    if (!conversation?.id) return;
    let active = true;
    const subscription = base44.agents.subscribeToConversation(conversation.id, data => {
      if (!active) return;
      setMessages(data.messages || []);
      if ((data.messages || []).filter(m => m.role === 'assistant' && m.content).length > pendingAssistantCount.current) setBusy(false);
    });
    return () => {
      active = false;
      Promise.resolve(subscription).then(stop => {
        if (typeof stop === 'function') stop();
        else if (typeof stop?.unsubscribe === 'function') stop.unsubscribe();
      });
    };
  }, [conversation?.id]);
  const send = async (value, draft = false) => {
    if (!value.trim() || busy || restoring) return;
    pendingAssistantCount.current = messages.filter(m => m.role === 'assistant' && m.content).length;
    setBusy(true); setError(''); setDraftMode(draft); setText('');
    try {
      const chat = conversation || await base44.agents.createConversation({ agent_name: AGENT, metadata: { name: 'ALICE conversation' } });
      if (!conversation) { setConversation(chat); sessionStorage.setItem('alice_conversation_id', chat.id); }
      const activeContact = document.querySelector('[data-alice-contact-id]');
      const pageContext = activeContact ? `\nCurrent contact ID: ${activeContact.dataset.aliceContactId}\nCurrent contact name: ${activeContact.dataset.aliceContactName}` : '';
      const content = `${draft ? 'DRAFT FIELD' : 'QUESTION'} | Current page: ${window.location.pathname}${pageContext}\n${value.trim()}`;
      setMessages(old => [...old, { role: 'user', content: value.trim() }]);
      await base44.agents.addMessage(chat, { role: 'user', content });
    } catch (e) { setBusy(false); setError(e.message || 'Unable to reach ALICE. Please try again.'); }
  };
  const draft = () => {
    const el = field.current;
    if (!el?.isConnected) { setError('Select a text field on the page first.'); return; }
    const label = el.labels?.[0]?.textContent?.trim() || el.getAttribute('aria-label') || el.placeholder || el.name || 'this field';
    send(`Draft a suitable value for the field “${label}”. Current content: ${el.value || '(empty)'}. ${text.trim() ? `My instructions: ${text.trim()}` : 'Write a useful, concise entry.'}`, true);
  };
  const apply = value => {
    const el = field.current;
    if (!el?.isConnected) { setError('The selected field is no longer on the page. Select it again.'); return; }
    const setter = Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, value.trim());
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.focus(); setDraftMode(false); setOpen(false);
  };
  return <div data-alice-widget className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
    {open && <section role="dialog" aria-label="Chat with ALICE" className="mb-3 flex h-[min(620px,calc(100dvh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <header className="flex items-center justify-between bg-als-navy px-4 py-3 text-white"><div><strong>ALICE</strong><p className="text-[11px] text-white/75">Alliance Live Intelligence & Construction Expert</p></div><button type="button" aria-label="Close ALICE" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></header>
      {!messages.length && <div className="space-y-2 px-4 pt-4"><p className="text-sm text-muted-foreground">Ask me a question, or pick a suggestion:</p><div className="flex flex-wrap gap-2">{SUGGESTIONS.map(s => <button type="button" key={s} onClick={() => send(s)} disabled={busy || restoring} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary">{s}</button>)}</div></div>}
      <AliceMessages messages={messages} busy={busy} draftMode={draftMode} onApply={apply} />
      {error && <p role="alert" className="px-4 text-xs text-destructive">{error}</p>}
      <div className="border-t border-border p-3"><form onSubmit={e => { e.preventDefault(); send(text); }} className="flex gap-2"><input aria-label="Message ALICE" value={text} onChange={e => setText(e.target.value)} placeholder="Ask ALICE anything…" className="min-w-0 flex-1 rounded-lg border border-input px-3 py-2 text-sm" /><button aria-label="Send message" type="submit" disabled={busy || restoring || !text.trim()} className="rounded-lg bg-primary px-3 text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button></form><button type="button" onClick={draft} disabled={busy || restoring} className="mt-2 text-xs font-medium text-primary hover:underline">Help fill selected text field</button></div>
    </section>}
    <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Open ALICE assistant" className="ml-auto flex items-center gap-2 rounded-full bg-als-navy px-4 py-3 text-sm font-semibold text-white shadow-lg"><MessageCircle className="h-5 w-5" /> ALICE</button>
  </div>;
}