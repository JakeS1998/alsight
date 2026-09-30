import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { prepareBriefSource, archiveProjectBrief } from '@/components/projects/briefDocuments';

const welcome = { role: 'assistant', content: "Tell me about the project: what you want to build or refurbish, the client, budget, location, BDM and durations for RIBA 1–4 and construction (RIBA 5–7). I’ll fill in the form and ask for anything missing; nothing is submitted until you review it." };
export default function useProjectBrief({ form, setForm, choices, onDirectorOption, onComplete }) {
  const [messages, setMessages] = useState([welcome]);
  const [confirmed, setConfirmed] = useState([]);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sources, setSources] = useState([]);
  const lock = useRef(false);
  const generation = useRef(0);
  const reset = () => { generation.current++; lock.current = false; setMessages([welcome]); setConfirmed([]); setComplete(false); setBusy(false); setError(''); setSources([]); };
  const archive = user => archiveProjectBrief({ messages, sources, confirmed, submitted_form: form }, user);
  const send = async (text, attachment = {}) => {
    if ((!text.trim() && !attachment.file && !attachment.sharepointUrl?.trim()) || lock.current) return false;
    lock.current = true; setBusy(true); setError('');
    const current = generation.current;
    try {
      const source = await prepareBriefSource(attachment, sources.length);
      const content = [text.trim(), source && `Source brief: ${source.name}${source.sharepoint_url ? ` (${source.sharepoint_url})` : ''}`].filter(Boolean).join('\n\n');
      const nextMessages = [...messages, { role: 'user', content }];
      const { data } = await base44.functions.invoke('draftProjectRequest', { message: text.trim(), source, history: messages.slice(-12), draft: form, confirmed, choices });
      if (generation.current !== current) return false;
      if (source) { const { file_url, ...reference } = source; setSources(current => [...current, reference]); }
      onDirectorOption?.(data.directorOption);
      setForm(data.draft); setConfirmed(data.confirmed); setComplete(data.complete);
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
      if (data.complete) onComplete?.();
      return true;
    } catch (failure) {
      if (generation.current === current) setError(failure.response?.data?.error || failure.message || 'ALICE could not process that brief. Try again or use the manual form.');
      return false;
    } finally { if (generation.current === current) { lock.current = false; setBusy(false); } }
  };
  return { messages, sources, confirmed, complete, busy, error, send, reset, archive, totalFields: Object.keys(form).length };
}