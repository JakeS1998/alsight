import { base44 } from '@/api/base44Client';

export async function prepareBriefSource(attachment, sourceCount) {
  if (!attachment.file && !attachment.sharepointUrl?.trim()) return null;
  if (sourceCount >= 5) throw new Error('Use up to five source documents per project brief.');
  if (!attachment.file) return { sharepoint_url: attachment.sharepointUrl.trim(), name: 'SharePoint brief' };
  if (!/\.(pdf|docx)$/i.test(attachment.file.name) || attachment.file.size > 10 * 1024 * 1024) throw new Error('Upload a PDF or Word (.docx) document of 10 MB or smaller.');
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: attachment.file });
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
  return { file_uri, file_url: signed_url, name: attachment.file.name };
}

export async function archiveProjectBrief(snapshot, user) {
  if (snapshot.messages.length === 1 && !snapshot.sources.length) return null;
  const saved = { version: 1, created_at: new Date().toISOString(), requestor_name: user?.full_name || user?.email || '', ...snapshot };
  const file = new File([JSON.stringify(saved)], 'project-request-brief.json', { type: 'application/json' });
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  return file_uri;
}