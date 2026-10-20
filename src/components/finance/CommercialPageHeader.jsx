import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
export default function CommercialPageHeader({ status, user }) {
 const completedAt = status?.sync?.last_completed_at;
 const description = <>
  Project pipeline, Power BI purchase-order commitments and client invoices (sales orders).
  {status?.confirmed && <span className="mt-4 block text-xs text-sidebar-foreground/65">
   {status?.source==='powerbi'?'Power BI semantic-model PO/SO snapshot':'Dataverse snapshot'}{completedAt ? ` · Last completed sync: ${new Date(completedAt).toLocaleString('en-GB')}` : ''}
   <span className="mt-1 block">Your existing access rules apply to all figures and records. Sales orders represent client invoices, not evidence of payment.</span>
  </span>}
 </>;
 const actions = <>
 <Button asChild variant="outline"><Link to="/commercial/po-tool">PO Tool</Link></Button>
 </>;
 return <div className="mb-10 [&_h1]:text-sidebar-foreground"><WorkspacePageHeader title="Commercial" eyebrow="Alliance Leisure" description={description} image="https://media.base44.com/images/public/6ab62433a194f918c54c8249/f74060573_image.png" imageAlt="Team collaborating around a laptop with financial charts in the office" actions={actions}/></div>;
}