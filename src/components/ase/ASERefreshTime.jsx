import React from 'react';
import {formatDateTime} from '@/lib/portal';

export default function ASERefreshTime({date}) {
  if(!date || !Number.isFinite(Date.parse(date))) return null;
  return <p className="mt-1 text-[10px] text-muted-foreground">Last ASE refresh: <time dateTime={date}>{formatDateTime(date)}</time></p>;
}