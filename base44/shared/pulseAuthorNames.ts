import {withPortalUserNames} from './portalUserNames.ts';

export async function withPulseAuthorNames(base44,items) {
  const ids=[...new Set(items.map(item=>item.author_id).filter(Boolean))];
  if(!ids.length) return items;
  const users=await base44.asServiceRole.entities.User.filter({id:{$in:ids}});
  const resolved=await withPortalUserNames(base44.asServiceRole.entities,users);
  const names=new Map(resolved.map(user=>[user.id,user.full_name]));
  return items.map(item=>({...item,author_name:names.get(item.author_id) || item.author_name}));
}