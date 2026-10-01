import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from 'lucide-react';
export default function RegisterSortHeading({ column, sort, onSort, loading }) {
  const active = sort.replace(/^-/, '') === column.key;
  const descending = active && sort.startsWith('-');
  const Icon = active ? (loading ? Loader2 : descending ? ArrowDown : ArrowUp) : ArrowUpDown;
  return <th scope="col" aria-sort={active ? descending ? 'descending' : 'ascending' : 'none'} className="px-3 py-2.5 whitespace-nowrap">
    <button type="button" disabled={loading} onClick={() => onSort(active && !descending ? `-${column.key}` : column.key)} aria-label={`Sort by ${column.label}, ${active && !descending ? 'descending' : 'ascending'}`} className="flex items-center gap-1.5 text-left font-semibold uppercase tracking-wide hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
      {column.label}<Icon aria-hidden="true" className={active && loading ? 'h-3.5 w-3.5 shrink-0 animate-spin' : 'h-3.5 w-3.5 shrink-0'} />
    </button>
  </th>;
}