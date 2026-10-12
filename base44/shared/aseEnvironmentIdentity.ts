export const environmentSupplier=account=>account.account_type==='supplier' || account.relationship_types?.includes('supplier');
export const environmentName=value=>String(value || '').toUpperCase().replace(/\bLIMITED\b/g,'LTD').replace(/[^A-Z0-9]/g,'');
const postcode=value=>String(value || '').toUpperCase().replace(/\s/g,'');
const number=value=>String(value || '').toUpperCase().replace(/\s/g,'').padStart(8,'0');
export function environmentSearchName(account) {
 if(!environmentSupplier(account))throw new Error('Environment Agency checks apply to suppliers only.');
 const name=String(account.company_name || account.name || '').trim();
 if(name.length<3 || name.length>200)throw new Error('Record a supplier legal name before checking Environment Agency registers.');
 return name.replace(/\s+(?:LIMITED|LTD|PLC)\.?$/i,'').replace(/[^\p{L}\p{N}\s&'-]/gu,' ').trim();
}
export function environmentIdentifier(account) {return JSON.stringify([environmentSearchName(account),account.company_number || '',account.company_registered_office?.postal_code || account.address_postcode || '']);}
export function environmentReference(value) {
 try {const url=new URL(value);if(url.hostname==='environment.data.gov.uk' && /^\/public-register\/(enforcement-action|waste-carriers-brokers)\/registration\/[A-Za-z0-9_-]+$/.test(url.pathname)){url.protocol='https:';url.search='';url.hash='';return url.href;}}catch{}
 return '';
}
export function environmentMatch(account,item,carrier=false) {
 const holder=carrier ? item.holder : item.offender;
 if(!holder || typeof holder.name!=='string')return 'Unresolved identity';
 if(holder.companyNumber && account.company_number)return number(holder.companyNumber)===number(account.company_number) ? 'Exact company number' : 'Different company number';
 const exactName=environmentName(holder.name)===environmentName(account.company_name || account.name);
 const expected=postcode(account.company_registered_office?.postal_code || account.address_postcode);
 const address=carrier ? item.site?.siteAddress : holder.hasAddress;
 const found=postcode(address?.postcode || String(address?.address || '').match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\s*$/i)?.[0]);
 return exactName && expected && found===expected ? 'Name and postcode match; identity review required' : exactName ? 'Name match only; identity review required' : 'Potential name match; identity review required';
}