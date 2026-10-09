import { base44 } from '@/api/base44Client';


// Display-only exclusion: authentication and stored relationships stay intact.
export const HIDDEN_PORTAL_USER_ID = '6ab62433a194f918c54c824a';
export default async function listVisiblePortalUsers() {
  const items=[];let offset=0,more;
  do {const {data}=await base44.functions.invoke('getPortalUserDirectory',{offset});if(data.error)throw new Error(data.error);items.push(...data.items);more=data.has_more;offset=data.next_offset;}while(more);
  return items;
}