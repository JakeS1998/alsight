import { STANDARD_HOURS, validHours } from '@/components/wellbeing/workingHours';
export const wellbeingDefaults={enabled:true,frequency:'gentle',categories:{hydration:true,eyes:true,movement:true,break:true,wrap:true},hours:STANDARD_HOURS,snoozeUntil:0};
export function loadWellbeing(userId) {
 try {
  const saved=JSON.parse(localStorage.getItem(`alsight-wellbeing-v1:${userId}`)||'null'),legacy=JSON.parse(localStorage.getItem(`alsight-adaptive-v1:${userId}`)||'null');
  const hours=saved?.hours||legacy?.workday;
  return {...wellbeingDefaults,...saved,categories:{...wellbeingDefaults.categories,...saved?.categories},frequency:['minimal','gentle','standard'].includes(saved?.frequency)?saved.frequency:'gentle',hours:validHours(hours)?hours:STANDARD_HOURS};
 }catch{return wellbeingDefaults;}
}
export const reminderCategories=[['hydration','Hydration'],['eyes','Eye rest'],['movement','Movement'],['break','General breaks'],['wrap','End-of-day preparation']];
export const reminderIntervals={standard:{eyes:20,movement:60,hydration:90,break:105},gentle:{eyes:30,movement:75,hydration:105,break:120},minimal:{eyes:45,movement:90,hydration:120,break:150}};
export const minimumSpacing={standard:15,gentle:20,minimal:30};