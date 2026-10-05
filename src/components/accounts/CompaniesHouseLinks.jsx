import React from 'react';
export default function CompaniesHouseLinks({ account }) {
  const links = [['Companies House',account.ch_links_self],['Officers',account.ch_links_officers],['Filings',account.ch_links_filing_history],['Ownership / PSC',account.ch_links_psc]].filter(([,url]) => url);
  if (!links.length) return null;
  return <div className="flex flex-wrap gap-3 text-xs font-semibold">{links.map(([label,url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{label} ↗</a>)}</div>;
}