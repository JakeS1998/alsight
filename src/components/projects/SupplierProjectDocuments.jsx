import React from 'react';
import { LegalDocumentCard } from '@/components/documents/LegalDocumentCard';
import { JCTCard } from '@/components/documents/JCTCard';

export default function SupplierProjectDocuments({ project, legalDocs, jcts, accountMap }) {
  if (!legalDocs.length && !jcts.length) return <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">No documents linked to your supplier account for this project.</div>;
  return <div className="space-y-3">
    {legalDocs.map(doc => <LegalDocumentCard key={doc.id} doc={doc} projectName={project.name} accountName={accountMap[doc.account_id]?.name} />)}
    {jcts.map(doc => <JCTCard key={doc.id} doc={doc} projectName={project.name} accountName={accountMap[doc.account_id]?.name} contractorName={accountMap[doc.contractor_id]?.name} />)}
  </div>;
}