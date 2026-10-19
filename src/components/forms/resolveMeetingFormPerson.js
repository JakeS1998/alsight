import {base44} from '@/api/base44Client';
export default async function resolveMeetingFormPerson(kind,name){
 const {data}=await base44.functions.invoke('manageMeetingPeople',{action:'search',kind,search:String(name).slice(0,100)});
 if(data.error)throw new Error(data.error);
 const normal=value=>String(value||'').trim().toLocaleLowerCase();
 const matches=(data.people||[]).filter(person=>normal(person.name)===normal(name));
 return matches.length===1?matches[0]:null;
}