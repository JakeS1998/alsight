import React from 'react';
import {formatDate} from '@/lib/portal';
export default function LoiExpiryDetails({doc}) {
 const scan=doc.loi_expiry_scan;
 if(!scan && !doc.loi_expiry_date)return null;
 return <div className="space-y-1 text-xs">
  {doc.loi_expiry_date&&<p><span className="text-muted-foreground">LOI expiry: </span>{formatDate(doc.loi_expiry_date)}</p>}
  {scan?.status==='review_required'&&<p className="text-risk-elevated">Expiry needs review: {scan.reason}{doc.loi_expiry_date?' Previous recorded expiry retained.':''}</p>}
  {scan?.source_url&&<a href={scan.source_url} target="_blank" rel="noopener noreferrer" className="block underline">Expiry source: {scan.source_name}</a>}
  {scan?.evidence&&<p className="text-muted-foreground">{scan.evidence}</p>}
 </div>;
}