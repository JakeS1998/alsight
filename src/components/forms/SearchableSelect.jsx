import React, { useRef, useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchHighlight from '@/components/search/SearchHighlight';
import {textContent} from '@/components/search/orderedSearch';

export default function SearchableSelect({ children, value, externalSearch=false, searchTerm='', ...props }) {
  const [open, setOpen] = useState(false);
  const select = useRef(null), trigger = useRef(null);
  const options = React.Children.toArray(children).filter(React.isValidElement);
  if ((!externalSearch && options.length <= 10) || props.multiple) return <select value={value} {...props}>{children}</select>;
  const optionValue = option => String(option.props.value ?? option.props.children ?? '');
  const selected = options.find(option => optionValue(option) === String(value ?? props.defaultValue ?? optionValue(options[0])));
  function choose(option) {
    select.current.value = optionValue(option);
    select.current.dispatchEvent(new Event('change', { bubbles: true }));
    setOpen(false);
  }
  return <span className="relative inline-block w-full min-w-0">
    <select {...props} ref={select} id={undefined} value={value} tabIndex={-1} aria-hidden="true" className="sr-only" onInvalid={event => { event.preventDefault(); trigger.current?.focus(); setOpen(true); }}>{children}</select>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button ref={trigger} id={props.id} type="button" role="combobox" aria-expanded={open} aria-required={props.required || undefined} aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']} aria-describedby={props['aria-describedby']} disabled={props.disabled} title={props.title} onFocus={props.onFocus} onBlur={props.onBlur} className={cn('flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-background px-2 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50', props.className)}>
          <span className="truncate">{selected?.props.children || 'Select an option'}</span><ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground"/>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command shouldFilter={!externalSearch}>
          {!externalSearch && <CommandInput aria-label={`Search ${props['aria-label'] || props.name || 'options'}`} placeholder="Search options…"/>}
          <CommandList>
            <CommandEmpty>No matches found.</CommandEmpty>
            <CommandGroup>{options.map((option, index) => <CommandItem key={index} value={String(index)} keywords={[String(option.props.children ?? '')]} disabled={option.props.disabled} onSelect={() => choose(option)}>
              <Check className={cn('h-4 w-4 shrink-0', selected === option ? 'opacity-100' : 'opacity-0')}/>{externalSearch ? <SearchHighlight text={textContent(option.props.children)} term={searchTerm}/> : option.props.children}
            </CommandItem>)}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </span>;
}