import React from 'react';
export default function ASESourceCoverage({model}) {
  const council=model==='english_local_authority';
  const entries=council ? [
    ['MHCLG Revenue Outturn','Automatic validation','Exact ONS identity and explicit metric definitions. Completed-year uncertified published figures may score with Low confidence. Generic, unallocated or restricted reserves are never substituted for usable General Fund reserves.'],
    ['MHCLG Revenue Budget','Comparable periods only','Budget/outturn ratios require matching authority and completed financial year. Forecasts remain context.'],
    ['Exceptional Financial Support','Explicit decisions only','An exact official-name match with explicit current-year support agreed in principle scores 3/5 with Low confidence, not as final approval or consecutive-year support. Ambiguous amounts and missing matches remain unscored.'],
    ['Statutory intervention / Section 114','Primary facts only','Current statutory directions can score when exact identity and operative dates are validated. Searches, inspections and historical mentions stay unscored.'],
    ['Local audit / backstop','Context unless explicit','A missing report or backstop-only disclaimer is not a substantive governance failure. Ambiguous primary documents remain unscored without blocking publication.'],
    ['PWLB / CIPFA','Not connected','No loan or benchmark is substituted for primary financial evidence.']
  ] : [
    ['Companies House registry','Automatic statutory rules','Exact company identity; explicit filing breaches and current insolvency legal status. No inferred clean adverse-event score.'],
    ['Companies House accounts','Tagged metrics + ALICE PDF fallback','Supported GBP XML/iXBRL facts take precedence. ALICE scans PDF-only accounts for company-only GBP figures with page citations; PDF-derived scores have Low confidence. Missing or ambiguous figures remain unscored.'],
    ['The Gazette','Overnight company-number checks','Successful zero-result insolvency searches count as clean for this check only. Collection runs between 21:00 and 07:00 UK, respecting robots and crawl limits; failed checks stay unknown and historical notices never imply current insolvency.']
  ];
  return <div className="space-y-3"><h4 className="text-sm font-semibold">Source coverage and limitations</h4><p className="text-xs text-muted-foreground">Source collection is not proof of a successful or complete check. HMRC is excluded. Missing evidence affects coverage, not component scores.</p><dl className="divide-y divide-border rounded-lg border border-border">{entries.map(([name,status,detail])=><div key={name} className="grid gap-1 p-3 sm:grid-cols-[1fr_2fr]"><dt className="text-xs font-semibold">{name}</dt><dd className="text-xs"><span className="font-medium">{status}</span><p className="mt-1 text-muted-foreground">{detail}</p></dd></div>)}</dl></div>;
}