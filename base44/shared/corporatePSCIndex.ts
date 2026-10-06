import {corporatePSC,pscReference} from './aseCorporatePSCSource.ts';
import {normaliseCompanyNumber} from './companiesHouseData.ts';
const normalise=value=>String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^(mr|mrs|ms|miss|dr|sir)\.?\s+/,'').replace(/[^a-z0-9]/g,'');
export async function indexCorporatePSCs(base44,account,register,structure) {
  const number=normaliseCompanyNumber(account.company_number),checked=new Date().toISOString(),controllers=[];
  for(const row of register.items.filter(row=>!row.ceased_on)) {
    const corporate=corporatePSC(row);let identity,kind;
    if(corporate) {identity='corporate:'+corporate.number;kind='corporate';}
    else if(row.kind==='individual-person-with-significant-control' && row.name && row.date_of_birth?.month && row.date_of_birth?.year) {identity=`individual:${normalise(row.name)}:${row.date_of_birth.year}:${row.date_of_birth.month}`;kind='individual';}
    if(!identity) continue;
    const key=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
    controllers.push({key,name:row.name,kind,majority:corporate?.majority || false,source_reference:pscReference(number)});
  }
  await base44.entities.CorporatePSCSnapshot.upsert([{account_id:account.id,company_number:number,checked_at:checked,register_complete:register.complete,controllers,...(structure ? {structure} : {structure:null})}],{key:'account_id'});
  await base44.entities.CorporatePSCIndex.updateMany({account_id:account.id,active:true},{$set:{active:false}});
  if(controllers.length) await base44.entities.CorporatePSCIndex.upsert(controllers.map(row=>({index_key:`${account.id}:${row.key}`,account_id:account.id,account_name:account.name,company_number:number,controller_key:row.key,controller_name:row.name,controller_kind:row.kind,checked_at:checked,active:register.complete})),{key:'index_key'});
  return {controllers,checked_at:checked,register_complete:register.complete};
}
export async function sharedPSCCorporations(base44,account,snapshot,cursor) {
  const since=new Date(Date.now()-7*86400000).toISOString();
  if(!snapshot?.register_complete || snapshot.checked_at<since || snapshot.company_number!==normaliseCompanyNumber(account.company_number)) return {rows:[],truncated:false,available:false};
  const keys=snapshot.controllers.map(row=>row.key);
  if(!keys.length) return {rows:[],truncated:false,available:true};
  const result=await base44.entities.CorporatePSCIndex.aggregate({query:{controller_key:{$in:keys},active:true,checked_at:{$gte:since},account_id:{$ne:account.id},company_number:{$ne:snapshot.company_number}},groupBy:['account_id','account_name','company_number','controller_kind'],limit:100});
  return {...result,available:true,checked_at:snapshot.checked_at,individual_matching:'Name plus birth month/year only; identity review required. A shared individual PSC does not prove a corporate parent or PCG option.'};
}