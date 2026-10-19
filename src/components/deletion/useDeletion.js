import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, requestDeletion } from '@/components/deletion/deletionStore';
export default function useDeletion(scope) {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const key = id => `${scope}:${id}`;
  return {
    request: ({ id, ...operation }) => requestDeletion({ ...operation, key: key(id) }),
    isHidden: id => state.hidden.has(key(id)),
    visible: (items = []) => items.filter(item => !state.hidden.has(key(item.id ?? item.key))),
  };
}