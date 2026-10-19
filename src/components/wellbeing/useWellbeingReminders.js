import { useEffect, useRef, useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useWellbeing } from '@/components/wellbeing/WellbeingProvider';
import { workingContext } from '@/components/wellbeing/workingHours';
import { minimumSpacing, reminderIntervals } from '@/components/wellbeing/wellbeingPreferences';
import { claimReminder, meetingBusy, workflowBusy } from '@/components/wellbeing/reminderSafety';
import { localDay } from '@/components/adaptive/adaptiveTime';
import { createReminderSession, saveReminderSession } from '@/components/wellbeing/reminderSession';
export default function useWellbeingReminders(calendar,pathname) {
 const {settings,userId,save}=useWellbeing(),mutating=useIsMutating(),{toasts}=useToast(),[notification,setNotification]=useState(null);
 const latest=useRef({}),session=useRef(null);
 if(!session.current)session.current=createReminderSession(userId);
 latest.current={settings,calendar,pathname,mutating,otherToast:toasts.some(t=>t.open),notification};
 useEffect(()=>{session.current.blockedUntil=Date.now()+30000;session.current.dirtyForm=null;setNotification(null);},[pathname]);
 useEffect(()=>{
  const activity=e=>{if(e.isTrusted){session.current.interaction=Date.now();if(e.type!=='pointermove')session.current.quiet=Date.now();}},submission=()=>{session.current.blockedUntil=Date.now()+60000;session.current.dirtyForm=null;setNotification(null);},visibility=()=>{session.current.interaction=!document.hidden&&document.hasFocus()?Date.now():0;session.current.tick=Date.now();setNotification(null);};
  const editing=e=>{const form=e.target.closest('form');if(e.isTrusted&&e.target.type!=='search'&&form){session.current.dirtyForm=form;session.current.editingAt=Date.now();}},resetting=()=>{session.current.dirtyForm=null;};
  window.addEventListener('input',editing,true);window.addEventListener('reset',resetting,true);
  ['pointerdown','pointermove','keydown','scroll'].forEach(name=>window.addEventListener(name,activity,{passive:true}));window.addEventListener('submit',submission,true);document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',visibility);window.addEventListener('focus',visibility);
  const persist=()=>saveReminderSession(userId,session.current);
  window.addEventListener('pagehide',persist);
  const timer=setInterval(()=>{
   const now=Date.now(),s=session.current,v=latest.current,hours=workingContext(now,v.settings.hours),delta=Math.min(15000,Math.max(0,now-s.tick));s.tick=now;
   if(s.day!==localDay(now)){Object.assign(s,{day:localDay(now),active:0,last:{},postponed:null});}
   const awake=!document.hidden&&document.hasFocus()&&now-s.interaction<300000;
   if(awake&&hours.nudgeHours&&v.settings.enabled)s.active+=delta;
   persist();
   const blocked=!awake||!hours.nudgeHours||!v.settings.enabled||now<v.settings.snoozeUntil||now<s.blockedUntil||(s.dirtyForm?.isConnected&&now-s.editingAt<60000)||workflowBusy(v.pathname,v.mutating,now-s.quiet<60000)||meetingBusy(v.calendar,now)||v.otherToast;
   if(blocked){if(v.notification)setNotification(null);return;}
   if(v.notification||now-s.quiet<8000||now-s.shownAt<minimumSpacing[v.settings.frequency]*60000)return;
   const interval=reminderIntervals[v.settings.frequency],categories=v.settings.categories;
   const due=Object.keys(interval).filter(key=>categories[key]&&s.active-(s.last[key]||0)>=interval[key]*60000).sort((a,b)=>(s.active-(s.last[b]||0))/interval[b]-(s.active-(s.last[a]||0))/interval[a]);
   let wrapShown=s.wrapDay===s.day;try{wrapShown=wrapShown||localStorage.getItem(`alsight-wrap-nudge:${userId}`)===s.day;}catch{/* The in-memory flag remains available. */}
   const deferred=s.postponed&&now>=s.postponed.until&&categories[s.postponed.kind]?s.postponed.kind:null;
   const kind=deferred||(hours.checklistAvailable&&categories.wrap&&!wrapShown&&s.active>=60000?'wrap':due[0]);
   if(!kind)return;
   if(v.calendar.refreshing)return;
   if(!v.calendar.error&&now-v.calendar.updatedAt>300000){v.calendar.refresh();return;}
   if(!claimReminder(userId,now,minimumSpacing[v.settings.frequency]*60000))return;
   s.last[kind]=s.active;s.shownAt=now;s.postponed=null;
   if(kind==='wrap'){s.wrapDay=s.day;try{localStorage.setItem(`alsight-wrap-nudge:${userId}`,s.day);}catch{/* Session memory still avoids repeats. */}}
   persist();
   setNotification({kind,id:now});
  },15000);
  return()=>{clearInterval(timer);window.removeEventListener('input',editing,true);window.removeEventListener('reset',resetting,true);['pointerdown','pointermove','keydown','scroll'].forEach(name=>window.removeEventListener(name,activity));window.removeEventListener('submit',submission,true);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',visibility);window.removeEventListener('focus',visibility);window.removeEventListener('pagehide',persist);persist();};
 },[userId]);
 const dismiss=()=>setNotification(null);
 const snooze=()=>{session.current.postponed={kind:notification.kind,until:Date.now()+15*60000};saveReminderSession(userId,session.current);save({snoozeUntil:Date.now()+15*60000});setNotification(null);};
 return {notification,dismiss,snooze};
}