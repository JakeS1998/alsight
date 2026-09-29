import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, X } from 'lucide-react';
import AliceMessages from '@/components/alice/AliceMessages';
import AliceGuidedChat from '@/components/alice/AliceGuidedChat';
import useAliceGuide from '@/components/alice/useAliceGuide';
import { GUIDES } from '@/components/alice/aliceGuides';
import { useAuth } from '@/lib/AuthContext';
const AGENT = 'alice';
export default function AliceWidget() {
  const { user } = useAuth();
  const { guide, start, cancel, next, back, confirm } = useAliceGuide(user);
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showTasks, setShowTasks] = useState(false);
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
    if (!draft) {
      const intent = value.trim().match(/\b(?:new|add|create|log|record)\b.{0,45}\b(opportunity|project|risk|comment)\b|\b(opportunity|project|risk|comment)\b.{0,30}\b(?:log|add|create|record)\b/i);
      const type = intent?.[1]?.toLowerCase() || intent?.[2]?.toLowerCase();
      if (type && GUIDES[type].roles.includes(user?.role)) { start(type); setText(''); return; }
    }
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
    {open && <section role="dialog" aria-label="Chat with ALICE" className="mb-3 flex h-[min(650px,calc(100dvh-110px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <header className="flex items-center justify-between gap-3 bg-als-navy px-4 py-3 text-white"><div className="min-w-0"><strong className="text-base">ALICE</strong><p className="text-[11px] leading-tight text-white/75">Alliance Leisure Intelligence &amp; Construction Expert</p></div><button type="button" aria-label="Close ALICE" onClick={() => setOpen(false)} className="shrink-0 rounded-lg p-1 hover:bg-white/10"><X className="h-5 w-5" /></button></header>
      {guide ? <AliceGuidedChat guide={guide} onNext={next} onBack={back} onConfirm={confirm} onCancel={cancel} /> : <>
        {!!messages.length && <button type="button" onClick={() => setShowTasks(v => !v)} aria-expanded={showTasks} className="block w-full border-b border-border px-4 py-2 text-left text-xs font-semibold text-primary hover:bg-muted">{showTasks ? 'Hide tasks' : 'Start a task'}</button>}
        {(!messages.length || showTasks) && <div className="space-y-3 border-b border-border px-4 py-4"><p className="text-sm font-medium">What would you like to do?</p><div className="grid gap-2">{Object.entries(GUIDES).filter(([, item]) => item.roles.includes(user?.role)).map(([type, item]) => <button type="button" key={type} onClick={() => { start(type); setShowTasks(false); }} disabled={busy || restoring} className="rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:border-primary hover:bg-primary/5 disabled:opacity-50">{item.label}</button>)}</div><p className="text-xs text-muted-foreground">Or ask ALICE a question below.</p></div>}
        <AliceMessages messages={messages} busy={busy} draftMode={draftMode} onApply={apply} />
        {error && <p role="alert" className="px-4 text-xs text-destructive">{error}</p>}
        <div className="border-t border-border p-3"><form onSubmit={e => { e.preventDefault(); send(text); }} className="flex gap-2"><input aria-label="Message ALICE" value={text} onChange={e => setText(e.target.value)} placeholder="Ask ALICE anything…" className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" /><button aria-label="Send message" type="submit" disabled={busy || restoring || !text.trim()} className="rounded-lg bg-primary px-3 text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button></form><button type="button" onClick={draft} disabled={busy || restoring} className="mt-2 text-xs font-medium text-primary hover:underline">Help fill selected text field</button></div>
      </>}
    </section>}
    <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Open ALICE assistant" className="ml-auto flex items-center gap-2 rounded-full bg-als-navy px-4 py-3 text-sm font-semibold text-white shadow-lg"><MessageCircle className="h-5 w-5" /> ALICE</button>
  </div>;
}