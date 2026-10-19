import {localDay} from '@/components/adaptive/adaptiveTime';
const key=userId=>`alsight-wellbeing-session:${userId}`;
export function createReminderSession(userId) {
 const now=Date.now(),day=localDay(now);
 const session={active:0,last:{},interaction:now,quiet:now,tick:now,shownAt:0,blockedUntil:0,day,postponed:null,dirtyForm:null,editingAt:0};
 try {
  const saved=JSON.parse(sessionStorage.getItem(key(userId))||'null');
  if(saved?.day===day) {
   session.active=Math.max(0,Number(saved.active)||0);
   session.last=saved.last && typeof saved.last==='object'?saved.last:{};
   session.shownAt=Number(saved.shownAt)||0;
   session.postponed=saved.postponed||null;
   session.wrapDay=saved.wrapDay;
  }
 }catch{/* Keep reminders working when browser storage is unavailable. */}
 return session;
}
export function saveReminderSession(userId,session) {
 const {day,active,last,shownAt,postponed,wrapDay}=session;
 try{sessionStorage.setItem(key(userId),JSON.stringify({day,active,last,shownAt,postponed,wrapDay}));}catch{/* The live timer remains available. */}
}