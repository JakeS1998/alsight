import { flowRequest } from './dataverseFlowApi.ts';
import { isGuid } from './dataverseFlowFields.ts';
const address = value=>typeof value==='string' && value.length<=320 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
const choice = (row,entity)=>({id:entity==='account' ? row.accountid : row.contactid,entity,name:row.name || row.fullname || row.emailaddress1,address:row.emailaddress1});
export async function networxRecipients(context, search = '') {
  const {environment,token,sourceId,entity} = context;
  if (entity==='contact') {
    const row = await flowRequest(environment,token,`contacts(${sourceId})?$select=contactid,fullname,emailaddress1,statecode`);
    return row.statecode===0 && address(row.emailaddress1) ? [choice(row,'contact')] : [];
  }
  const account = await flowRequest(environment,token,`accounts(${sourceId})?$select=accountid,name,emailaddress1,_primarycontactid_value,statecode`);
  if (account.statecode!==0) return [];
  const primary = isGuid(account._primarycontactid_value) ? ` or contactid eq ${account._primarycontactid_value}` : '';
  const term = search.trim().replace(/'/g,"''");
  const filter = `(_parentcustomerid_value eq ${sourceId}${primary}) and statecode eq 0 and emailaddress1 ne null${term ? ` and (contains(fullname,'${term}') or contains(emailaddress1,'${term}'))` : ''}`;
  const query = new URLSearchParams({'$select':'contactid,fullname,emailaddress1','$filter':filter,'$orderby':'fullname asc','$top':'20'});
  const contacts = await flowRequest(environment,token,`contacts?${query}`);
  const own = address(account.emailaddress1) && (!term || `${account.name} ${account.emailaddress1}`.toLowerCase().includes(search.trim().toLowerCase())) ? [choice(account,'account')] : [];
  return [...own,...(contacts.value || []).filter(row=>address(row.emailaddress1)).map(row=>choice(row,'contact'))];
}
export async function resolveNetworxRecipient(context, recipient) {
  const {environment,token,sourceId,entity} = context;
  if (entity==='contact' && (recipient.entity!=='contact' || recipient.id.toLowerCase()!==sourceId)) throw Object.assign(new Error('Choose this person as the recipient.'),{status:400});
  const row = await flowRequest(environment,token,`${recipient.entity==='account' ? 'accounts' : 'contacts'}(${recipient.id})?$select=${recipient.entity==='account' ? 'accountid,name' : 'contactid,fullname,_parentcustomerid_value'},emailaddress1,statecode`);
  if (entity==='account') {
    const account = await flowRequest(environment,token,`accounts(${sourceId})?$select=_primarycontactid_value,statecode`);
    const linked = recipient.entity==='account' ? recipient.id.toLowerCase()===sourceId : row._parentcustomerid_value?.toLowerCase()===sourceId || account._primarycontactid_value?.toLowerCase()===recipient.id.toLowerCase();
    if (!linked || account.statecode!==0) throw Object.assign(new Error('Choose this organisation or one of its linked contacts.'),{status:400});
  }
  if (row.statecode!==0 || !address(row.emailaddress1)) throw Object.assign(new Error('Add an active email address to this recipient in Dataverse first.'),{status:400});
  return choice(row,recipient.entity);
}