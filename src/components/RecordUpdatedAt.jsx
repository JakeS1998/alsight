import React from 'react';
const format = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London', timeZoneName: 'short' });
export default function RecordUpdatedAt({ record, className = '', label = true }) {
  const value = record?.updated_date;
  const utcValue = typeof value === 'string' && value.includes('T') && !/(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? `${value}Z` : value;
  const date = utcValue ? new Date(utcValue) : null;
  const valid = date && Number.isFinite(date.getTime());
  return <span className={`block text-xs font-normal text-muted-foreground ${className}`} title="Last saved in ALSight, including synchronised updates">
    {label && 'Last updated: '}{valid ? <time dateTime={date.toISOString()}>{format.format(date)}</time> : 'Not recorded'}
  </span>;
}