import React from 'react';
export default function ASESourceCoverage({model}) {
  const council=model==='english_local_authority';
  const entries=council ? [
    ['MHCLG Revenue Outturn','Automated collection','Official ODS financial facts matched by ONS authority code; normalisation requires review.'],
    ['MHCLG Revenue Budget','Not yet connected','Budget figures are not currently retrieved automatically.'],
    ['Exceptional Financial Support','Automated collection','Published support-list matches require confirmation of year and decision status.'],
    ['Statutory intervention / assurance','Document discovery only','Official search candidates are not verified intervention classifications.'],
    ['Local Audit / backstop','Manual evidence required','No automatic authority-level audit opinion or backstop compliance check.'],
    ['PWLB / Debt Management Office','Not yet connected','No automatic loan or maturity data retrieval.'],
    ['CIPFA Resilience Index','Benchmark only','Not connected; no benchmark is substituted for primary financial evidence.']
  ] : [
    ['Companies House registry','Automated collection','Identity, compliance and adverse-event facts, using the existing registry connection.'],
    ['Companies House filed accounts','Automated tagged-document collection','XML/iXBRL facts and ratio candidates where disclosed; PDF-only accounts require manual input.'],
    ['BlackFlag','Public-data collection','Replaces Experian; the public source is not a licensed commercial API connection. Its R-Score remains contextual.'],
    ['The Gazette','Automated notice discovery','Exact company-number matches, followed by human review of dates and current status.'],
    ['HMRC VAT','Production approval pending','Current credentials are sandbox credentials; do not use them for live verification.']
  ];
  return <div className="space-y-3"><h4 className="text-sm font-semibold">Source coverage and remaining gaps</h4><p className="text-xs text-muted-foreground">Collection availability is not proof of a successful check. Each source card shows its saved outcome.</p><dl className="divide-y divide-border rounded-lg border border-border">{entries.map(([name,status,detail])=><div key={name} className="grid gap-1 p-3 sm:grid-cols-[1fr_2fr]"><dt className="text-xs font-semibold">{name}</dt><dd className="text-xs"><span className="font-medium">{status}</span><p className="mt-1 text-muted-foreground">{detail}</p></dd></div>)}<div className="grid gap-1 p-3 sm:grid-cols-[1fr_2fr]"><dt className="text-xs font-semibold">Manual ASE evidence</dt><dd className="text-xs text-muted-foreground">Available to administrators through the assessment controls below for missing disclosures and verified exceptional cases.</dd></div></dl></div>;
}