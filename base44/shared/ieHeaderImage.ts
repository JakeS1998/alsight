import {ieError} from './ieAccess.ts';
import {searchHeaderPhoto} from './searchHeaderPhoto.ts';
import {cachedHeaderPhoto} from './cachedHeaderPhoto.ts';
export async function ieHeaderImage(base44,item,input){
 if(input.retrySearch!==undefined&&typeof input.retrySearch!=='boolean')ieError('Invalid image retry request.');
 const clean=value=>String(value||'').replace(/["\r\n]/g,' ').trim().slice(0,160);
 const site=clean(item.sites?.[0]||item.project_name);
 if(!site)return {body:{url:null},status:200};
 return cachedHeaderPhoto(base44,'ie-engagement',`${item.id}:${site}:${clean(item.client_name)}`.slice(0,400),()=>searchHeaderPhoto(`"${site}" ${clean(item.client_name)} leisure centre UK`,`${site} engagement location photograph`),{refresh:input.retrySearch===true});
}