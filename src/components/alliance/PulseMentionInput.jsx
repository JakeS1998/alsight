import React,{useRef,useState,useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {Textarea} from '@/components/ui/textarea';
import allianceRequest,{allianceError} from '@/components/alliance/allianceClient';

export default function PulseMentionInput({value,setValue,groupId}) {
  const ref=useRef(null),{user}=useAuth(),[match,setMatch]=useState(null),[term,setTerm]=useState(''),[selected,setSelected]=useState(0),[notice,setNotice]=useState('');
  useEffect(()=>{const timer=setTimeout(()=>setTerm(match?.search || ''),250);return()=>clearTimeout(timer);},[match?.search]);
  useEffect(()=>{if(!value.summary) {setMatch(null);setNotice('');}},[value.summary]);
  const query=useQuery({queryKey:['alliance-layer','mention-people',user?.id,user?.role,groupId,term],enabled:!!match && term===match.search,queryFn:()=>allianceRequest('mentionPeople',{groupId,search:term}),staleTime:30000});
  const people=term===match?.search ? [...('everyone'.startsWith(term.toLowerCase().trim()) ? [{user_id:'everyone',name:'everyone'}] : []),...(query.data?.items || [])] : [];
  const detect=target=>{
    const end=target.selectionStart,prefix=target.value.slice(0,end),found=prefix.match(/(?:^|\s)@([^@\n]{0,80})$/);
    if(!found || /^everyone(?:\s|$)/i.test(found[1]) || (value.mentions || []).some(person=>found[1]===person.name || found[1].startsWith(`${person.name} `))) {setMatch(null);return;}
    setMatch({start:end-found[1].length-1,end,search:found[1]});setSelected(0);
  };
  const choose=person=>{
    const mentions=(value.mentions || []).filter(mention=>value.summary.includes(`@${mention.name}`));
    if(person.user_id!=='everyone' && mentions.length>=10 && !mentions.some(mention=>mention.user_id===person.user_id)) {setNotice('Mention up to ten colleagues per post.');return;}
    const insertion=`@${person.name} `,summary=value.summary.slice(0,match.start)+insertion+value.summary.slice(match.end);
    if(summary.length>1500) {setNotice('Your post must be 1,500 characters or fewer.');return;}
    setValue(current=>({...current,summary,mentions:person.user_id==='everyone' || mentions.some(mention=>mention.user_id===person.user_id) ? mentions : [...mentions,person]}));
    const cursor=match.start+insertion.length;setMatch(null);setNotice('');requestAnimationFrame(()=>{ref.current?.focus();ref.current?.setSelectionRange(cursor,cursor);});
  };
  const keyDown=event=>{
    if(!match) return;
    if(event.key==='Escape') {event.preventDefault();setMatch(null);}
    else if(people.length && ['ArrowDown','ArrowUp','Enter'].includes(event.key)) {event.preventDefault();if(event.key==='Enter') choose(people[selected % people.length]);else setSelected(index=>(index+(event.key==='ArrowDown' ? 1 : -1)+people.length)%people.length);}
  };
  return <div className="relative">
    <Textarea ref={ref} id="pulse-update-text" aria-label="Write your post" aria-expanded={!!match} aria-controls={match ? 'pulse-mention-list' : undefined} aria-autocomplete="list" aria-activedescendant={match && people.length ? `pulse-mention-${selected % people.length}` : undefined} className="min-h-36 resize-y border-0 bg-transparent px-0 py-3 text-base shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-lg" value={value.summary} required maxLength={1500} onChange={event=>{setValue(current=>({...current,summary:event.target.value}));detect(event.target);}} onSelect={event=>detect(event.target)} onKeyDown={keyDown} onBlur={()=>setMatch(null)} placeholder="What’s on your mind? Type @ to mention a colleague…"/>
    {match && <div className="absolute left-0 right-0 top-full z-20 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-2 shadow-lg" id="pulse-mention-list" role="listbox" aria-label="Mention a colleague">
      {query.isFetching || term!==match.search ? <p role="status" className="p-2 text-xs text-muted-foreground">Finding colleagues…</p> : query.error ? <p role="alert" className="p-2 text-xs text-destructive">{allianceError(query.error)}</p> : !people.length ? <p className="p-2 text-xs text-muted-foreground">No matching colleagues{groupId ? ' in this group' : ''}.</p> : people.map((person,index)=><button id={`pulse-mention-${index}`} key={person.user_id} type="button" role="option" aria-selected={index===selected} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(person)} className={`flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-secondary ${index===selected ? 'bg-secondary' : ''}`}><span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold">{person.name.split(/\s+/).slice(0,2).map(part=>part[0]).join('')}</span>{person.user_id==='everyone' ? (groupId ? '@everyone · All group members' : '@everyone · All Alliance colleagues') : person.name}</button>)}
    </div>}
    {notice && <p role="alert" className="text-xs text-destructive">{notice}</p>}
  </div>;
}