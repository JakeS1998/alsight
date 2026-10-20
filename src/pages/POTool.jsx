import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PO_URL = 'https://alslive.crm11.dynamics.com/main.aspx?appid=3631f3af-18b0-f011-bbd3-6045bd0e7165&pagetype=entitylist&etn=cr78c_purchase_order&viewid=72585396-4146-432c-b3cb-f3ff1e313123&viewType=1039';

export default function POTool() {
  const [loading, setLoading] = useState(true);
  return <div className="space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-panel border bg-card p-5">
      <div>
        <Link to="/commercial" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Commercial</Link>
        <h1 className="font-heading text-2xl font-bold">PO Tool</h1>
      </div>
      <Button asChild variant="outline"><a href={PO_URL} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />Open in new window</a></Button>
    </header>
    <p className="text-sm text-muted-foreground">This Power App uses your Microsoft sign-in and existing purchase-order permissions. If the embedded view is blank or sign-in is blocked, open it in a new window, sign in, then reload this page.</p>
    <section className="relative overflow-hidden rounded-panel border bg-card" aria-label="Purchase-order application">
      {loading && <div role="status" className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 bg-card p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading PO Tool…</div>}
      <iframe src={PO_URL} title="PO Tool – purchase orders" className="h-[calc(100dvh-260px)] min-h-[480px] w-full border-0 sm:min-h-[600px]" onLoad={() => setLoading(false)} allowFullScreen />
    </section>
  </div>;
}