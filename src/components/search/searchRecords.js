import {escapePattern,orderedPattern} from '@/components/search/orderedSearch';
export default async function searchRecords(entity,baseQuery,fields,term,options={}) {
 const text=String(term || '').trim().slice(0,80);
 const queryFor=pattern=>pattern ? {$and:[baseQuery,{$or:fields.map(field=>({[field]:{$regex:pattern,$options:'i'}}))}]} : baseQuery;
 const normal=queryFor(escapePattern(text));
 if(options.cursor && text.length>=2) {
  const probe=await entity.filter(normal,{limit:1,fields:['id']});
  if(!probe.items.length)return {...await entity.filter(queryFor(orderedPattern(text)),options),suggested:true};
 }
 const page=await entity.filter(normal,options);
 if(page.items.length || page.has_more || options.cursor || text.length<2)return {...page,suggested:false};
 return {...await entity.filter(queryFor(orderedPattern(text)),options),suggested:true};
}