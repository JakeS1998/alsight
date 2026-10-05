import React from 'react';
import {Button} from '@/components/ui/button';
export default function ReviewQueryState({query,children}) {
 if(query.isPending) return <p role="status" className="p-4 text-sm text-muted-foreground">Loading project information…</p>;
 if(query.error) return <div role="alert" className="p-4 text-sm text-destructive">{query.error.message || 'Unable to load project information.'} <Button size="sm" variant="outline" onClick={()=>query.refetch()}>Try again</Button></div>;
 return children;
}