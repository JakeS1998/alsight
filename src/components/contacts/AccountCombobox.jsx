import React, { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountCombobox({ value, onChange, accounts, placeholder = "Select organisation" }) {
  const [open, setOpen] = useState(false);
  const selected = accounts.find((a) => a.dataverse_id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm hover:bg-slate-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <span className={cn("truncate", !selected && "text-slate-400")}>
            {selected ? selected.name : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput placeholder="Search organisations..." />
          <CommandList>
            <CommandEmpty>No organisations found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => { onChange(""); setOpen(false); }}
                className={cn(!value && "text-primary")}
              >
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                {placeholder}
              </CommandItem>
              {accounts.map((a) => (
                <CommandItem
                  key={a.id}
                  value={a.name}
                  onSelect={() => { onChange(a.dataverse_id); setOpen(false); }}
                  className={cn(value === a.dataverse_id && "text-primary")}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === a.dataverse_id ? "opacity-100" : "opacity-0")} />
                  {a.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}