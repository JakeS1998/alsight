import { DOCUMENT_TYPE } from '@/lib/portal';
import agreementNames from '@/components/projects/agreementNames';

export function legalDocumentName(doc, projectName, supplierName, projectNumber) {
  const type = doc.document_type === 'access_agreement' ? agreementNames(projectNumber).access : DOCUMENT_TYPE[doc.document_type]?.label || 'Document';
  const isSupplierDocument = ['appointment_pm', 'appointment_pd_cdm', 'appointment_architect', 'appointment_pd_br', 'pcsa', 'loi'].includes(doc.document_type);
  return [type, (isSupplierDocument && supplierName) || projectName || supplierName].filter(Boolean).join(' — ');
}

export function dmaName(projectName, projectNumber) {
  return [agreementNames(projectNumber).development, projectName].filter(Boolean).join(' — ');
}

export function jctName(projectName, contractorName) {
  return ['Construction Contract (JCT)', contractorName || projectName].filter(Boolean).join(' — ');
}

export function warrantyName(supplierName, services) {
  return [supplierName || 'Warranty', services?.trim()].filter(Boolean).join(' — ');
}