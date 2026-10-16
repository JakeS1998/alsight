export const localDay=(value=Date.now())=>{const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const localTime=value=>new Date(value).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
export const deadlineDay=value=>!value?'':value.length===10?value:localDay(value);
export function dayBounds(now=Date.now()) {
 const start=new Date(now);start.setHours(0,0,0,0);const tomorrow=new Date(start);tomorrow.setDate(tomorrow.getDate()+1);const end=new Date(tomorrow);end.setDate(end.getDate()+1);
 return {day:localDay(start),tomorrow:localDay(tomorrow),afterTomorrow:localDay(end),start:start.toISOString(),tomorrowStart:tomorrow.toISOString(),end:end.toISOString()};
}
export function timeState(now,calendar,workday={}) {
 const date=new Date(now),minute=date.getHours()*60+date.getMinutes(),bounds=dayBounds(now);
 const parse=value=>{const [h,m]=value.split(':').map(Number);return h*60+m;};
 const start=parse(workday.start||'09:00'),end=parse(workday.end||'17:00');
 const phase=minute>=Math.min(990,end-30)?'wrap':minute>=840?'afternoon':minute>=720?'midday':minute>=600?'focus':'morning';
 const headings={morning:'Your morning briefing',focus:'What needs your attention?',midday:'Your day so far',afternoon:'Make the most of your afternoon',wrap:'Prepare for tomorrow'};
 const events=calendar.rows||[],timed=events.filter(e=>!e.allDay&&Number.isFinite(e.startsAt)&&Number.isFinite(e.endsAt));
 const current=timed.find(e=>e.startsAt<=now&&e.endsAt>now),next=timed.find(e=>e.startsAt>now),finished=[...timed].reverse().find(e=>e.endsAt<=now&&now-e.endsAt<30*60000);
 const minutesToNext=next?Math.max(0,Math.ceil((next.startsAt-now)/60000)):null;
 const workEnd=new Date(now);workEnd.setHours(Math.floor(end/60),end%60,0,0);
 const remaining=Math.max(0,Math.floor((workEnd-now)/60000)),allDay=events.some(e=>e.allDay&&!e.ended);
 const available=!calendar.loading&&!calendar.error&&!calendar.more&&!current&&!allDay&&minute>=start&&remaining>0?Math.min(remaining,minutesToNext??remaining):null;
 const meeting=current||((minutesToNext!==null&&minutesToNext<=60)?next:null)||finished;
 const tomorrowFirst=(calendar.tomorrowRows||[]).find(e=>!e.allDay);
 return {...bounds,now,phase,heading:headings[phase],timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',date:date.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}),greeting:phase==='wrap'?'Wrapping up':date.getHours()<12?'Good morning':date.getHours()<18?'Good afternoon':'Good evening',current,next,meeting,minutesToNext,meetingState:current?'underway':meeting===next?'upcoming':'finished',prominent:!!current||(minutesToNext!==null&&minutesToNext<=30),available,remaining,allDay,tomorrowFirst,workdayStart:workday.start||'09:00',workdayEnd:workday.end||'17:00'};
}
export function timeRank(items,time) {
 return items.map(item=>{const date=deadlineDay(item.due),boost=(time.phase==='afternoon'&&item.taskEntity?8:0)+(time.phase==='wrap'&&date===time.tomorrow?18:0);return {...item,score:item.score+boost,timeReason:date===time.day?'Due today.':time.phase==='wrap'&&date===time.tomorrow?'Due tomorrow: prepare before the next day.':time.phase==='afternoon'&&item.taskEntity?'Assigned work is emphasised during the afternoon.':''};}).sort((a,b)=>({Urgent:3,Important:2,Upcoming:1}[b.level]-{Urgent:3,Important:2,Upcoming:1}[a.level])||b.score-a.score||String(a.due||'9999').localeCompare(String(b.due||'9999')));
}
export function timeSuggestions(actions,time) {
 const limit=time.available!==null&&time.available<15?1:time.available!==null&&time.available<45?2:3;
 return actions.slice(0,limit).map(a=>({title:time.phase==='wrap'?'Review what carries forward':a.title,reason:[a.timeReason||a.detail||a.source,time.available!==null?`${time.available}-minute calendar gap within your planning hours. Effort is not recorded; confirm what fits.`:'Calendar availability is unconfirmed. No task duration has been assumed.'].filter(Boolean).join(' '),to:a.to,source:a.title,key:a.key}));
}