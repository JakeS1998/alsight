// Call only with engagement records already authorised by ieScope/ieRecord.
export async function ieProjectNumbers(db,items){
 const ids=[...new Set(items.map(item=>item.project_id).filter(Boolean))];
 if(!ids.length)return items;
 const page=await db.Project.filter({$or:[{id:{$in:ids}},{dataverse_id:{$in:ids}}]},{limit:ids.length,fields:['project_number','dataverse_id']});
 const numbers=new Map();
 for(const project of page.items){numbers.set(project.id,project.project_number||'');if(project.dataverse_id)numbers.set(project.dataverse_id,project.project_number||'');}
 return items.map(item=>({...item,project_number:numbers.get(item.project_id)||''}));
}