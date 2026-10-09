export function dataverseDateValue(value) {
 if(typeof value!=='string')throw new Error('Enter a valid date.');
 const text=value.trim(),match=/^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,7})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(text);
 if(!match)throw new Error('Enter a valid date with a four-digit year.');
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 if(year<1753 || month<1 || month>12 || day<1 || day>new Date(Date.UTC(year,month,0)).getUTCDate())throw new Error('Enter a valid calendar date between 1753 and 9999.');
 const utc=text.includes('T') && !/(Z|[+-]\d{2}:\d{2})$/.test(text) ? `${text}Z` : text;
 const date=new Date(utc);
 if(!Number.isFinite(date.getTime()) || date.getUTCFullYear()<1753 || date.getUTCFullYear()>9999)throw new Error('Enter a valid date between 1753 and 9999.');
 return date.toISOString();
}