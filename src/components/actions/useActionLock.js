import { useCallback, useEffect, useRef, useState } from 'react';

export default function useActionLock() {
  const locked = useRef(false), mounted = useRef(true), frames = useRef([]);
  const [engaged, setEngaged] = useState(false), [pending, setPending] = useState(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; frames.current.forEach(cancelAnimationFrame); }; }, []);
  const release = useCallback(() => {
    locked.current = false;
    if (mounted.current) { setEngaged(false); setPending(false); }
  }, []);
  const run = useCallback(callback => {
    if (locked.current) return;
    locked.current = true;
    setEngaged(true);
    let result;
    try {
      result = callback();
      if (result && typeof result.then === 'function') {
        setPending(true);
        return Promise.resolve(result).finally(release);
      }
      return result;
    } finally {
      if (!result || typeof result.then !== 'function') {
        frames.current.forEach(cancelAnimationFrame);
        frames.current = [requestAnimationFrame(() => {
          frames.current = [requestAnimationFrame(release)];
        })];
      }
    }
  }, [release]);
  return { locked, engaged, pending, run };
}