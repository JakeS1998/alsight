import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const welcome = { role: 'assistant', content: "Tell me about the project: what you want to build or refurbish, the client, budget, location, BDM and durations for RIBA 1–4 and construction (RIBA 5–7). I’ll fill in the form and ask for anything missing; nothing is submitted until you review it." };
export default function useProjectBrief({ form, setForm, choices, onDirectorOption }) {
  const [messages, setMessages] = useState([welcome]);
  const [confirmed, setConfirmed] = useState([]);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const generation = useRef(0);
  const reset = () => { generation.current++; lock.current = false; setMessages([welcome]); setConfirmed([]); setComplete(false); setBusy(false); setError(''); };
  const send = async text => {
    if (!text.trim() || lock.current) return false;
    lock.current = true; setBusy(true); setError('');
    const current = generation.current;
    const nextMessages = [...messages, { role: 'user', content: text.trim() }];
    try {
      const { data } = await base44.functions.invoke('draftProjectRequest', { message: text.trim(), history: messages.slice(-12), draft: form, confirmed, choices });
      if (generation.current !== current) return false;
      onDirectorOption?.(data.directorOption);
      setForm(data.draft); setConfirmed(data.confirmed); setComplete(data.complete);
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
      return true;
    } catch (failure) {
      if (generation.current === current) setError(failure.response?.data?.error || 'ALICE could not process that brief. Try again or use the manual form.');
      return false;
    } finally { if (generation.current === current) { lock.current = false; setBusy(false); } }
  };
  return { messages, confirmed, complete, busy, error, send, reset, totalFields: Object.keys(form).length };
}