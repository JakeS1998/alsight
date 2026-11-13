import React from 'react';
import {Button} from '@/components/ui/button';
export default function COWorkingCopy({copy,opening,onDownload}){
 if(!copy)return null;
 return <div className="my-4 rounded-panel border border-border bg-muted p-4"><h3 className="font-semibold">Latest contingency working copy</h3><p className="mt-2 text-sm">{copy.filename} · Uploaded by {copy.author_name} · {new Date(copy.at).toLocaleString('en-GB',{timeZone:'Europe/London'})}</p><p className="my-2 text-sm text-muted-foreground">{copy.status==='verified'?'Verified against SharePoint.':`Recovery status: ${copy.status}. This edited copy is stored in contingency; SharePoint is unchanged until approved recovery.`}</p><Button variant="outline" disabled={opening} onClick={()=>onDownload(copy.id)}>{opening?'Downloading…':'Download latest working copy'}</Button><p className="mt-2 text-xs text-muted-foreground">Download this version before making further edits; upload your saved file below.</p></div>;
}