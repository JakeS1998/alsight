export function workflowBusy(pathname,mutating) {
 if(mutating||/\/(?:approvals|risk-approvals|pq-approvals|documents|warranties)(?:\/|$)/.test(pathname))return true;
 if(document.activeElement?.closest('input,textarea,select,[contenteditable="true"],form'))return true;
 return [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],[aria-modal="true"],[aria-busy="true"],form [type="submit"]:disabled,iframe,[data-wellbeing-suppress]')].some(el=>el.getClientRects().length>0);
}
export function meetingBusy(calendar,now) {
 if(calendar.loading||calendar.more)return true;
 return calendar.rows.some(event=>event.endsAt>now&&(event.allDay||event.startsAt<=now+10*60000));
}
export function claimReminder(userId,now,spacing) {
 try{const key=`alsight-wellbeing-cooldown:${userId}`,last=Number(localStorage.getItem(key)||0);if(now-last<spacing)return false;localStorage.setItem(key,String(now));return true;}catch{return true;}
}