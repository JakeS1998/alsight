import React from 'react';
import {Input} from '@/components/ui/input';
export default function NetworxActivityDates({call}) {
 const local=value=>{const date=new Date(value);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);};
 const now=Date.now(),start=call ? now-15*60000 : Math.ceil(now/1800000)*1800000;
 return <div className="space-y-2"><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm font-medium"><span>{call ? 'Call started' : 'Starts'}</span><Input type="datetime-local" name="start" required defaultValue={local(start)}/></label><label className="space-y-1 text-sm font-medium"><span>{call ? 'Call ended' : 'Ends'}</span><Input type="datetime-local" name="end" required defaultValue={local(call ? now : start+3600000)}/></label></div><p className="text-xs text-muted-foreground">Times are shown in {Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}.</p></div>;
}