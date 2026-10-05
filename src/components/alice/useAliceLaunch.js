import { useEffect, useRef, useState } from 'react';
import { GUIDES } from '@/components/alice/aliceGuides';
export default function useAliceLaunch({ user, guide, open, busy, restoring, send, start, cancel, setOpen, setText, setRestoring }) {
  const [pending, setPending] = useState(null);
  const launch = useRef(null);
  launch.current = event => {
    if (!open) setRestoring(true);
    setOpen(true);
    if (guide?.saving) return;
    const { task, prompt, autoSend = true } = event.detail || {};
    if (task && GUIDES[task]?.roles.includes(user?.role)) {
      setPending(null); setText(''); start(task);
    } else if (typeof prompt === 'string' && prompt.trim()) {
      cancel(); setText(prompt.trim()); setPending(autoSend ? prompt.trim() : null);
    }
  };
  useEffect(() => {
    const listener = event => launch.current(event);
    window.addEventListener('alsight-open-alice', listener);
    return () => window.removeEventListener('alsight-open-alice', listener);
  }, []);
  useEffect(() => {
    if (!pending || !open || restoring || busy || guide) return;
    setPending(null);
    send(pending);
  }, [pending, open, restoring, busy, guide, send]);
  return () => setPending(null);
}