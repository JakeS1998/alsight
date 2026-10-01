const types = ['appointment_pm', 'appointment_pd_cdm', 'appointment_architect', 'appointment_pd_br', 'pcsa', 'loi', 'additional_works'];
export default function isPreConstructionDocument(doc) {
  if (types.includes(doc.document_type)) return true;
  if (!['access_agreement', 'other'].includes(doc.document_type)) return false;
  const reference = `${doc.link_to_file || ''} ${doc.comments || ''}`.replace(/%20|%2D|%5F/gi, ' ');
  return (/access[\s_-]*agreement|\baa\b/i.test(reference) && /variation/i.test(reference)) || (doc.document_type === 'other' && /\bloi\b/i.test(reference));
}