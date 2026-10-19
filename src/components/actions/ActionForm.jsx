import React, { forwardRef, useState } from 'react';
import ActionFormContext from '@/components/actions/ActionFormContext';
import useActionLock from '@/components/actions/useActionLock';

const ActionForm = forwardRef(function ActionForm({ children, onSubmit, onSubmitCapture, ...props }, ref) {
  const lock = useActionLock(), [submitter, setSubmitter] = useState(null);
  const capture = event => {
    if (onSubmit && (lock.locked.current || event.nativeEvent.submitter?.disabled)) {
      event.preventDefault(); event.stopPropagation(); return;
    }
    onSubmitCapture?.(event);
  };
  const submit = event => {
    if (lock.locked.current) { event.preventDefault(); event.stopPropagation(); return; }
    const button = event.nativeEvent.submitter || event.currentTarget.querySelector('button:not([type]):not(:disabled),button[type="submit"]:not(:disabled),input[type="submit"]:not(:disabled)');
    setSubmitter(button);
    return lock.run(() => onSubmit(event));
  };
  return <ActionFormContext.Provider value={{ pending: lock.pending, locked: lock.locked, submitter }}>
    <form {...props} ref={ref} onSubmitCapture={capture} onSubmit={onSubmit ? submit : undefined}>{children}</form>
  </ActionFormContext.Provider>;
});
export default ActionForm;