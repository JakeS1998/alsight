const sections = [
  { id:'tasks', label:'My assigned tasks', description:'Open ALS Hub tasks directly assigned to you.' },
  { id:'commercial', label:'Commercial overview', description:'Live and on-hold project counts and reporting values.' },
  { id:'documents', label:'Outstanding documents', description:'Unexecuted legal documents, DMAs and JCT contracts on your assigned live projects.' },
];

export function availableBriefingSections(user) {
  const pages = user.page_access ?? user.data?.page_access;
  return sections.filter(({id}) => id === 'tasks'
    || (id === 'commercial' && ['finance','admin','director'].includes(user.role) && pages?.commercial !== false)
    || (id === 'documents' && user.role === 'bsm' && pages?.projects !== false));
}

export function selectedBriefingSections(schedule,user) {
  const allowed = new Set(availableBriefingSections(user).map(s => s.id));
  const saved = Array.isArray(schedule?.sections) ? schedule.sections : ['tasks'];
  const selected = [...new Set(saved.filter(id => allowed.has(id)))];
  return selected.length ? selected : ['tasks'];
}