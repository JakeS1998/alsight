import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWellbeing } from '@/components/wellbeing/WellbeingProvider';
import { validHours } from '@/components/wellbeing/workingHours';
import SubmissionSummary from '@/components/forms/SubmissionSummary';
export default function PersonalWorkingHours() {
 const {settings,save}=useWellbeing(),[hours,setHours]=useState(settings.hours),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 useEffect(()=>{setHours(settings.hours);},[settings.hours]);
 function submit(e){e.preventDefault();if(!validHours(hours)){setError('Choose a start and finish on the same day, with finish after start.');return;}save({hours});setError('');setSaved([['Start',hours.start],['Finish',hours.end]]);}
 return <form onSubmit={submit} className="space-y-3 border-t border-border pt-4"><h3 className="text-sm font-semibold">Personal planning hours</h3><p className="text-xs leading-relaxed text-muted-foreground">The standard day is 09:00–17:00. Flexible working from 07:30–18:30 is normal. Your hours guide planning and reminders, not access; wellbeing nudges stay inside both your hours and the flexible window, Monday to Friday.</p><div className="flex flex-wrap items-end gap-3"><label className="space-y-1 text-xs" htmlFor="wellbeing-start">Start<Input id="wellbeing-start" type="time" required value={hours.start} onChange={e=>{setHours({...hours,start:e.target.value});setSaved(false);}}/></label><label className="space-y-1 text-xs" htmlFor="wellbeing-end">Finish<Input id="wellbeing-end" type="time" required value={hours.end} onChange={e=>{setHours({...hours,end:e.target.value});setSaved(false);}}/></label><Button type="submit" variant="outline">Save hours</Button></div>{error&&<p role="alert" className="text-xs text-destructive">{error}</p>}{saved&&<div role="status"><p className="text-xs text-success">Planning hours applied.</p><SubmissionSummary rows={saved}/></div>}</form>;
}