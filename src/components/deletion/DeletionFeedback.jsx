import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import DeletionConfirmation from '@/components/deletion/DeletionConfirmation';
import DeletionUndoBar from '@/components/deletion/DeletionUndoBar';
import { subscribe, getSnapshot, cancelPendingDeletions, dismissError } from '@/components/deletion/deletionStore';
export default function DeletionFeedback() {
  const state = useSyncExternalStore(subscribe, getSnapshot), { user } = useAuth(), owner = useRef(user?.id);
  useEffect(() => { if (owner.current !== user?.id) { cancelPendingDeletions(); owner.current = user?.id; } }, [user?.id]);
  useEffect(() => {
    if (!state.pending.length) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [state.pending.length]);
  return <><DeletionConfirmation operation={state.modal}/>
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] mx-auto flex max-w-xl flex-col gap-2 px-4 pb-[env(safe-area-inset-bottom)] [&>*]:pointer-events-auto">
      {state.pending.map(operation => <DeletionUndoBar key={operation.key} operation={operation}/>)}
      {state.error && <div role="alert" className="flex items-center gap-3 rounded-panel border border-destructive bg-card p-4 text-sm"><p className="flex-1">{state.error}</p><Button type="button" variant="ghost" size="sm" onClick={dismissError}>Dismiss</Button></div>}
    </div>
  </>;
}