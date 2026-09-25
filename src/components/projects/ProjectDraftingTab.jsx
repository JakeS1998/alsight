import React from "react";
import { DOCUMENT_TYPE } from "@/lib/portal";
import { LegalDocumentCard } from "@/components/documents/LegalDocumentCard";
import { DMACard } from "@/components/documents/DMACard";
import { JCTCard } from "@/components/documents/JCTCard";
import { FileText, FileCheck, Gavel } from "lucide-react";

export function ProjectDraftingTab({ project, legalDocs, dmas, jcts, accountMap }) {
  // Group legal docs by type in lifecycle order
  const docByType = {};
  legalDocs.forEach((d) => {
    if (!docByType[d.document_type]) docByType[d.document_type] = [];
    docByType[d.document_type].push(d);
  });
  const docTypes = Object.keys(DOCUMENT_TYPE)
    .filter((t) => docByType[t] && t !== "other")
    .sort((a, b) => (DOCUMENT_TYPE[a].order || 99) - (DOCUMENT_TYPE[b].order || 99));

  return (
    <div className="space-y-6">
      {/* Legal Documents by type */}
      {docTypes.length > 0 && (
        <Section icon={FileText} title="Legal Documents" count={legalDocs.length}>
          <div className="space-y-3">
            {docTypes.map((type) => (
              <div key={type}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {DOCUMENT_TYPE[type].label}
                </p>
                <div className="space-y-2">
                  {docByType[type].map((doc) => (
                    <LegalDocumentCard key={doc.id} doc={doc} accountName={accountMap[doc.account_id]?.name} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* DMAs */}
      {dmas.length > 0 && (
        <Section icon={FileCheck} title="Development Management Agreements" count={dmas.length}>
          <div className="space-y-2">
            {dmas.map((doc) => (
              <DMACard key={doc.id} doc={doc} />
            ))}
          </div>
        </Section>
      )}

      {/* JCTs */}
      {jcts.length > 0 && (
        <Section icon={Gavel} title="JCT Contracts" count={jcts.length}>
          <div className="space-y-2">
            {jcts.map((doc) => (
              <JCTCard
                key={doc.id}
                doc={doc}
                accountName={accountMap[doc.account_id]?.name}
                contractorName={accountMap[doc.contractor_id]?.name}
              />
            ))}
          </div>
        </Section>
      )}

      {legalDocs.length === 0 && dmas.length === 0 && jcts.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No documents for this project yet.</p>
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{count}</span>
      </div>
      {children}
    </div>
  );
}