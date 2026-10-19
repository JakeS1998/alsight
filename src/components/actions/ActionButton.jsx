import React, { forwardRef, useCallback, useRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import PendingButtonContent from '@/components/actions/PendingButtonContent';
import useActionButton from '@/components/actions/useActionButton';
import { captureActionResult } from '@/components/actions/actionResults';

const ActionButton = forwardRef(function ActionButton({ children, disabled = false, loading = false, asChild = false, type, onClick, onClickCapture, ...props }, ref) {
  const child = asChild && React.isValidElement(children) ? children : null;
  const click = child?.props.onClick ? event => { captureActionResult(child.props.onClick(event)); return onClick?.(event); } : onClick;
  const capture = child?.props.onClickCapture ? event => { child.props.onClickCapture(event); onClickCapture?.(event); } : onClickCapture;
  const action = useActionButton({ disabled, loading: loading || props['aria-busy'] === true || props['aria-busy'] === 'true', type, asChild, onClick: click, onClickCapture: capture });
  const cleanChildren = child ? React.cloneElement(child, { onClick: undefined, onClickCapture: undefined }) : children;
  const original = useRef(cleanChildren);
  if (!action.busy) original.current = cleanChildren;
  const setRef = useCallback(node => {
    action.node.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref, action.node]);
  const Comp = asChild ? Slot : 'button';
  let content = cleanChildren;
  if (action.busy) {
    content = asChild && React.isValidElement(original.current)
      ? React.cloneElement(original.current, undefined, <PendingButtonContent>{original.current.props.children}</PendingButtonContent>)
      : <PendingButtonContent>{original.current}</PendingButtonContent>;
  }
  return <Comp {...props} ref={setRef} type={type} disabled={action.blocked}
    aria-disabled={action.blocked || props['aria-disabled']}
    aria-busy={action.busy || undefined}
    aria-label={action.busy ? props['aria-label'] || action.label.current || 'Working' : props['aria-label']}
    data-action-pending={action.busy ? '' : undefined}
    onClickCapture={action.capture} onClick={action.click}>{content}</Comp>;
});
export default ActionButton;