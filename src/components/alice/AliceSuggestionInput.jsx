import React, { useId, useRef, useState } from 'react';
import { Popover, PopoverAnchor } from '@/components/ui/popover';
import AliceSuggestionList from '@/components/alice/AliceSuggestionList';
import useAliceSuggestions from '@/components/alice/useAliceSuggestions';
import '@/components/alice/alice-suggestions.css';

export default function AliceSuggestionInput({ as: Control = 'input', value, onValueChange, mode = 'general', widgets, placement = 'bottom', suggestionsDisabled = false, onKeyDown, onFocus, onBlur, onSelect, ...props }) {
  const generated = useId(), input = useRef(null), id = props.id || `alice-input-${generated}`, listId = `${id}-suggestions`;
  const [focused, setFocused] = useState(false), [dismissed, setDismissed] = useState(false), [active, setActive] = useState(-1), [cursor, setCursor] = useState(value.length);
  const enabled = focused && !dismissed && !props.disabled && !props.readOnly && !suggestionsDisabled && cursor === value.length && value.trim().length >= 2;
  const suggestions = useAliceSuggestions({ value, cursor, mode, widgets, enabled });
  const items = suggestions.items.filter(item => !props.maxLength || item.value.length <= props.maxLength);
  function choose(item) {
    const position = Math.max(0, cursor + item.value.length - value.length);
    onValueChange(item.value); setDismissed(true); setActive(-1);
    requestAnimationFrame(() => { input.current?.focus({ preventScroll: true }); input.current?.setSelectionRange(position, position); });
  }
  function keyDown(event) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing || !enabled) return;
    if (event.key === 'Escape') { event.preventDefault(); setDismissed(true); return; }
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && items.length) {
      event.preventDefault(); setActive(index => (index + (event.key === 'ArrowDown' ? 1 : index < 0 ? 0 : -1) + items.length) % items.length); return;
    }
    if (['Enter', 'Tab'].includes(event.key) && !event.ctrlKey && !event.metaKey && active >= 0 && items[active]) { event.preventDefault(); choose(items[active]); }
  }
  return <Popover open={enabled} onOpenChange={open => { if (!open) setDismissed(true); }}>
    <PopoverAnchor asChild><div className="alice-suggestion-field" data-alice-input>
      <Control {...props} ref={input} id={id} value={value} role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={enabled} aria-controls={enabled ? listId : undefined} aria-activedescendant={enabled && active >= 0 && items[active] ? `${listId}-${active}` : undefined} autoComplete="off"
        onChange={event => { setCursor(event.target.selectionStart ?? event.target.value.length); setDismissed(false); setActive(-1); onValueChange(event.target.value); }}
        onSelect={event => { setCursor(event.target.selectionStart ?? value.length); onSelect?.(event); }}
        onFocus={event => { setFocused(true); setCursor(event.target.selectionStart ?? value.length); setDismissed(false); onFocus?.(event); }}
        onBlur={event => { setFocused(false); onBlur?.(event); }} onKeyDown={keyDown}/>
    </div></PopoverAnchor>
    {enabled && <AliceSuggestionList id={listId} items={items} active={active} loading={suggestions.loading} error={suggestions.error} onChoose={choose} placement={placement} input={input}/>}
  </Popover>;
}