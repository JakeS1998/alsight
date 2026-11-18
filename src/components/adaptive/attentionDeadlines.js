export const deadlineFilters = [ ['all','All'], ['overdue','Overdue'], ['soon','Coming up'], ['later','Plenty of time'] ];
export const attentionDeadline = row => String(row.attentionDue || row.due || '').match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '';
export function attentionWindow(now = new Date()) {
 const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const cutoff = new Date(Date.parse(`${today}T00:00:00Z`) + 8*86400000).toISOString().slice(0,10);
 return {today,cutoff};
}
export function attentionRows(rows,filter,{today,cutoff}) {
 return rows.map(row=>{
  const date=attentionDeadline(row);
  return {...row,deadlineStatus:!date?'undated':date<today?'overdue':date<cutoff?'soon':'later'};
 }).filter(row=>filter==='all'||row.deadlineStatus===filter).sort((a,b)=>(attentionDeadline(a)||'9999').localeCompare(attentionDeadline(b)||'9999')||a.title?.localeCompare(b.title,'en-GB'));
}
export const deadlineStyles = {
 overdue:'border-l-4 border-l-risk-critical bg-[hsl(var(--risk-critical)/0.10)]',
 soon:'border-l-4 border-l-risk-moderate bg-[hsl(var(--risk-moderate)/0.15)]',
 later:'border-l-4 border-l-risk-low bg-[hsl(var(--risk-low)/0.10)]',
 undated:'border-l-4 border-l-border',
};
export function deadlineQuery(filter,{today,cutoff}) {
 if(filter==='overdue')return {$lt:today,$nin:['',null],$exists:true};
 if(filter==='soon')return {$gte:today,$lt:cutoff};
 if(filter==='later')return {$gte:cutoff};
 return null;
}