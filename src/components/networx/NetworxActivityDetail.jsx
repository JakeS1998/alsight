import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import networxClient from '@/components/networx/networxClient';
import networxText from '@/components/networx/networxText';
import NetworxEmailReplyButton from '@/components/networx/NetworxEmailReplyButton';
export default function NetworxActivityDetail({ entity, recordId, row, user }) {
  const query = useQuery({queryKey:['networx-detail',user?.id,user?.role,entity,recordId,row.kind,row.id],queryFn:()=>networxClient({action:'detail',entity,recordId,activityId:row.id,kind:row.kind}),retry:false,staleTime:0,gcTime:0,refetchOnWindowFocus:false});
  if (query.isPending) return <p role="status" className="p-3 text-sm text-muted-foreground">Loading activity details…</p>;
  if (query.error) return <div role="alert" className="space-y-2 p-3 text-sm"><p className="text-destructive">{query.error.message}</p><Button variant="outline" size="sm" onClick={()=>query.refetch()}>Try again</Button></div>;
  if (query.data.state !== 'ready') return <p className="p-3 text-sm text-muted-foreground">{query.data.message} {query.data.state==='connection_required' && <Link to="/account-settings" className="underline">Account Settings</Link>}</p>;
  const item = query.data.item, body = networxText(item.body);
  return <div className="space-y-3 border-t border-border p-4 text-sm">
    {row.kind==='email' && [3,4].includes(item.emailStatus) && <div className="flex justify-end"><NetworxEmailReplyButton entity={entity} recordId={recordId} emailId={row.id}/></div>}
    {item.participants?.length > 0 && <ul className="space-y-1 text-xs text-muted-foreground" aria-label="Activity participants">{item.participants.map((person,index)=><li key={index}>{person.role ? `${person.role}: ` : ''}{person.name}</li>)}</ul>}
    {body ? <p className="whitespace-pre-wrap break-words">{body}</p> : <p className="text-muted-foreground">No additional description recorded.</p>}
    {item.filename && <p className="break-words text-xs text-muted-foreground">Attached document: {item.filename}</p>}
    {(item.joinUrl || item.outlookUrl) && <div className="flex flex-wrap gap-2">{item.joinUrl && <Button asChild size="sm"><a href={item.joinUrl} target="_blank" rel="noopener noreferrer">Join Teams meeting</a></Button>}{item.outlookUrl && <Button asChild size="sm" variant="outline"><a href={item.outlookUrl} target="_blank" rel="noopener noreferrer">Open in Outlook</a></Button>}</div>}
  </div>;
}