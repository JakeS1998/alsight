const zone='Europe/London',dayMs=86400000;
export function insuranceDay(value=new Date()) {
 if(value===null || value==='')return '';
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 return ['year','month','day'].map(type=>parts.find(part=>part.type===type).value).join('-');
}
const midnight=day=>{
 const date=new Date(`${day}T00:00:00Z`),offset=new Intl.DateTimeFormat('en-GB',{timeZone:zone,timeZoneName:'shortOffset'}).formatToParts(date).find(part=>part.type==='timeZoneName').value;
 return new Date(date.getTime()-(offset==='GMT+1' ? 3600000 : 0)).toISOString();
};
export function insuranceWindow() {
 const today=insuranceDay(),endDay=new Date(Date.parse(`${today}T00:00:00Z`)+29*dayMs).toISOString().slice(0,10);
 return {today,start:midnight(today),end:midnight(endDay)};
}
export const insuranceFilters=window=>({all:{},expired:{expiry_date:{$exists:true,$nin:[null,''],$lt:window.start}},expiring:{expiry_date:{$gte:window.start,$lt:window.end}},current:{expiry_date:{$gte:window.end}},missing:{$or:[{expiry_date:{$exists:false}},{expiry_date:null},{expiry_date:''}]}});
export function insuranceTiming(policy,today=insuranceDay()) {
 const day=insuranceDay(policy.expiry_date);if(!day)return {key:'missing',label:'Expiry not recorded',tone:'bg-muted text-muted-foreground'};
 const days=Math.round((Date.parse(`${day}T00:00:00Z`)-Date.parse(`${today}T00:00:00Z`))/dayMs);
 return days<0 ? {key:'expired',label:`Expired ${-days} day${days===-1 ? '' : 's'} ago`,tone:'bg-destructive/10 text-destructive'} : days<=28 ? {key:'expiring',label:days===0 ? 'Expires today' : `Expires in ${days} day${days===1 ? '' : 's'}`,tone:'bg-primary/15 text-foreground'} : {key:'current',label:'Current',tone:'bg-success/10 text-success'};
}
export const insuranceDate=value=>value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-GB',{timeZone:zone,day:'numeric',month:'short',year:'numeric'}).format(new Date(value)) : 'Not recorded';