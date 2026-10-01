const types = ['appointment_pm', 'appointment_pd_cdm', 'appointment_architect', 'appointment_pd_br', 'pcsa', 'additional_works'];
export function isLetterOfIntent(doc) {
  const reference = `${doc.link_to_file || ''} ${doc.comments || ''}`.replace(/%20|%2D|%5F/gi, ' ');
  return doc.document_type === 'loi' || (doc.document_type === 'other' && /\bloi\b/i.test(reference));
}
export default function isPreConstructionDocument(doc) {
  if (isLetterOfIntent(doc)) return false;
  if (types.includes(doc.document_type)) return true;
  if (!['access_agreement', 'other'].includes(doc.document_type)) return false;
  const reference = `${doc.link_to_file || ''} ${doc.comments || ''}`.replace(/%20|%2D|%5F/gi, ' ');
  return /access[\s_-]*agreement|\baa\b/i.test(reference) && /variation/i.test(reference);
}