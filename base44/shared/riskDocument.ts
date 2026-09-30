import { projectBriefDocument } from './projectBriefDocument.ts';
import { readRiskWorkbook } from './riskWorkbook.ts';
export async function riskDocument(base44, fileUri, appId) {
  if (typeof fileUri !== 'string' || !fileUri.startsWith(`mp/private/${appId}/`) || fileUri.length > 500 || !/\.(pdf|docx|xlsx|csv)$/i.test(fileUri)) throw new Error('Upload a PDF, Word (.docx), Excel (.xlsx) or CSV register to this app.');
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 600 });
  if (/\.(pdf|docx)$/i.test(fileUri)) return projectBriefDocument({ file_uri: fileUri, file_url: signed_url }, appId);
  const response = await fetch(signed_url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok || Number(response.headers.get('content-length')) > 10 * 1024 * 1024) throw new Error('Unable to read the upload; files must be 10 MB or smaller.');
  const reader = response.body.getReader(); const chunks = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 10 * 1024 * 1024) { await reader.cancel(); throw new Error('Files must be 10 MB or smaller.'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const text = /\.xlsx$/i.test(fileUri) ? await readRiskWorkbook(bytes) : new TextDecoder().decode(bytes);
  if (!text.trim() || text.length > 90000) throw new Error('The register is empty or too long; split it into smaller files (up to 90,000 characters).');
  return { text, fileUrls: [] };
}