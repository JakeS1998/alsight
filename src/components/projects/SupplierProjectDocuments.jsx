import React from 'react';
import { LegalDocumentCard } from '@/components/documents/LegalDocumentCard';
import { JCTCard } from '@/components/documents/JCTCard';
import ProjectEmptyState from '@/components/projects/ProjectEmptyState';
import { FileText } from 'lucide-react';

export default function SupplierProjectDocuments({ project, legalDocs, jcts, accountMap }) {
  if (!legalDocs.length && !jcts.length) return <ProjectEmptyState icon={FileText} title="No documents linked to your supplier account for this project." description="Ask the project's BSM to confirm the documents linked to your appointment." to={`/projects/${project.id}?tab=general`} action="View project team" />;
  return <div className="space-y-3">
    {legalDocs.map(doc => <LegalDocumentCard key={doc.id} doc={doc} projectName={project.name} projectNumber={project.project_number} accountName={accountMap[doc.account_id]?.name} hideCommentsAndLinks />)}
    {jcts.map(doc => <JCTCard key={doc.id} doc={doc} projectName={project.name} accountName={accountMap[doc.account_id]?.name} contractorName={accountMap[doc.contractor_id]?.name} hideCommentsAndLinks />)}
  </div>;
}