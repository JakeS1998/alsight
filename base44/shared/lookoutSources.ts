export async function collectLookoutSources(db, publicationDate, now = new Date()) {
  const end = now.toISOString(), start = new Date(now.getTime() - 7 * 86400000).toISOString(), dateStart = start.slice(0,10), dateEnd = end.slice(0,10);
  const tomorrow = new Date(new Date(dateEnd+'T12:00:00Z').getTime()+86400000).toISOString().slice(0,10);
  const recent = { $gte: start, $lte: end }, recentDay = { $gte: dateStart, $lt: tomorrow };
  const won = await db.Opportunity.count({status:'won',won_date:recentDay});
  const starts = await db.ProjectDelivery.aggregate({query:{contract_start:recentDay},countDistinct:'project_id'});
  const started = starts.rows[0]?.count_distinct_project_id || 0;
  const completed = await db.Project.count({status:{$ne:'inactive'},practical_completion_date:recent});
  const milestoneFields = ['riba1_end','riba2_end','riba3_end','riba4_end'];
  const milestoneProjects = await db.Project.count({status:{$ne:'inactive'},$or:milestoneFields.map(field => ({[field]:recent}))});
  const [announcements, recognition, calendar] = await Promise.all([
    db.AlliancePulseItem.filter({status:'published',group_id:{$in:['',null]},type:'Company Update',lookout_issue_id:{$exists:false},created_date:recent},{sort:'-created_date',limit:1,fields:['title','summary']}),
    db.AlliancePulseItem.filter({status:'published',group_id:{$in:['',null]},type:{$in:['Recognition','Team recognition']},created_date:recent},{sort:'-created_date',limit:6,fields:['summary']}),
    db.Project.filter({status:{$ne:'inactive'},$or:[...milestoneFields,'practical_completion_date'].map(field => ({[field]:{$gte:publicationDate+'T00:00:00', $lt:new Date(new Date(publicationDate+'T00:00:00Z').getTime()+14*86400000).toISOString()}}))},{sort:'name',limit:50,fields:['name',...milestoneFields,'practical_completion_date']})
  ]);
  const upper = new Date(new Date(publicationDate+'T00:00:00Z').getTime()+14*86400000).toISOString().slice(0,10);
  const events = calendar.items.flatMap(project => [...milestoneFields,'practical_completion_date'].flatMap(field => {
    const date = String(project[field] || '').slice(0,10);
    return date >= publicationDate && date < upper ? [{date,type:'Milestone',title:`${project.name} · ${field==='practical_completion_date' ? 'Practical completion' : 'RIBA '+field[4]+' completion'} (recorded programme date)`}] : [];
  })).sort((a,b) => a.date.localeCompare(b.date)).slice(0,28);
  return {won,started,completed,milestoneProjects,announcement:announcements.items[0]?.summary || '',recognition:recognition.items.map(p => p.summary),events,window_start:start,window_end:end,calendar_limited:calendar.has_more || events.length===28};
}