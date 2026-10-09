import React from 'react';
import { Flag } from 'lucide-react';
export default function FinanceNameMatchFlag({mapping}){
 if(mapping?.matching_method!=='name'||!mapping.project_id)return null;
 return <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground" title="Matched using a unique project name, not its project number."><Flag className="h-3 w-3" aria-hidden="true"/>Mapped by name</span>;
}