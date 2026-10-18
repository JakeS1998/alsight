export function widgetEvidence(rows,id) {
 return rows.slice(0,20).map(row=>({title:row.title,detail:[row.detail,row.why,row.source,id==='activity'?'Source-record update, not a history of your browsing.':'',row.project?.updated_date?`Project record updated ${row.project.updated_date}.`:''].filter(Boolean).join(' ').slice(0,350),due:row.due||'',level:row.intent||'Reference',to:row.to}));
}
export function homepageEvidence(actions,data,calendar) {
 return [...actions.slice(0,8).map(row=>({title:row.title,detail:`${row.source||'Source record'}: ${row.detail||''} ${row.why||''}`.slice(0,350),due:row.due||'',level:row.intent||row.level,to:row.to})),...(data?.projects||[]).slice(0,4).map(p=>({title:p.name,detail:`Active project${p.client_name?` for ${p.client_name}`:''}. Project record updated ${p.updated_date}.`,due:'',level:'Reference',to:`/projects/${p.id}`})),...(data?.nextWorkActions||[]).slice(0,3).map(row=>({title:row.title,detail:`${row.source}: assigned deadline next working day.`,due:row.due||'',level:'Priority',to:row.to})),...(!calendar.error&&!calendar.loading?[...calendar.rows.slice(0,2),...(calendar.nextWorkingRows||[]).slice(0,3)].map(row=>({title:row.title,detail:`Outlook calendar: ${row.day} ${row.detail}. Invitation context only, not confirmation of attendance.`,due:row.day,level:'Awareness',to:'/calendar'})):[])].slice(0,20);
}
export function askFromWorkspace(intelligence,question,records,label) {
 intelligence.request('ask',question,records,label);
 document.getElementById('adaptive-intelligence')?.scrollIntoView({behavior:'auto',block:'start'});
}