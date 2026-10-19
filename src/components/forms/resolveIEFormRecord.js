import {ieCall} from '@/components/ie/ieClient';
export default async function resolveIEFormRecord({kind,name,clientId}){
 const result=await ieCall('lookup',{kind,client_id:clientId,search:String(name).slice(0,160)});
 const normal=value=>String(value||'').trim().toLocaleLowerCase();
 const matches=(result.items||[]).filter(item=>normal(item.name)===normal(name)||normal(item.project_number)===normal(name));
 return matches.length===1?matches[0]:null;
}