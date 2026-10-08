import React from 'react';
const formatter=new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'});
export default function ApprovalTimestamp({value,label}) {
 const date=value ? new Date(value) : null;
 if(!date || !Number.isFinite(date.getTime()))return null;
 return <p className="mt-2 text-xs text-muted-foreground">{label}: <time dateTime={date.toISOString()}>{formatter.format(date)}</time></p>;
}