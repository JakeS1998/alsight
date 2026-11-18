import { availableBriefingSections, selectedBriefingSections } from './personalBriefingSections.ts';
import { personalBriefingPriorities, escapeBriefingText } from './personalBriefingPriorities.ts';
import { liveProjectSummary } from './liveProjectSummary.ts';

const money = new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0});
const sources = [['LegalDocument','Legal document'],['DMA','DMA'],['JCT','JCT']];

async function outstandingDocuments(db,user) {
  // Match the BSM's own trusted assignment identifiers, never another portfolio or empty identities.
  const identity = [...new Set([user.id,user.staff_aad_id ?? user.data?.staff_aad_id].filter(Boolean))];
  const projects = await db.Project.filter({live_project:true,status:{$ne:'inactive'},bsm_aad_id:{$in:identity}}, {limit:200,sort:'name',fields:['name','dataverse_id']});
  const byId = new Map();
  for (const project of projects.items) {
    byId.set(project.id,project);
    if (project.dataverse_id) byId.set(project.dataverse_id,project);
  }
  if (!byId.size) return 'No live projects are assigned to you.';
  const pages = await Promise.all(sources.map(([entity]) => db[entity].filter({project_id:{$in:[...byId.keys()]},status:'active',executed:{$regex:'^no$',$options:'i'},date_of_execution:{$in:[null,'']}}, {limit:12,sort:'document_id',fields:['document_id','project_id',...(entity==='LegalDocument'?['document_type']:[])]})));
  const rows = pages.flatMap((page,index) => page.items.map(doc => ({doc,project:byId.get(doc.project_id),type:doc.document_type?.replaceAll('_',' ') || sources[index][1]}))).filter(row => row.project);
  const note = projects.has_more || pages.some(page => page.has_more) || rows.length > 12 ? '<p>This is a partial list. Open Projects to review the full register.</p>' : '';
  if (!rows.length) return `No recorded outstanding documents on the assigned live projects checked.${note}`;
  rows.sort((a,b) => String(a.project.name).localeCompare(String(b.project.name)) || String(a.doc.document_id).localeCompare(String(b.doc.document_id)));
  return `<ul style="padding-left:18px;margin:0;">${rows.slice(0,12).map(({doc,project,type}) => `<li style="padding-bottom:8px;"><a href="https://als-hub.base44.app/projects/${encodeURIComponent(project.id)}">${escapeBriefingText(project.name || 'Open project')}</a><br/>${escapeBriefingText(type)}${doc.document_id ? ` · ${escapeBriefingText(doc.document_id)}` : ''}</li>`).join('')}</ul>${note}`;
}

export async function personalBriefingContent(db,user,schedule,day) {
  const readers = {
    tasks: () => personalBriefingPriorities(db,user.id,day,schedule.timezone),
    commercial: async () => {
      const summary = await liveProjectSummary(db);
      return `Live projects: <strong>${summary.projects}</strong> · ${money.format(summary.value)}<br/>On-hold projects: <strong>${summary.onHoldProjects}</strong> · ${money.format(summary.onHoldValue)}<br/>Reporting values exclude VAT and are not cash balances. <a href="https://als-hub.base44.app/commercial">Open Commercial</a>`;
    },
    documents: () => outstandingDocuments(db,user),
  };
  const labels = new Map(availableBriefingSections(user).map(section => [section.id,section.label]));
  const ids = selectedBriefingSections(schedule,user);
  const results = await Promise.allSettled(ids.map(id => readers[id]()));
  return results.map((result,index) => `<h2 style="font-size:18px;margin:12px 0 6px;">${labels.get(ids[index])}</h2>${result.status === 'fulfilled' ? result.value : 'This section is temporarily unavailable.'}`).join('');
}