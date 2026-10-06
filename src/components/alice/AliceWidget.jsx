import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import AliceMessages from '@/components/alice/AliceMessages';
import AliceWelcome from '@/components/alice/AliceWelcome';
import AliceGuidedChat from '@/components/alice/AliceGuidedChat';
import useAliceGuide from '@/components/alice/useAliceGuide';
import { GUIDES } from '@/components/alice/aliceGuides';
import useAliceLaunch from '@/components/alice/useAliceLaunch';
import { useAuth } from '@/lib/AuthContext';
import aliceAccessKey from '@/components/alice/aliceAccessKey';
const AGENT = 'alice';
export default function AliceWidget() {
  const { user } = useAuth();
  const storageKey = aliceAccessKey(user);
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
  const session = useRef(0);
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
        const saved = sessionStorage.getItem(storageKey);
        if (!saved) return;
        const existing = await base44.agents.getConversation(saved);
        if (alive) { setConversation(existing); setMessages(existing.messages || []); }
      } catch { sessionStorage.removeItem(storageKey); }
      finally { if (alive) setRestoring(false); }
    };
    restore(); return () => { alive = false; };
  }, [open, storageKey]);
  useEffect(() => {
    if (!conversation?.id) return;
    let active = true;
    const currentSession = session.current;
    const subscription = base44.agents.subscribeToConversation(conversation.id, data => {
      if (!active || currentSession !== session.current) return;
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
  const send = async (value, draft = false, explainOnly = false) => {
    if (!value.trim() || busy || restoring) return;
    if (!draft && !explainOnly) {
      const intent = value.trim().match(/\b(?:new|add|create|log|record)\b.{0,45}\b(opportunity|project|risk|comment|action|decision|valuation)\b|\b(opportunity|project|risk|comment|action|decision|valuation)\b.{0,30}\b(?:log|add|create|record)\b/i);
      const type = intent?.[1]?.toLowerCase() || intent?.[2]?.toLowerCase();
      if (type && GUIDES[type].roles.includes(user?.role)) { start(type); setText(''); return; }
    }
    const currentSession = session.current;
    pendingAssistantCount.current = messages.filter(m => m.role === 'assistant' && m.content).length;
    setBusy(true); setError(''); setDraftMode(draft); setText('');
    try {
      const chat = conversation || await base44.agents.createConversation({ agent_name: AGENT, metadata: { name: 'ALICE conversation' } });
      if (currentSession !== session.current) return;
      if (!conversation) { setConversation(chat); sessionStorage.setItem(storageKey, chat.id); }
      const activeContact = document.querySelector('[data-alice-contact-id]');
      const pageContext = activeContact ? `\nCurrent contact ID: ${activeContact.dataset.aliceContactId}\nCurrent contact name: ${activeContact.dataset.aliceContactName}` : '';
      const content = `${draft ? 'DRAFT FIELD' : 'QUESTION'} | Current page: ${window.location.pathname}${pageContext}\n${value.trim()}`;
      setMessages(old => [...old, { role: 'user', content: value.trim() }]);
      await base44.agents.addMessage(chat, { role: 'user', content });
    } catch (e) { if (currentSession === session.current) { setBusy(false); setError(e.message || 'Unable to reach ALICE. Please try again.'); } }
  };
  const clearPendingLaunch = useAliceLaunch({ user, guide, open, busy, restoring, send, start, cancel, setOpen, setText, setRestoring });
  const endChat = () => {
    clearPendingLaunch();
    session.current += 1;
    sessionStorage.removeItem(storageKey);
    setConversation(null);
    setMessages([]);
    setText('');
    setShowTasks(false);
    setBusy(false);
    setError('');
    setDraftMode(false);
    pendingAssistantCount.current = 0;
    cancel();
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
    {open && <section role="dialog" aria-label="Chat with ALICE" className={`mb-3 flex h-[min(710px,calc(100dvh-110px))] ${guide?.type === 'valuation' && guide.step > 0 ? 'w-[min(1100px,calc(100vw-32px))]' : 'w-[min(500px,calc(100vw-32px))]'} flex-col overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-2xl`}>
      <header className="flex items-center gap-3 border-b border-border bg-card px-5 py-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-assistant text-white"><Bot className="h-6 w-6" /></span><div className="min-w-0 flex-1"><strong className="font-heading text-base font-semibold">ALICE</strong><p className="text-xs leading-tight text-muted-foreground">Alliance Leisure Intelligence &amp; Construction Expert</p></div>{(conversation || messages.length > 0 || guide) && <button type="button" onClick={endChat} disabled={restoring || guide?.saving} className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-assistant hover:bg-muted disabled:opacity-50">End chat</button>}<button type="button" aria-label="Close ALICE" onClick={() => setOpen(false)} className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button></header>
      {guide ? <AliceGuidedChat guide={guide} onNext={next} onBack={back} onConfirm={confirm} onCancel={cancel} /> : <>
        {!messages.length && !busy ? <AliceWelcome role={user?.role} disabled={restoring} onStart={start} /> : <>
          <button type="button" onClick={() => setShowTasks(v => !v)} aria-expanded={showTasks} className="block w-full border-b border-border px-5 py-2 text-left text-xs font-semibold text-assistant hover:bg-muted">{showTasks ? 'Hide tasks' : 'Start a task'}</button>
          {showTasks && <div className="grid gap-2 border-b border-border px-5 py-3">{Object.entries(GUIDES).filter(([, item]) => item.roles.includes(user?.role)).map(([type, item]) => <button type="button" key={type} onClick={() => { start(type); setShowTasks(false); }} disabled={busy || restoring} className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-left text-sm hover:border-assistant disabled:opacity-50">{item.label}</button>)}</div>}
          <AliceMessages messages={messages} busy={busy} draftMode={draftMode} onApply={apply} />
        </>}
        {error && <p role="alert" className="px-5 text-xs text-destructive">{error}</p>}
        <div className="border-t border-border px-4 pb-3 pt-4"><form onSubmit={e => { e.preventDefault(); send(text); }} className="flex gap-2"><input aria-label="Message ALICE" value={text} onChange={e => setText(e.target.value)} placeholder="Ask about a project, risk, opportunity…" className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm" /><button aria-label="Send message" type="submit" disabled={busy || restoring || !text.trim()} className="rounded-xl bg-assistant px-4 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form><button type="button" onClick={draft} disabled={busy || restoring} className="mt-2 text-xs text-muted-foreground hover:text-foreground">Help fill selected text field</button></div>
      </>}
    </section>}
    <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Open ALICE assistant" className="ml-auto flex items-center gap-2 rounded-full bg-als-navy px-4 py-3 text-sm font-semibold text-white shadow-lg"><MessageCircle className="h-5 w-5" /> ALICE</button>
  </div>;
}