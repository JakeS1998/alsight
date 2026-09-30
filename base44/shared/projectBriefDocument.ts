import mammoth from 'npm:mammoth@1.9.1/mammoth.browser.js';
const MAX_BYTES = 10 * 1024 * 1024;
const fail = message => { const error = new Error(message); error.status = 400; throw error; };
async function readDocument(url, sharepoint) {
  let current = new URL(url);
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(current.href, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (response.status >= 300 && response.status < 400) {
      const destination = new URL(response.headers.get('location') || '', current);
      if (!sharepoint || destination.protocol !== 'https:' || destination.hostname !== current.hostname) fail('This SharePoint brief requires sign-in. Download it and upload the PDF or Word document instead.');
      current = destination; continue;
    }
    if (!response.ok) fail('The brief could not be downloaded. For restricted SharePoint documents, upload the PDF or Word file instead.');
    if (Number(response.headers.get('content-length')) > MAX_BYTES) fail('Brief documents must be 10 MB or smaller.');
    const reader = response.body.getReader(); const chunks = []; let length = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > MAX_BYTES) { await reader.cancel(); fail('Brief documents must be 10 MB or smaller.'); } chunks.push(value); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return { bytes, url: current.href };
  }
  fail('The SharePoint link redirects too many times. Please upload the document instead.');
}
export async function projectBriefDocument(source, appId) {
  if (!source) return { text: '', fileUrls: [] };
  let url; const sharepoint = !!source.sharepoint_url;
  try { url = new URL(sharepoint ? source.sharepoint_url : source.file_url); } catch { fail('Please supply a valid brief document link.'); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || url.href.length > 8000) fail('Please supply a valid HTTPS brief document link.');
  if (sharepoint) {
    if (!url.hostname.endsWith('.sharepoint.com')) fail('Please use a SharePoint document link, or upload a PDF or Word document.');
    url.searchParams.set('download', '1');
  } else {
    const prefix = `mp/private/${appId}/`;
    if (typeof source.file_uri !== 'string' || !source.file_uri.startsWith(prefix) || source.file_uri.length > 500 || !/\.(pdf|docx)$/i.test(source.file_uri)) fail('Upload a PDF or Word (.docx) brief to this app.');
    if (url.hostname !== 'media.base44.com' || decodeURIComponent(url.pathname) !== source.file_uri.replace(/^mp\//, '/files/')) fail('Invalid uploaded brief link. Please upload the document again.');
  }
  const { bytes, url: documentUrl } = await readDocument(url.href, sharepoint);
  if (new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-') return { text: '', fileUrls: [documentUrl] };
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    let result;
    try { result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer }); } catch { fail('This Word file could not be read. Please upload a PDF or a valid Word (.docx) document.'); }
    if (result.value.length > 60000) fail('This brief is too long. Please upload a shorter document (up to 60,000 characters).');
    if (!result.value.trim()) fail('This Word document contains no readable text. Please upload a PDF or add the brief as text.');
    return { text: result.value, fileUrls: [] };
  }
  fail(sharepoint ? 'This SharePoint link does not provide a readable public PDF or Word document. Download it and upload the file instead.' : 'Please upload a valid PDF or Word (.docx) document.');
}