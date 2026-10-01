import { base44 } from '@/api/base44Client';
import { filterAll } from '@/components/data/loadAll';

// Display-only exclusion: authentication and stored relationships stay intact.
export const HIDDEN_PORTAL_USER_ID = '6ab62433a194f918c54c824a';
export default function listVisiblePortalUsers() {
  return filterAll(base44.entities.User, { id: { $ne: HIDDEN_PORTAL_USER_ID } });
}