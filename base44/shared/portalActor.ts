import {withPortalUserNames} from './portalUserNames.ts';
export async function portalActor(base44) {
 const user=await base44.auth.me();
 if(!user)return null;
 const [named]=await withPortalUserNames(base44.asServiceRole.entities,[user]);
 return named;
}