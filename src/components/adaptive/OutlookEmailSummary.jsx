import React from 'react';
import { Mail } from 'lucide-react';
import useOutlookUnread from '@/components/adaptive/useOutlookUnread';
import OutlookReconnect from '@/components/adaptive/OutlookReconnect';
import OutlookEmailRow from '@/components/adaptive/OutlookEmailRow';
import BriefingResult from '@/components/adaptive/BriefingResult';
export default function OutlookEmailSummary({user,time}) {
 const {query,summary,auth,cursor,next,latest,refresh,reconnect}=useOutlookUnread(user,time),data=query.data;
 const failure=query.error||summary.error;
 return <section className="at-panel min-w-0" aria-labelledby="adaptive-mail-title"><header className="at-section-head"><div><span className="at-eyebrow">YOUR PRIVATE OUTLOOK</span><h2 id="adaptive-mail-title">Today’s unread emails</h2></div><Mail size={22}/></header><p className="at-section-note">{time.date} · {time.timezone}. Read-only, ten messages per page.</p>
  {(auth.isPending||auth.data===true&&query.isPending)&&<p className="at-small mt-4" role="status">Reading today’s unread messages…</p>}
  {(auth.data===false||query.error)&&<div className="mt-4 space-y-3"><p className="at-small">{query.error?.message||'Sign in to read your own Outlook mailbox.'}</p><p className="at-small">Email access requires Microsoft Mail.Read permission. If Microsoft denies access, renew the connection or ask IT to approve it.</p><OutlookReconnect onConnected={reconnect}/><button className="at-text-link" disabled={query.isFetching} onClick={refresh}>Try again</button></div>}
  {auth.error&&<p role="alert" className="at-small mt-4">{auth.error.message}</p>}
  {auth.data===true&&!query.error&&data&&<><div className="at-item-actions mt-4"><button className="at-btn at-btn-primary" disabled={!data.messages.length||summary.isPending||query.isFetching} onClick={()=>summary.mutate()}>{summary.isPending?'Summarising…':'Summarise this page'}</button><button className="at-text-link" disabled={query.isFetching||summary.isPending} onClick={refresh}>Refresh unread emails</button></div><p className="at-small mt-2">Summaries use AI integration credits and message previews only. Messages stay unread; nothing is sent or saved to project records.</p>{summary.isPending&&<p role="status" className="at-small mt-3">Creating your summary…</p>}{data.briefing&&<BriefingResult briefing={data.briefing}/>}<ul className="mt-4">{data.messages.map(message=><OutlookEmailRow key={message.id} message={message}/>)}</ul>{!data.messages.length&&<p className="at-small mt-4">No unread emails received today were found{cursor?' on this page':''}.</p>}<div className="at-item-actions mt-3">{cursor&&<button className="at-btn" disabled={summary.isPending} onClick={latest}>Back to latest</button>}{data.next_cursor&&<button className="at-btn" disabled={summary.isPending} onClick={next}>Next ten emails</button>}</div></>}
  {failure&&summary.error&&<p role="alert" className="mt-3 text-sm text-destructive">{summary.error.message}</p>}
 </section>;
}