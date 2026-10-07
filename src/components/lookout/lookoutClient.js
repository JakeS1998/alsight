import { base44 } from '@/api/base44Client';
export default async function lookoutRequest(action, input = {}) {
  const response = await base44.functions.invoke('manageLookout', {action,...input});
  if(response.data?.error) throw new Error(response.data.error);
  return response.data;
}
export async function downloadLookout(issue) {
  const tab = window.open('about:blank','_blank');
  if(tab) tab.opener = null;
  try {
    const { pdf_file_uri } = await lookoutRequest('pdf', {id:issue.id});
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({file_uri:pdf_file_uri});
    if(tab) tab.location.href = signed_url; else window.location.href = signed_url;
  } catch(error) { if(tab) tab.close(); throw error; }
}