import React from 'react';
import {Link} from 'react-router-dom';
import {Activity,ArrowUpRight,MoreHorizontal,Trash2} from 'lucide-react';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from '@/components/ui/dropdown-menu';
import PulseImage from '@/components/alliance/PulseImage';
import PulseText from '@/components/alliance/PulseText';

export default function PulsePost({item,user,onRemove,removing,groupOwnerId}) {
  const author=item.author_name || (item.system ? 'Alliance Pulse' : 'Alliance team');
  const initials=author.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  const canRemove=!item.system && (user.id===item.author_id || user.id===groupOwnerId || ['admin','director'].includes(user.role));
  const label=item.related_entity_type==='person' ? 'View person' : item.related_entity_type==='lesson' || item.type==='Knowledge' ? 'View lesson' : item.type==='Impact' ? 'View project impact' : 'View project';
  return <article className="min-w-0 overflow-hidden rounded-panel border border-border bg-card shadow-sm">
    <header className="flex items-start gap-3 px-5 pt-5">
      <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${item.system ? 'bg-secondary text-chart-2' : 'bg-primary/15 text-foreground'}`}>{item.system ? <Activity className="h-5 w-5"/> : initials}</span>
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-bold">{author}</p><time dateTime={item.created_date} className="mt-1 block text-xs text-muted-foreground">{new Date(item.created_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}{item.system && ' · Recorded in ALSight'}</time></div>
      {canRemove && <DropdownMenu><DropdownMenuTrigger asChild><button type="button" disabled={removing} aria-label={`Options for ${item.title}`} className="rounded-full p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"><MoreHorizontal className="h-5 w-5"/></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem disabled={removing} onSelect={()=>onRemove(item)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Remove update</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
    </header>
    <div className="px-5 pb-5 pt-4">
      <span className="inline-block rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-chart-2">{item.type}</span>
      <h3 className="mt-3 break-words font-heading text-lg font-bold leading-snug"><PulseText text={item.title}/></h3>
      <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-foreground"><PulseText text={item.summary}/></p>
      {!!item.images?.length && <div className={item.images.length===1 ? 'mt-4 grid grid-cols-1 gap-3' : 'mt-4 grid grid-cols-2 gap-3'}>{item.images.map(image=><PulseImage key={image.file_uri} image={image} className={item.images.length===1 ? 'aspect-[16/10] w-full' : 'aspect-square w-full'}/>)}</div>}
    </div>
    {item.href && <Link to={item.href} className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3 text-xs font-semibold text-chart-2 transition-colors hover:bg-secondary"><span>{label}</span><ArrowUpRight className="h-4 w-4 shrink-0"/></Link>}
  </article>;
}