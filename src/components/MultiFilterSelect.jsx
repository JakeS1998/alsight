import React, {useState} from 'react';
import {Popover, PopoverTrigger, PopoverContent} from '@/components/ui/popover';
import {Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem} from '@/components/ui/command';
import {Check, ChevronsUpDown} from 'lucide-react';
import {cn} from '@/lib/utils';
export default function MultiFilterSelect({label, value, onChange, options, allLabel='All'}) {
 const [open,setOpen]=useState(false);
 const selected=Array.isArray(value) ? value : value ? [value] : [];
 const all=label ? `All ${label}` : allLabel;
 const names=selected.map(id=>options.find(option=>option.value===id)?.label || id);
 const display=names.length===1 ? names[0] : names.length ? `${label || 'Options'} (${names.length})` : all;
 const toggle=id=>onChange(selected.includes(id) ? selected.filter(value=>value!==id) : [...selected,id]);
 const indicator=checked=><span aria-hidden="true" className={cn('mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border',checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input')}>
  {checked && <Check className="h-3 w-3"/>}
 </span>;
 return <Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild><button type="button" role="combobox" aria-expanded={open} aria-label={`${label}: ${names.join(', ') || 'All'}`} title={names.join(', ') || all} className="flex h-9 max-w-64 items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20">
   <span className={cn('truncate',!selected.length && 'text-muted-foreground')}>{display}</span><ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground"/>
  </button></PopoverTrigger>
  <PopoverContent className="w-[260px] p-0" align="start"><Command>
   <CommandInput placeholder={`Search ${label || 'options'}…`}/>
   <CommandList role="listbox" aria-multiselectable="true">
    <CommandEmpty>No results found.</CommandEmpty><CommandGroup>
     <CommandItem value={`all-options ${all}`} role="menuitemcheckbox" aria-checked={!selected.length} onSelect={()=>onChange([])}>{indicator(!selected.length)}{all}</CommandItem>
     {options.map(option=><CommandItem key={option.value} value={`${option.label} ${option.value}`} role="menuitemcheckbox" aria-checked={selected.includes(option.value)} onSelect={()=>toggle(option.value)} className={cn(selected.includes(option.value) && 'text-primary')}>
      {indicator(selected.includes(option.value))}{option.label}
     </CommandItem>)}
    </CommandGroup>
   </CommandList>
  </Command></PopoverContent>
 </Popover>;
}