import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { aliceDocumentFile } from '../../shared/aliceDocumentFiles.ts';
import { parseAliceExcel } from '../../shared/aliceExcelFile.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(error => error.status === 401 ? null : Promise.reject(error));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { title, content, format = 'pdf' } = await req.json().catch(() => ({}));
    if (typeof title !== 'string' || !title.trim() || title.length > 160 || typeof content !== 'string' || !content.trim() || content.length > 60000 || !['pdf', 'docx', 'txt', 'xlsx'].includes(format)) {
      return Response.json({ error: 'Provide title (1–160 characters), content (1–60000 characters), and format pdf, docx, txt or xlsx.' }, { status: 400 });
    }
    if (format === 'xlsx' && !parseAliceExcel(content)) return Response.json({ error: 'For xlsx, content must be a JSON string containing headers (1–50 unique non-empty strings), rows (up to 1000 arrays matching the headers, with string/number/boolean/null cells), and optional valid Excel sheetName (up to 31 characters).' }, { status: 400 });
    const file = await aliceDocumentFile(title.trim(), content, format);
    const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
    return Response.json({ success: true, document: { file_uri, filename: file.name, format, size: file.size }, message: 'Document created. It is attached to this tool result for download in the chat.' });
  } catch (error) {
    console.error('ALICE document creation failed', error.message);
    return Response.json({ error: 'The document could not be created. Please try again.' }, { status: 500 });
  }
}