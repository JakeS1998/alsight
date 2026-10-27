import {commercialRoles} from './commercialAccessScope.ts';
// Company reporting is deliberately shared across Commercial roles. Never use this
// scope for the transaction browser, project directory, or project-specific tools.
export function commercialBusinessScope(base44,user){
 if(!commercialRoles.includes(user?.role)){const error=new Error('Commercial reporting access required.');error.status=403;throw error;}
 const scope={restricted:false,projectIds:null,codes:null,keys:null};
 const client={entities:base44.asServiceRole.entities,asServiceRole:base44.asServiceRole,auth:base44.auth,financeScope:scope};
 return {...scope,client};
}