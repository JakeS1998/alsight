import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { listStates } from '@/components/navigation/navigationMemory';

// Keep presentation state only, scoped to the signed-in user, role and list.
export default function useListState(name, initialValue) {
  const { user } = useAuth(), { pathname } = useLocation();
  const key = JSON.stringify([user?.id, user?.role, pathname, name]);
  const entry = useMemo(() => {
    if (!listStates.has(key)) listStates.set(key, { value: typeof initialValue === 'function' ? initialValue() : initialValue, listeners: new Set() });
    return listStates.get(key);
  }, [key]);
  const subscribe = useCallback(listener => { entry.listeners.add(listener); return () => entry.listeners.delete(listener); }, [entry]);
  const snapshot = useCallback(() => entry.value, [entry]);
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  const setValue = useCallback(update => {
    const next = typeof update === 'function' ? update(entry.value) : update;
    if (Object.is(next, entry.value)) return;
    entry.value = next;
    entry.listeners.forEach(listener => listener());
  }, [entry]);
  return [value, setValue];
}