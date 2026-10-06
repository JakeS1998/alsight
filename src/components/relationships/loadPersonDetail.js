import {base44} from '@/api/base44Client';
import contactAccountQuery, {resolveContactAccount} from '@/components/accounts/contactAccountQuery';
export default function loadPersonDetail(cache,{contactId,accountId,internal,user}) {
  return cache.fetchQuery({queryKey:['person-detail',user?.id,user?.role,contactId,accountId],staleTime:60000,retry:false,queryFn:async()=>{
    const contact=await base44.entities.Contact.get(contactId);
    if(!contact) return {contact:null};
    const [account,profiles,staff,opportunities]=await Promise.all([
      accountId ? base44.entities.Account.get(accountId) : base44.entities.Account.filter(contactAccountQuery(contact),{limit:50,fields:['name','company_name','company_number','primary_contact_id','website','email','account_type','dataverse_id']}).then(page=>page.has_more ? null : resolveContactAccount(page.items,contact)),
      internal ? base44.entities.ContactProfile.filter({contact_id:contactId},{limit:1}) : {items:[]},
      internal ? cache.fetchQuery({queryKey:['people-staff',user?.id,user?.role],staleTime:60000,retry:false,queryFn:()=>base44.entities.Contact.filter({portal_role:{$in:['admin','director','regional_director','bsm','finance','bdm']}},{sort:'full_name',limit:100,fields:['full_name','portal_role']})}) : {items:[]},
      internal ? base44.entities.Opportunity.filter({contact_id:contactId},{sort:'-created_date',limit:50,fields:['title','stage','status','account_id']}) : {items:[]}
    ]);
    const linkedAccount=account || (!accountId && opportunities.items[0]?.account_id ? await base44.entities.Account.get(opportunities.items[0].account_id) : null);
    return {contact,account:linkedAccount,profile:profiles.items[0] || null,staff:staff.items,opportunities:opportunities.items};
  }});
}