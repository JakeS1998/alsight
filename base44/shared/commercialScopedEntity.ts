function constrainedQuery(query={},rule){
 const {id,...rest}=query,{id:allowed,...constraint}=rule;
 let selected=id;
 if(allowed){const ids=allowed.$in;selected={$in:ids.filter(value=>id===undefined||typeof id==='string'&&value===id||id?.$in?.includes(value))};}
 return {...(selected!==undefined?{id:selected}:{}),$and:[rest,constraint]};
}
export function commercialScopedEntity(entity,rule){
 return {
  filter:(query={},options)=>entity.filter(constrainedQuery(query,rule),options),
  count:(query={})=>entity.count(constrainedQuery(query,rule)),
  aggregate:options=>entity.aggregate({...options,query:constrainedQuery(options.query,rule)}),
  async get(id){const page=await entity.filter(constrainedQuery({id},rule),{limit:1});if(!page.items[0])throw new Error('This record is outside your permitted projects.');return page.items[0];}
 };
}
export async function commercialDistinct(entity,query,field){
 const values=[];let cursor;
 do{const page=await entity.filter(query,{distinct:field,limit:500,...(cursor?{cursor}:{})});values.push(...page.items);if(values.length>5000)throw new Error('Commercial access scope exceeds the reporting limit.');if(!page.has_more)return values.filter(value=>value!==null&&value!=='');if(!page.next_cursor)throw new Error('Commercial scope pagination could not continue.');cursor=page.next_cursor;}while(cursor);
 return values;
}