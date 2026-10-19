export function workflowBusy(pathname,mutating,recentInteraction=true) {
 if(mutating||/\/(?:approvals|risk-approvals|pq-approvals|documents|warranties)(?:\/|$)/.test(pathname))return true;
 if(document.activeElement?.matches('iframe'))return true;
 if(recentInteraction&&document.activeElement?.closest('input,textarea,select,[contenteditable="true"]'))return true;
 return [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],[aria-modal="true"],form[aria-busy="true"],form [aria-busy="true"],[data-wellbeing-suppress="true"]')].some(el=>el.getClientRects().length>0);
}
export function meetingBusy(calendar,now) {
 if(!calendar.error&&(calendar.loading||calendar.more))return true;
 return calendar.rows.some(event=>!event.allDay&&event.endsAt>now&&event.startsAt<=now+10*60000);
}
export function claimReminder(userId,now,spacing) {
 try{const key=`alsight-wellbeing-cooldown:${userId}`,last=Number(localStorage.getItem(key)||0);if(now-last<spacing)return false;localStorage.setItem(key,String(now));return true;}catch{return true;}
}