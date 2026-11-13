export function nextLondonCutover(date=new Date()) {
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const value=type=>Number(parts.find(p=>p.type===type).value);
 function evening(extra){
  const utc=new Date(Date.UTC(value('year'),value('month')-1,value('day')+extra,21));
  const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',hourCycle:'h23'}).format(utc));
  return new Date(utc.getTime()-(hour-21)*3600000);
 }
 const today=evening(0);return (today>date?today:evening(1)).toISOString();
}
export function cutoverDue(i,date=new Date()) {return Boolean(i?.details?.cutover_at&&Date.parse(i.details.cutover_at)<=date.getTime());}
export function recoveryAuthorised(i) {return new Set((i?.details?.recovery_approvals||[]).map(a=>a.user_id).filter(Boolean)).size>=2;}