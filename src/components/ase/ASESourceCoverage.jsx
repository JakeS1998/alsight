import React from 'react';
export default function ASESourceCoverage({model}) {
  const council=model==='english_local_authority';
  const entries=council ? [
    ['MHCLG Revenue Outturn','Automatic validation','Exact ONS identity, certified rows and explicit metric definitions. Generic or restricted reserves are never substituted for usable General Fund reserves.'],
    ['MHCLG Revenue Budget','Comparable periods only','Budget/outturn ratios require matching authority and completed financial year. Forecasts remain context.'],
    ['Exceptional Financial Support','Explicit decisions only','Support-list matches are context unless approval, period and operative status are unambiguous. No match never proves absence.'],
    ['Statutory intervention / Section 114','Primary facts only','Current statutory directions can score when exact identity and operative dates are validated. Searches, inspections and historical mentions stay unscored.'],
    ['Local audit / backstop','Context unless explicit','A missing report or backstop-only disclaimer is not a substantive governance failure. Ambiguous primary documents remain unscored without blocking publication.'],
    ['PWLB / CIPFA','Not connected','No loan or benchmark is substituted for primary financial evidence.']
  ] : [
    ['Companies House registry','Automatic statutory rules','Exact company identity; explicit filing breaches and current insolvency legal status. No inferred clean adverse-event score.'],
    ['Companies House accounts','Automatic tagged metrics','Supported GBP XML/iXBRL facts; unsupported taxonomies, ambiguous definitions and PDF-only disclosures remain unscored.'],
    ['Blackflag','Authenticated API required','Public-page systematic extraction is prohibited by provider terms. No proprietary R-Score is converted to ASE.'],
    ['The Gazette','Overnight primary context','Exact company-number notice matching between 21:00 and 07:00 UK, respecting robots and crawl limits; historical notices never imply current insolvency.']
  ];
  return <div className="space-y-3"><h4 className="text-sm font-semibold">Source coverage and limitations</h4><p className="text-xs text-muted-foreground">Source collection is not proof of a successful or complete check. HMRC is excluded. Missing evidence affects coverage, not component scores.</p><dl className="divide-y divide-border rounded-lg border border-border">{entries.map(([name,status,detail])=><div key={name} className="grid gap-1 p-3 sm:grid-cols-[1fr_2fr]"><dt className="text-xs font-semibold">{name}</dt><dd className="text-xs"><span className="font-medium">{status}</span><p className="mt-1 text-muted-foreground">{detail}</p></dd></div>)}</dl></div>;
}