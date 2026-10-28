import { flowRequest } from './dataverseFlowApi.ts';
import { isGuid } from './dataverseFlowFields.ts';
const address = value=>typeof value==='string' && value.length<=320 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
const choice = (row,entity)=>({id:entity==='account' ? row.accountid : row.contactid,entity,name:row.name || row.fullname || row.emailaddress1,address:row.emailaddress1});
export async function networxRecipients(context, search = '') {
  const {environment,token,sourceId,entity} = context;
  const source = await flowRequest(environment,token,entity==='account' ? `accounts(${sourceId})?$select=accountid,name,emailaddress1,_primarycontactid_value,statecode` : `contacts(${sourceId})?$select=contactid,fullname,emailaddress1,_parentcustomerid_value,statecode`);
  if (source.statecode!==0) return [];
  const accountId=entity==='account' ? sourceId : source._parentcustomerid_value;
  const primary=entity==='account' ? source._primarycontactid_value : sourceId;
  const linked=[...(isGuid(accountId) ? [`_parentcustomerid_value eq ${accountId}`] : []),...(isGuid(primary) ? [`contactid eq ${primary}`] : [])].join(' or ') || `contactid eq ${sourceId}`;
  const term=search.trim(), escaped=term.replace(/'/g,"''");
  const matching=`statecode eq 0 and emailaddress1 ne null and emailaddress1 ne ''${term ? ` and (contains(fullname,'${escaped}') or contains(emailaddress1,'${escaped}'))` : ''}`;
  const load=async(priority)=>{
    const query=new URLSearchParams({'$select':'contactid,fullname,emailaddress1','$filter':`${matching} and ${priority ? `(${linked})` : `not (${linked})`}`,'$orderby':'fullname asc','$top':'20'});
    return (await flowRequest(environment,token,`contacts?${query}`)).value || [];
  };
  const [preferred,others]=await Promise.all([load(true),term ? load(false) : Promise.resolve([])]);
  const contacts=[...preferred.map(row=>({...choice(row,'contact'),linked:true})),...others.map(row=>({...choice(row,'contact'),linked:false}))].filter(row=>address(row.address)).slice(0,20);
  const own=entity==='account' && address(source.emailaddress1) && (!term || `${source.name} ${source.emailaddress1}`.toLowerCase().includes(term.toLowerCase())) ? [{...choice(source,'account'),linked:true}] : [];
  return [...own,...contacts];
}
export async function resolveNetworxRecipient(context, recipient) {
  const {environment,token,sourceId,entity} = context;
  if (recipient.entity==='account' && (entity!=='account' || recipient.id.toLowerCase()!==sourceId)) throw Object.assign(new Error('Choose this organisation or an accessible Dataverse contact.'),{status:400});
  const row = await flowRequest(environment,token,`${recipient.entity==='account' ? 'accounts' : 'contacts'}(${recipient.id})?$select=${recipient.entity==='account' ? 'accountid,name' : 'contactid,fullname,_parentcustomerid_value'},emailaddress1,statecode`);
  // This delegated read enforces the sender's Dataverse contact access. The Regarding record stays unchanged.
  if (row.statecode!==0 || !address(row.emailaddress1)) throw Object.assign(new Error('Add an active email address to this recipient in Dataverse first.'),{status:400});
  return choice(row,recipient.entity);
}