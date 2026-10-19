import {ieError} from './ieAccess.ts';
export function ieReferenceYear(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'numeric'}).formatToParts(new Date(date));
 const year=Number(parts.find(part=>part.type==='year').value),month=Number(parts.find(part=>part.type==='month').value),start=year-(month<4?1:0);
 return `${String(start%100).padStart(2,'0')}${String((start+1)%100).padStart(2,'0')}`;
}
export async function ieProjectReferences(db,count=1,date=new Date()){
 if(!Number.isInteger(count)||count<1||count>30)ieError('Number up to 30 project engagements at a time.');
 const year=ieReferenceYear(date);
 for(let attempt=0;attempt<3;attempt++){
  const page=await db.IEProjectReferenceCounter.filter({key:'primary'},{limit:2});
  if(page.items.length!==1)ieError('The I&E project numbering counter needs administrator attention.',409);
  const counter=page.items[0],last=counter.sequences?.[year]||0;
  const reserved=await db.IEProjectReferenceCounter.updateMany({id:counter.id,revision:counter.revision},{$set:{sequences:{...counter.sequences,[year]:last+count}},$inc:{revision:1}});
  if(reserved.updated)return Array.from({length:count},(_,index)=>`IE-PROJECT-${year}-${String(last+index+1).padStart(4,'0')}`);
 }
 ieError('Another I&E reference is being allocated. Please retry shortly.',409);
}