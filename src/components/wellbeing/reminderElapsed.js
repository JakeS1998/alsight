import {FLEXIBLE_HOURS, toMinutes, workingContext} from '@/components/wellbeing/workingHours';
export default function reminderElapsed(from,now,hours) {
 const context=workingContext(now,hours);
 if(!context.workingDay)return 0;
 const start=new Date(now),end=new Date(now);
 const first=Math.max(toMinutes(context.hours.start),toMinutes(FLEXIBLE_HOURS.start));
 const last=Math.min(toMinutes(context.hours.end),toMinutes(FLEXIBLE_HOURS.end));
 start.setHours(Math.floor(first/60),first%60,0,0);
 end.setHours(Math.floor(last/60),last%60,0,0);
 return Math.max(0,Math.min(now,end.getTime())-Math.max(from,start.getTime()));
}