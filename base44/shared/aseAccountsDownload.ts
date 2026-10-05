import {readSourceResponse} from './aseSourceCommon.ts';
const origin='https://document-api.company-information.service.gov.uk';
export async function downloadAccountsDocument(metadataUrl,headers,type,maxBytes) {
  let response=await fetch(metadataUrl+'/content',{headers:{...headers,Accept:type},redirect:'manual',signal:AbortSignal.timeout(20000)});
  if(response.status===302) {
    const location=new URL(response.headers.get('location') || '',origin);
    const pathStyleBucket=location.hostname==='s3.eu-west-2.amazonaws.com' && location.pathname.startsWith('/document-api-images-live.ch.gov.uk/docs/');
    const approved=location.origin===origin || pathStyleBucket || /^[a-z0-9.-]+\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/.test(location.hostname);
    if(location.protocol!=='https:' || location.port || location.username || location.password || !approved) throw new Error('Document redirected outside approved Companies House storage.');
    response=await fetch(location.href,{redirect:'manual',signal:AbortSignal.timeout(20000)});
  }
  if(!response.ok) throw new Error(`Document download returned HTTP ${response.status}.`);
  return readSourceResponse(response,maxBytes);
}