export const escapeSearchPattern=value=>String(value || '').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export const orderedSearchPattern=value=>Array.from(String(value || '').trim().slice(0,80)).filter(c=>! /\s/.test(c)).map(escapeSearchPattern).join('.*?');
export async function resolveSearchQuery(entity,term,makeQuery) {
 const text=String(term || '').trim().slice(0,80);
 let query=await makeQuery(escapeSearchPattern(text)),total=await entity.count(query),suggested=false;
 if(!total && text.length>=2){query=await makeQuery(orderedSearchPattern(text));total=await entity.count(query);suggested=total>0;}
 return {query,total,suggested};
}
export async function searchRecordPage(entity,baseQuery,fields,term,options={}) {
 const text=String(term || '').trim().slice(0,80),makeQuery=pattern=>pattern ? {$and:[baseQuery,{$or:fields.map(field=>({[field]:{$regex:pattern,$options:'i'}}))}]} : baseQuery;
 const normal=makeQuery(escapeSearchPattern(text));
 if(options.cursor && text.length>=2){const probe=await entity.filter(normal,{limit:1,fields:['id']});if(!probe.items.length)return {...await entity.filter(makeQuery(orderedSearchPattern(text)),options),suggested:true};}
 const page=await entity.filter(normal,options);
 if(page.items.length || page.has_more || options.cursor || text.length<2)return {...page,suggested:false};
 return {...await entity.filter(makeQuery(orderedSearchPattern(text)),options),suggested:true};
}