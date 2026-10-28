import { flowRequest } from './dataverseFlowApi.ts';
import { isGuid } from './dataverseFlowFields.ts';
import recipientTypes from './networxRecipientTypes.ts';
const address = value=>typeof value==='string' && value.length<=320 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
const choice = (row,entity)=>{const type=recipientTypes[entity];return {id:row[type.id],entity,name:row[type.name] || row[type.email],address:row[type.email]};};
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
    // Do not negate the linked-account predicate: OData null comparisons exclude unlinked contacts.
    const query=new URLSearchParams({'$select':'contactid,fullname,emailaddress1','$filter':`${matching}${priority ? ` and (${linked})` : ''}`,'$orderby':'fullname asc','$top':'20'});
    return (await flowRequest(environment,token,`contacts?${query}`)).value || [];
  };
  const userQuery=new URLSearchParams({'$select':'systemuserid,fullname,internalemailaddress','$filter':`isdisabled eq false and internalemailaddress ne null and internalemailaddress ne '' and (contains(fullname,'${escaped}') or contains(internalemailaddress,'${escaped}'))`,'$orderby':'fullname asc','$top':'20'});
  const [preferred,others,users]=await Promise.all([load(true),term ? load(false) : Promise.resolve([]),term ? flowRequest(environment,token,`systemusers?${userQuery}`) : Promise.resolve({value:[]})]);
  const choices=[...preferred.map(row=>({...choice(row,'contact'),linked:true})),...others.map(row=>({...choice(row,'contact'),linked:false})),...(users.value || []).map(row=>({...choice(row,'systemuser'),linked:false}))];
  const seen=new Set();
  const contacts=choices.filter(row=>{const key=`${row.entity}:${row.id}`;if(!address(row.address) || seen.has(key))return false;seen.add(key);return true;});
  const own=entity==='account' && address(source.emailaddress1) && (!term || `${source.name} ${source.emailaddress1}`.toLowerCase().includes(term.toLowerCase())) ? [{...choice(source,'account'),linked:true}] : [];
  return [...own,...contacts];
}
export async function resolveNetworxRecipient(context, recipient) {
  const {environment,token,sourceId,entity} = context;
  if (recipient.entity==='account' && (entity!=='account' || recipient.id.toLowerCase()!==sourceId)) throw Object.assign(new Error('Choose this organisation or an accessible Dataverse contact.'),{status:400});
  const type=recipientTypes[recipient.entity];
  if(!type)throw Object.assign(new Error('Choose a supported Dataverse recipient.'),{status:400});
  const row = await flowRequest(environment,token,`${type.set}(${recipient.id})?$select=${type.id},${type.name},${type.email},${type.status}`);
  // Both contacts and internal users are read using the sender's delegated Dataverse permissions.
  const active=recipient.entity==='systemuser' ? row.isdisabled===false : row.statecode===0;
  if (!active || !address(row[type.email])) throw Object.assign(new Error('Add an active email address to this recipient in Dataverse first.'),{status:400});
  return choice(row,recipient.entity);
}