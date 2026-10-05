const origin='https://api.company-information.service.gov.uk';
export const publicOrigin='https://find-and-update.company-information.service.gov.uk';
export function normaliseCompanyNumber(value) {
  const number=String(value || '').trim().toUpperCase();
  const normal=/^\d{1,8}$/.test(number) ? number.padStart(8,'0') : number;
  if (!/^(?:\d{8}|[A-Z]{2}\d{6})$/.test(normal)) throw new Error('Enter a valid Companies House Company Number on this Account first.');
  return normal;
}
export async function retrieveCompany(number,key) {
  const sections={},warnings=[];
  async function request(path) {
    const response=await fetch(origin+path,{headers:{Authorization:`Basic ${btoa(String(key).trim()+':')}`,Accept:'application/json'},signal:AbortSignal.timeout(15000)});
    const text=await response.text();
    if (text.length>1000000) throw new Error('Companies House response exceeds the safe size limit.');
    let data; try {data=text ? JSON.parse(text) : null;} catch {data=null;}
    return {url:origin+path,status:response.status,etag:response.headers.get('etag'),retrieved_at:new Date().toISOString(),data};
  }
  const profile=await request(`/company/${number}`); sections.profile={pages:[profile],complete:profile.status===200};
  if (profile.status!==200) {
    const credentialError=profile.status===401 || profile.status===403 || (profile.status===400 && /authori|authentic|credential/i.test(String(profile.data?.error || '')));
    return {sections,warnings,error:credentialError ? 'Companies House rejected the API credentials. Check that the saved value is the REST API key, without a Basic or Bearer prefix.' : profile.status===404 ? 'Company Number not found at Companies House.' : `Companies House profile request failed (${profile.status}).`};
  }
  if (!profile.data || normaliseCompanyNumber(profile.data.company_number)!==number) throw new Error('Companies House returned a mismatched company identifier.');
  await Promise.all(['officers','persons-with-significant-control','filing-history','charges','insolvency'].map(async kind=>{
    const section={pages:[],complete:false,total:null,retrieved:0};sections[kind]=section;
    try {
      for(let start=0;start<400;start+=100) {
        const result=await request(`/company/${number}/${kind}${kind==='insolvency' ? '' : `?items_per_page=100&start_index=${start}`}`);
        section.pages.push(result);
        if(result.status===404 && kind==='insolvency') {section.complete=true;section.no_record=true;break;}
        if(result.status!==200 || !result.data) {warnings.push(`${kind}: unavailable (${result.status}).`);break;}
        if(kind==='insolvency') {section.complete=true;section.total=result.data.cases?.length ?? 0;section.retrieved=section.total;break;}
        const rows=result.data.items || [];section.retrieved+=rows.length;
        section.total=result.data.total_results ?? result.data.total_count ?? section.total;
        if(rows.length<100 || (section.total!=null && section.retrieved>=section.total)) {section.complete=true;break;}
      }
      if(!section.complete && section.retrieved>=400) warnings.push(`${kind}: first 400 records retrieved; use the source register for the full collection.`);
    } catch {warnings.push(`${kind}: retrieval failed; no absence of records has been inferred.`);}
  }));
  return {sections,warnings};
}
export function sectionItems(raw,kind) {return (raw.sections[kind]?.pages || []).filter(p=>p.status===200).flatMap(p=>kind==='insolvency' ? p.data?.cases || [] : p.data?.items || []);}
export function summariseCompany(raw) {
  const p=raw.sections.profile.pages[0].data;
  return {company_number:p.company_number,company_name:p.company_name,company_status:p.company_status,company_status_detail:p.company_status_detail || '',company_type:p.type,registered_office:p.registered_office_address || {},date_of_creation:p.date_of_creation,accounts:{...p.accounts,next_accounts:{...p.accounts?.next_accounts,overdue:p.accounts?.next_accounts?.overdue ?? p.accounts?.overdue,due_on:p.accounts?.next_accounts?.due_on || p.accounts?.next_due}},confirmation_statement:p.confirmation_statement || {},collections:Object.fromEntries(Object.entries(raw.sections).filter(([key])=>key!=='profile').map(([key,s])=>[key,{complete:s.complete,total:s.total,retrieved:s.retrieved,no_record:s.no_record || false}]))};
}