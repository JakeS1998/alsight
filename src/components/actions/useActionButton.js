import { useContext, useLayoutEffect, useRef, useState } from 'react';
import ActionFormContext from '@/components/actions/ActionFormContext';
import useActionLock from '@/components/actions/useActionLock';

export default function useActionButton({ disabled, loading, type, asChild, onClick, onClickCapture }) {
  const node = useRef(null), label = useRef(''), form = useContext(ActionFormContext), lock = useActionLock();
  const [awaitingDisabled, setAwaitingDisabled] = useState(false);
  const submit = !!form && !asChild && type !== 'button' && type !== 'reset';
  useLayoutEffect(() => {
    if (lock.engaged && disabled) setAwaitingDisabled(true);
    if (!disabled) setAwaitingDisabled(false);
  }, [lock.engaged, disabled]);
  const tracked = lock.tracked.current || (submit && form.tracked.current);
  const busy = loading || lock.pending || (!tracked && disabled && (lock.engaged || awaitingDisabled)) || (submit && form.pending && form.submitter === node.current);
  const blocked = disabled || loading || lock.pending || (submit && form.pending);
  const stop = event => { event.preventDefault(); event.stopPropagation(); };
  const capture = event => {
    if (blocked || lock.locked.current || (submit && form.locked.current)) return stop(event);
    onClickCapture?.(event);
  };
  const click = event => {
    if (blocked || lock.locked.current || (submit && form.locked.current)) return stop(event);
    label.current = node.current?.getAttribute('aria-label') || node.current?.textContent?.trim() || node.current?.title || 'Working';
    return lock.run(() => onClick?.(event));
  };
  return { node, label, busy, blocked, click, capture };
}