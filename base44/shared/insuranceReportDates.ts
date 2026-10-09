const zone='Europe/London';
export function insuranceReportDay(value=new Date()) {
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 return ['year','month','day'].map(type=>parts.find(part=>part.type===type).value).join('-');
}
const midnight=day=>{
 const date=new Date(`${day}T00:00:00Z`),offset=new Intl.DateTimeFormat('en-GB',{timeZone:zone,timeZoneName:'shortOffset'}).formatToParts(date).find(part=>part.type==='timeZoneName').value;
 return new Date(date.getTime()-(offset==='GMT+1' ? 3600000 : 0)).toISOString();
};
export function insuranceReportWindow() {
 const today=insuranceReportDay(),utc=Date.parse(`${today}T00:00:00Z`),endDay=new Date(utc+29*86400000).toISOString().slice(0,10),lastDay=new Date(utc+28*86400000).toISOString().slice(0,10);
 return {today,start:midnight(today),end:midnight(endDay),lastDay};
}
export const insuranceReportDate=value=>new Intl.DateTimeFormat('en-GB',{timeZone:zone,day:'numeric',month:'short',year:'numeric'}).format(new Date(value));