let state = { modal: null, pending: [], hidden: new Set(), error: null };
const listeners = new Set();
let generation = 0;
const emit = changes => { state = { ...state, ...changes }; listeners.forEach(listener => listener()); };
export const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export const getSnapshot = () => state;
export const dismissError = () => emit({ error: null });
export const cancelDeletion = () => emit({ modal: null });
export function requestDeletion(operation) {
  if (state.modal || state.hidden.has(operation.key)) return;
  emit({ modal: operation });
}
export function undoDeletion(key) {
  const operation = state.pending.find(item => item.key === key);
  if (!operation || operation.committing || Date.now() >= operation.expiresAt) return;
  clearTimeout(operation.timer);
  const hidden = new Set(state.hidden); hidden.delete(key);
  emit({ hidden, pending: state.pending.filter(item => item.key !== key) });
}
export function confirmDeletion() {
  const operation = state.modal;
  if (!operation) return;
  const pending = { ...operation, generation, expiresAt: Date.now() + 5000, committing: false };
  // Wait out Undo before changing stored data or sending external cancellations.
  pending.timer = setTimeout(async () => {
    pending.committing = true;
    emit({ pending: [...state.pending] });
    try { await operation.onDelete(); }
    catch (error) {
      if (pending.generation !== generation) return;
      const hidden = new Set(state.hidden); hidden.delete(operation.key);
      emit({ hidden, error: `Could not delete ${operation.label}. ${error?.response?.data?.error || error.message || 'Please try again.'}` });
    } finally { emit({ pending: state.pending.filter(item => item !== pending) }); }
  }, 5000);
  emit({ modal: null, pending: [...state.pending, pending], hidden: new Set([...state.hidden, operation.key]) });
  operation.onStaged?.();
}
export function cancelPendingDeletions() {
  generation++;
  state.pending.forEach(item => clearTimeout(item.timer));
  emit({ modal: null, pending: [], hidden: new Set(), error: null });
}