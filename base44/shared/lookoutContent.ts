import { departments, lines, shiftDate } from './lookoutDates.ts';
export function cleanLookoutInputs(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid editorial content.');
  const limits = {announcement:600,actions:2000,events:2000,people:2000,values:1500,released:1500,coming_soon:1500,poll_question:200,poll_options:500};
  const result = {};
  for (const [key,max] of Object.entries(limits)) {
    const v = value[key] ?? '';
    if (typeof v !== 'string' || v.length > max) throw new Error(`${key.replaceAll('_',' ')} exceeds its limit of ${max} characters.`);
    result[key] = v.trim();
  }
  result.departments = departments.map(name => {
    const row = (Array.isArray(value.departments) ? value.departments : []).find(r => r.name === name) || {};
    const out = {name};
    for (const field of ['summary','impact','action']) { if (typeof (row[field] ?? '') !== 'string' || (row[field] || '').length>600) throw new Error('Department fields must be at most 600 characters.'); out[field] = (row[field] || '').trim(); }
    return out;
  });
  const options = lines(result.poll_options);
  if (options.length && (options.length < 2 || options.length > 5 || new Set(options).size !== options.length || options.some(s => s.length > 100))) throw new Error('Use 2–5 different poll options, up to 100 characters each.');
  for (const line of lines(result.events)) {
    const [date,type,title] = line.split('|').map(s => s.trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date || !type || !title) throw new Error('Calendar entries must use YYYY-MM-DD | Event type | Title.');
  }
  return result;
}
export function buildLookoutContent(sources, inputs, publicationDate) {
  const editorial = cleanLookoutInputs(inputs), upper = shiftDate(publicationDate,14);
  const manualEvents = lines(editorial.events).map(line => { const [date,type,...rest] = line.split('|').map(s=>s.trim()); return {date,type,title:rest.join(' | ')}; });
  const options = lines(editorial.poll_options);
  return {
    kpis: [{label:'Projects Won',value:sources.won,detail:'Recorded opportunity wins'},{label:'Projects Started',value:sources.started,detail:'Recorded construction starts'},{label:'Practical Completions',value:sources.completed,detail:'Recorded practical completions'},{label:'Major Milestones',value:sources.milestoneProjects,detail:'Projects with a recorded RIBA 1–4 completion date'}],
    announcement:editorial.announcement || sources.announcement || 'No business announcement submitted.',
    actions:lines(editorial.actions),departments:editorial.departments,
    events:[...(sources.events || []),...manualEvents].filter(e=>e.date>=publicationDate && e.date<upper).sort((a,b)=>a.date.localeCompare(b.date)),
    people:[...lines(editorial.people),...(sources.recognition || [])], values:editorial.values,
    released:lines(editorial.released),coming_soon:lines(editorial.coming_soon),
    poll:{question:editorial.poll_question || 'Which part of The Lookout is most useful to you?',options:options.length ? options : ['Executive snapshot','Department round-up','People & culture']},
    reporting_window:`Recorded data: ${sources.window_start.slice(0,10)} to ${sources.window_end.slice(0,10)}. Snapshot generated ${new Date(sources.window_end).toLocaleString('en-GB',{timeZone:'Europe/London'})} UK time.`,
    notes:'Counts use recorded dates, not independently verified events. Major Milestones counts projects, not individual milestones. Department, policy, training, people and release-roadmap content is supplied and reviewed by administrators.'+(sources.calendar_limited ? ' Programme calendar is a limited selection; consult project records for the full schedule.' : '')
  };
}