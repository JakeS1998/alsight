import {ieError} from './ieAccess.ts';
import {ieProjectReferences,ieReferenceYear} from './ieProjectReferences.ts';
export async function ieRenumberProjectReferences(base44,user){
 if(user.role!=='admin')ieError('Administrator access required.',403);
 const db=base44.asServiceRole.entities,query={reference:{$regex:'^IE-PROJECT-[a-f0-9]{24}$'}};
 const page=await db.IEEngagement.filter(query,{sort:'created_date',limit:30,fields:['reference','created_date']});
 const groups=new Map();
 for(const item of page.items){const year=ieReferenceYear(item.created_date);if(!groups.has(year))groups.set(year,[]);groups.get(year).push(item);}
 let updated=0;
 for(const items of groups.values()){
  const references=await ieProjectReferences(db,items.length,items[0].created_date);
  for(let offset=0;offset<items.length;offset+=6){
   const results=await Promise.all(items.slice(offset,offset+6).map((item,index)=>db.IEEngagement.updateMany({id:item.id,reference:item.reference},{$set:{reference:references[offset+index]},$inc:{revision:1}})));
   updated+=results.reduce((sum,result)=>sum+(result.updated||0),0);
  }
 }
 return {updated,has_more:await db.IEEngagement.count(query)>0};
}