import aliceDocumentAttachments from '@/components/alice/aliceDocumentAttachments';

export default function aliceDisplayMessages(messages) {
  const visible = [];
  let turn = [];
  const appendTurn = () => {
    if (!turn.length) return;
    const documents = turn.flatMap(aliceDocumentAttachments).filter((document, index, all) =>
      all.findIndex(item => item.file_uri === document.file_uri) === index);
    const calls = turn.flatMap(message => message.tool_calls || []).filter(call => call.name?.includes('createAliceDocument'));
    const replies = turn.filter(message => typeof message.content === 'string' && message.content.trim());
    if (!replies.length && (documents.length || calls.length)) replies.push({ ...turn[turn.length - 1], content: '' });
    replies.forEach((message, index) => visible.push({ ...message,
      documents: index === replies.length - 1 ? documents : [],
      documentCalls: index === replies.length - 1 ? calls : [] }));
    turn = [];
  };
  for (const message of messages) {
    if (message.role === 'user') { appendTurn(); visible.push(message); }
    else if (message.role === 'assistant') turn.push(message);
  }
  appendTurn();
  return visible;
}