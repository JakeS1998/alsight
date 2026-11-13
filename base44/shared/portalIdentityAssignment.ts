const roles=['admin','director','regional_director','bsm','finance','bdm','sam','sam_director','client','supplier','project_manager','framework_stakeholder'];
function invalid(message,status=400){const e=new Error(message);e.status=status;throw e;}
export async function assignPortalIdentity(b,administrator,contact,input){
 if(administrator.role!=='admin')invalid('Only administrators can assign portal access.',403);
 if(typeof input.userId!=='string'||!input.userId||input.userId.length>100||!roles.includes(input.role))invalid('Choose a valid linked account and access role.');
 const duties=input.dutyRoles||[];if(!Array.isArray(duties)||duties.length>2||duties.some(v=>!['bsm','bdm'].includes(v)))invalid('Choose valid operational duty roles.');
 const E=b.asServiceRole.entities,target=await E.User.get(input.userId);
 const email=(contact.email||input.email||'').trim().toLowerCase();if(!email||target.email?.toLowerCase()!==email)invalid('This account does not match the selected person.',409);
 const accountId=input.role==='framework_stakeholder'?null:input.accountId||null;
 if(accountId&&(typeof accountId!=='string'||accountId.length>100))invalid('Choose a valid organisation.');
 const account=accountId?(await E.Account.filter({dataverse_id:accountId},{limit:1})).items[0]:null;
 if(accountId&&!account)invalid('The selected organisation no longer exists.');
 if(account&&['client','supplier'].includes(input.role)&&account.account_type!==input.role)invalid('Choose an organisation matching the access role.');
 const region=input.role==='regional_director'?input.region||null:null;
 if(region&&(typeof region!=='string'||!(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(region))||!(await E.RegionDirectory.filter({dataverse_id:region},{limit:1})).items.length))invalid('Choose a recognised region.');
 if(input.role==='project_manager'&&!contact.dataverse_id)invalid('This person needs a linked project manager record.');
 const line=[input.role,...duties].some(v=>['bsm','bdm'].includes(v))?(await E.StaffReportingLine.filter({contact_id:contact.id},{limit:1})).items[0]:null;
 return E.User.update(target.id,{role:input.role,duty_roles:[...new Set(duties.filter(v=>v!==input.role))],staff_aad_id:line?.staff_aad_id||target.staff_aad_id||null,account_id:accountId,company_number:input.role==='supplier'?account?.company_number||null:null,region,contact_dataverse_id:input.role==='project_manager'?contact.dataverse_id:null,...(target.role!==input.role?{delegate_of:null,delegate_of_name:null,delegate_region:null}:{})});
}