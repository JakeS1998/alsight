export default function aliceDocumentAttachments(message) {
  const documents = [];
  const read = value => {
    if (!value) return;
    if (typeof value === 'string') { try { read(JSON.parse(value)); } catch { /* Not a document result. */ } return; }
    if (typeof value !== 'object') return;
    if (value.success === false || value.error) return;
    if (value.document?.file_uri && typeof value.document.filename === 'string') documents.push(value.document);
    if (value.data) read(value.data);
    if (value.result) read(value.result);
  };
  for (const call of message.tool_calls || []) {
    if (!['failed', 'error', 'pending', 'running', 'in_progress'].includes(call.status)) read(call.results);
  }
  return documents.filter((document, index) => documents.findIndex(item => item.file_uri === document.file_uri) === index);
}