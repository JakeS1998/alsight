const sources = [
  { entity:'ProjectAction', due:'due_date', title:'action', done:['done'], label:'Project action' },
  { entity:'CRMTask', due:'due_date', title:'title', done:['completed','cancelled'], label:'Opportunity task' },
  { entity:'CRMContactTask', due:'due_at', title:'title', done:['done'], label:'Contact task' },
];
export const escapeBriefingText = value => String(value).slice(0,200).replace(/\u2014/g, ', ').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export async function personalBriefingPriorities(db, userId, day, timezone) {
  // The scheduled caller is an admin. Use only exact assignments to the recipient's immutable app user ID; never a name, email alias or team scope.
  const pages = await Promise.all(sources.map(source => db[source.entity].filter({owner_id:userId,status:{$nin:source.done}}, {sort:source.due,limit:12,fields:[source.title,source.due]})));
  const formatter = new Intl.DateTimeFormat('en-GB',{timeZone:timezone,day:'numeric',month:'short'});
  const sortable = new Intl.DateTimeFormat('sv-SE',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'});
  const tasks = sources.flatMap((source,index) => pages[index].items.map(row => {
    const raw = row[source.due];
    const valid = Number.isFinite(Date.parse(raw));
    const due = !valid ? null : raw.length === 10 ? raw : sortable.format(new Date(raw));
    const label = !due ? 'No due date' : due < day ? 'Overdue' : due === day ? 'Due today' : `Due ${formatter.format(new Date(`${due}T12:00:00Z`))}`;
    return {due,title:row[source.title],source:source.label,label};
  })).filter(task => task.title).sort((a,b) => (a.due || '9999').localeCompare(b.due || '9999'));
  return tasks.length ? `<ul style="padding-left:18px;margin:0;">${tasks.slice(0,8).map(task => `<li style="padding:0 0 10px;"><strong>${escapeBriefingText(task.title)}</strong><br/>${task.label} &middot; ${task.source}</li>`).join('')}</ul>` : 'There are no open tasks directly assigned to you in ALS Hub.';
}