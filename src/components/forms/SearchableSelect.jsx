import React, { useState } from 'react';

export default function SearchableSelect({ children, value, ...props }) {
  const [search, setSearch] = useState('');
  const options = React.Children.toArray(children);
  if (options.length <= 10) return <select value={value} {...props}>{children}</select>;
  const visible = options.filter(option => {
    if (!React.isValidElement(option)) return false;
    const label = String(option.props.children ?? '');
    return String(option.props.value ?? label) === String(value ?? '') || label.toLowerCase().includes(search.toLowerCase());
  });
  return <span className="flex w-full min-w-0 flex-col gap-1">
    <input type="search" aria-label={`Search ${props['aria-label'] || props.name || 'options'}`} placeholder="Search options…" value={search} onChange={event => setSearch(event.target.value)} disabled={props.disabled} className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm" />
    <select value={value} {...props}>{visible.length ? visible : <option disabled value="__no_matches__">No matches</option>}</select>
  </span>;
}