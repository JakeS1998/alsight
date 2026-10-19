import React from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import useActionLock from '@/components/actions/useActionLock';

export default function InlineEditTrigger({ label, onEdit, disabled = false, children, className = '' }) {
  const action = useActionLock(), blocked = disabled || action.engaged;
  const activate = event => {
    if (event.target.closest('a,button,input,textarea,select,summary,[role="button"],[role="combobox"]') !== event.currentTarget && event.target.closest('a,button,input,textarea,select,summary,[role="button"],[role="combobox"]')) return;
    event.stopPropagation();
    if (!blocked && !event.currentTarget.closest('fieldset[disabled]')) return action.run(onEdit);
  };
  return <div role="button" tabIndex={blocked ? -1 : 0} aria-label={`Edit ${label}`} aria-disabled={blocked || undefined}
    aria-busy={action.pending || undefined} title={`Click to edit ${label}`} data-inline-edit-trigger=""
    className={`group/inline relative min-w-0 rounded-md py-1 pl-1 pr-7 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring ${blocked ? 'cursor-default' : 'cursor-pointer hover:bg-primary/10 focus-visible:bg-primary/10'} ${className}`}
    onClick={activate} onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); return activate(event); } }}>
    {children}
    <span aria-hidden="true" className={`pointer-events-none absolute right-1 top-1 flex h-5 w-5 items-center justify-center text-foreground ${action.pending ? '' : blocked ? 'hidden' : 'opacity-0 group-hover/inline:opacity-100 group-focus-visible/inline:opacity-100 [@media(hover:none)]:opacity-100'}`}>
      {action.pending ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Pencil className="h-3.5 w-3.5"/>}
    </span>
  </div>;
}