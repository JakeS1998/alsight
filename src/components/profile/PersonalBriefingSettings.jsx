import React, {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

async function briefingRequest(payload) {
  const {data} = await base44.functions.invoke('managePersonalBriefing',payload);
  return data;
}

export default function PersonalBriefingSettings({userId}) {
  const cache = useQueryClient();
  const key = ['personal-briefing-settings',userId];
  const query = useQuery({queryKey:key,queryFn:() => briefingRequest({action:'status'})});
  const [draft,setDraft] = useState(null);
  const [time,setTime] = useState('08:00');
  const [frequency,setFrequency] = useState('daily');
  const mutation = useMutation({mutationFn:briefingRequest,onSuccess:data => {cache.setQueryData(key,data);setDraft(null);}});
  const data = query.data;
  const selected = draft ?? data?.sections ?? [];
  function submit(event) {
    event.preventDefault();
    if (!selected.length) return;
    mutation.mutate(data.time ? {action:'customise',sections:selected} : {action:'save',time,frequency,timezone:data.timezone,sections:selected});
  }
  return <section className="space-y-3 rounded-xl border border-border bg-card p-6">
    <h2 className="text-base font-semibold">Personal morning briefing</h2>
    <p className="text-sm text-muted-foreground">Choose what you’d like ALICE to email you. Available sections depend on your role.</p>
    {query.isPending && <p role="status" className="text-sm">Loading briefing settings…</p>}
    {query.isError && <p role="alert" className="text-sm">Could not load your briefing settings. <button type="button" className="underline" onClick={() => query.refetch()}>Retry</button></p>}
    {data && <form onSubmit={submit} className="space-y-3">
      {data.time && <p className="text-sm text-muted-foreground">{data.enabled ? 'Scheduled' : 'Paused'} · {data.time} ({data.timezone}) · {data.frequency === 'weekdays' ? 'Weekdays' : 'Daily'}</p>}
      <fieldset disabled={mutation.isPending} className="space-y-2"><legend className="mb-1 text-sm font-medium">Email sections</legend>
        {data.availableSections.map(section => <label key={section.id} className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 accent-primary" checked={selected.includes(section.id)} onChange={event => {mutation.reset();setDraft(event.target.checked ? [...selected,section.id] : selected.filter(id => id !== section.id));}} />
          <span>{section.label}<span className="block text-muted-foreground">{section.description}</span></span>
        </label>)}
      </fieldset>
      {!data.time && <div className="flex flex-wrap items-end gap-3 text-sm"><label>Send time ({data.timezone})<Input type="time" step={300} required value={time} onChange={e => setTime(e.target.value)} /></label><label>Frequency<select className="block h-9 rounded border bg-card px-2" value={frequency} onChange={e => setFrequency(e.target.value)}><option value="daily">Daily</option><option value="weekdays">Weekdays</option></select></label></div>}
      <Button type="submit" disabled={mutation.isPending || !selected.length || (!!data.time && !draft)}>{mutation.isPending ? 'Saving…' : data.time ? 'Save sections' : 'Schedule briefing'}</Button>
      {mutation.isSuccess && <p role="status" className="text-sm text-success">Briefing settings saved.</p>}
      {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error?.response?.data?.error || 'Could not save your briefing settings.'}</p>}
    </form>}
  </section>;
}