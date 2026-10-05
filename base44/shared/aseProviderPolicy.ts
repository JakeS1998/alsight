export const blackflagBlock='Blackflag automation requires its published authenticated API and permitted usage quota. Public-page systematic extraction is prohibited by provider terms: https://blackflagalert.com/terms. Existing R-Scores remain context only.';
const londonHour=date=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',hourCycle:'h23'}).format(date));
export function gazetteWaitSeconds(now=new Date()) {
  const hour=londonHour(now);if(hour>=21 || hour<7) return 0;
  for(let minutes=1;minutes<=1440;minutes++) if(londonHour(new Date(now.getTime()+minutes*60000))>=21) return minutes*60;
  return 86400;
}
export const sourcePause=()=>new Promise(resolve=>setTimeout(resolve,2500));