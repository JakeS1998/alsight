import React, { useEffect, useRef } from 'react';
import { CornerDownLeft, Loader2, Search, Sparkles } from 'lucide-react';
import { PopoverContent } from '@/components/ui/popover';

export default function AliceSuggestionList({ id, items, active, loading, error, onChoose, placement, input }) {
  const list = useRef(null);
  useEffect(() => { list.current?.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' }); }, [active]);
  return <PopoverContent role="presentation" side={placement} align="start" sideOffset={6} collisionPadding={12} className="alice-suggestion-popup" onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()} onInteractOutside={event => { if (input.current === event.target) event.preventDefault(); }}>
    <p className="alice-suggestion-caption">Suggestions · select to insert</p>
    <div ref={list} id={id} role="listbox" aria-label="ALICE typing suggestions" aria-busy={loading}>
      {items.map((item, index) => {
        const Icon = item.kind === 'Record' || item.kind === 'Framework record' ? Search : item.kind === 'Completion' ? CornerDownLeft : Sparkles;
        return <button key={`${item.kind}:${item.value}`} id={`${id}-${index}`} type="button" role="option" tabIndex={-1} aria-selected={index === active} className="alice-suggestion-option" onMouseDown={event => event.preventDefault()} onClick={() => onChoose(item)}><Icon aria-hidden="true"/><span>{item.text}<small>{item.kind}{item.detail ? ` · ${item.detail}` : ''}</small></span></button>;
      })}
    </div>
    {loading && <p role="status" className="alice-suggestion-caption alice-suggestion-status"><Loader2 size={12} className="animate-spin"/>Finding accessible records…</p>}
    {error && <p role="status" className="alice-suggestion-caption">{error}</p>}
    {!items.length && !loading && !error && <p className="alice-suggestion-caption">No matching suggestions. Keep typing your own message.</p>}
    {items.length > 0 && <p className="alice-suggestion-caption">↑↓ to choose · Enter or Tab to insert · Esc to dismiss. Nothing is submitted automatically.</p>}
  </PopoverContent>;
}