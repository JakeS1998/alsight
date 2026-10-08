import React from 'react';
import { formatDate } from '@/lib/portal';
export default function DMAFieldValue({ value, date = false, link = false }) {
  if (value == null || (typeof value === 'string' && !value.trim())) return <span className="font-medium text-destructive">Missing</span>;
  const labels = { yes: 'Yes', no: 'No', na: 'N/A', tbc: 'TBC', active: 'Active', inactive: 'Inactive' };
  if (link) return <a href={value} target="_blank" rel="noreferrer" className="text-primary underline break-all">View file</a>;
  return <span className="whitespace-pre-line break-words">{date ? formatDate(value) : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : labels[value] || value}</span>;
}