import { createHandoverZip } from './handoverZip.ts';
import { createHandoverReport } from './handoverReport.ts';
import { createHandoverRegisterPdf } from './handoverRegisterPdf.ts';

const maxBytes = 20 * 1024 * 1024;
export async function createHandoverBundle(base44, pack, appId) {
  const files = [{ name: 'Handover-report.pdf', bytes: createHandoverReport(pack) }], manifest = [];
  let total = files[0].bytes.length;
  const seen = new Map();
  for (const item of pack.items) {
    if (item.registerData) {
      const bytes = createHandoverRegisterPdf(pack.project, item);
      total += bytes.length;
      if (total > maxBytes) throw new Error('Bundle exceeds 20 MB. Download registers individually.');
      const path = `${item.key}/Portal-register-v${item.register_version}.pdf`;
      files.push({ name: path, bytes });
      manifest.push({ category: item.key, name: 'Portal register', version: String(item.register_version), included: true, path, bytes: bytes.length });
    }
    for (const file of item.documents.filter(doc => !doc.superseded)) {
      if (!file.file_uri) { manifest.push({ category: item.key, name: file.name, link: file.link, included: false, reason: 'External secure reference; not downloaded' }); continue; }
      if (!file.file_uri.startsWith(`mp/private/${appId}/`)) throw new Error('A referenced private document is not stored in this app.');
      if (seen.has(file.file_uri)) { manifest.push({ category: item.key, name: file.name, included: true, path: seen.get(file.file_uri) }); continue; }
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: file.file_uri, expires_in: 300 });
      const response = await fetch(signed_url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Unable to read ${file.name}. Check the document before exporting.`);
      const reader = response.body.getReader(), chunks = []; let size = 0;
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        size += value.length; total += value.length;
        if (size > 10 * 1024 * 1024 || total > maxBytes) { await reader.cancel(); throw new Error('Bundle limit: 10 MB per file and 20 MB total. Download larger documents individually.'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const name = `${item.key}/${files.length}-${String(file.version || 'source').replace(/[^a-zA-Z0-9_-]/g, '-')}-${String(file.name).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 160)}`;
      files.push({ name, bytes }); seen.set(file.file_uri, name);
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
      manifest.push({ category: item.key, name: file.name, version: file.version || '', included: true, path: name, bytes: size, sha256: Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('') });
    }
  }
  files.push({ name: 'manifest.json', bytes: new TextEncoder().encode(JSON.stringify({ ...pack, bundledFiles: manifest, bundleNote: 'Snapshot of saved data at export. External links are references only. Superseded documents are retained in ALSight but not copied into this bundle.' }, null, 2)) });
  return createHandoverZip(files);
}