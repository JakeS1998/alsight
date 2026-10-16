export const STANDARD_HOURS={start:'09:00',end:'17:00'};
export const FLEXIBLE_HOURS={start:'07:30',end:'18:30'};
export const toMinutes=value=>{const [h,m]=value.split(':').map(Number);return h*60+m;};
export const validHours=hours=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hours?.start||'')&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hours?.end||'')&&toMinutes(hours.start)>=0&&toMinutes(hours.end)<1440&&toMinutes(hours.start)<toMinutes(hours.end);
export function workingContext(now=Date.now(),hours=STANDARD_HOURS) {
 const date=new Date(now),minute=date.getHours()*60+date.getMinutes(),workingDay=date.getDay()>0&&date.getDay()<6;
 const personal=validHours(hours)?hours:STANDARD_HOURS,outsideFlexible=minute<450||minute>=1110;
 return {workingDay,minute,early:minute<450,late:minute>=1110,outsideFlexible,resting:!workingDay||outsideFlexible,checklistAvailable:workingDay&&minute>=990,withinPersonal:minute>=toMinutes(personal.start)&&minute<toMinutes(personal.end),nudgeHours:workingDay&&!outsideFlexible&&minute>=toMinutes(personal.start)&&minute<toMinutes(personal.end),hours:personal};
}
export function nextWorkingDate(now=Date.now()) {
 const date=new Date(now);date.setHours(0,0,0,0);do{date.setDate(date.getDate()+1);}while(date.getDay()===0||date.getDay()===6);return date;
}