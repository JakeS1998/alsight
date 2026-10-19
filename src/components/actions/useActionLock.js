import { useCallback, useEffect, useRef, useState } from 'react';
import { collectActionResults } from '@/components/actions/actionResults';

export default function useActionLock() {
  const locked = useRef(false), tracked = useRef(false), mounted = useRef(true), frames = useRef([]);
  const [engaged, setEngaged] = useState(false), [pending, setPending] = useState(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; frames.current.forEach(cancelAnimationFrame); }; }, []);
  const release = useCallback(() => {
    locked.current = false;
    if (mounted.current) { setEngaged(false); setPending(false); }
  }, []);
  const run = useCallback(callback => {
    if (locked.current) return;
    locked.current = true;
    tracked.current = false;
    setEngaged(true);
    let waiting = false;
    try {
      const { result, results } = collectActionResults(callback);
      if (results.length) {
        waiting = true;
        tracked.current = true;
        setPending(true);
        return Promise.allSettled(results).then(() => result).finally(release);
      }
      return result;
    } finally {
      if (!waiting) {
        frames.current.forEach(cancelAnimationFrame);
        frames.current = [requestAnimationFrame(() => {
          frames.current = [requestAnimationFrame(release)];
        })];
      }
    }
  }, [release]);
  return { locked, tracked, engaged, pending, run };
}