import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import useAdaptivePreferences from '@/components/adaptive/useAdaptivePreferences';
import useAdaptiveToday from '@/components/adaptive/useAdaptiveToday';
import useAdaptiveIntelligence from '@/components/adaptive/useAdaptiveIntelligence';
import { focuses, roleContext, rankActions, evidenceContext } from '@/components/adaptive/adaptiveEngine';
import DailyBriefing from '@/components/adaptive/DailyBriefing';
import PriorityActions from '@/components/adaptive/PriorityActions';
import WorkingDayTimeline from '@/components/adaptive/WorkingDayTimeline';
import IntelligentRecommendations from '@/components/adaptive/IntelligentRecommendations';
import ALSightIntelligencePanel from '@/components/adaptive/ALSightIntelligencePanel';
import PersonalWorkspace from '@/components/adaptive/PersonalWorkspace';
import useAdaptiveClock from '@/components/adaptive/useAdaptiveClock';
import { timeState, timeRank } from '@/components/adaptive/adaptiveTime';
import TimeAwareBriefing from '@/components/adaptive/TimeAwareBriefing';
import NextMeeting from '@/components/adaptive/NextMeeting';
import '@/components/adaptive/adaptive-time.css';
export default function AdaptiveWorkspace({user}) {
 const now=useAdaptiveClock(),prefs=useAdaptivePreferences(user.id),query=useAdaptiveToday(user,prefs,now),context=roleContext(user),focus=focuses.includes(prefs.config.focus)?prefs.config.focus:focuses[0],time=timeState(now,query.calendar,prefs.config.workday);
 const data=query.data,ranked=timeRank(rankActions(data?.actions||[],context,focus,time.day),time),actions=ranked.filter(a=>!prefs.config.dismissed.includes(a.key)),records=evidenceContext(actions,data?.projects||[]),intelligence=useAdaptiveIntelligence(records,time);
 return <div className="adaptive-today"><div className="at-container"><div className="at-experiment-bar"><Link to="/today"><ArrowLeft size={13}/> Original Today</Link><span><span className="at-live-dot"/> ALSIGHT LABS <b>Experimental workspace</b></span><button className="at-text-link" disabled={query.isFetching} onClick={()=>{query.refetch();query.calendar.refresh();}}><RefreshCw size={13} className={query.isFetching?'animate-spin':''}/> Refresh</button></div>
  <div className="at-page-title"><div><span className="at-eyebrow">THE ADAPTIVE WORKSPACE</span><h2>Today, thoughtfully organised.</h2></div><span className="at-small">Your role. Your context. Your next move.</span></div>
  <nav className="at-focus" aria-label="Workspace focus">{focuses.map(item=><button key={item} aria-pressed={focus===item} className={focus===item?'at-focus-active':''} onClick={()=>prefs.save({focus:item})}>{item}</button>)}</nav>
  {query.isPending&&<div className="at-loading" role="status"><span className="at-spinner"/><h2>Bringing your working day into focus.</h2><p>Reading your assigned work and accessible project records…</p></div>}
  {query.error&&<div role="alert" className="at-empty"><h2>Your workspace could not be loaded.</h2><p>{query.error.message}</p><button className="at-btn" onClick={()=>query.refetch()}>Try again</button></div>}
  {data&&<><DailyBriefing user={user} data={data} actions={actions} context={context} calendar={query.calendar} since={prefs.since} time={time}/>
   {time.prominent&&<NextMeeting time={time}/>}<TimeAwareBriefing time={time} calendar={query.calendar} data={data} prefs={prefs}/>{!time.prominent&&<NextMeeting time={time}/>}
   {data.warnings.length>0&&<details className="at-source-warning"><summary>Some sources are unavailable ({data.warnings.length}). This briefing is partial.</summary>{data.warnings.map(w=><p key={w}>{w}</p>)}</details>}
   {focus!=='My priorities'&&<PersonalWorkspace data={data} actions={actions} context={context} focus={focus} prefs={prefs}/>}
   <div className="at-main-grid"><div className="at-main-column"><PriorityActions actions={actions} prefs={prefs} onComplete={query.complete} moreTasks={data.moreTasks}/><IntelligentRecommendations actions={actions} intelligence={intelligence} prefs={prefs} time={time}/></div><div className="at-side-column"><WorkingDayTimeline calendar={query.calendar} actions={actions} time={time}/><ALSightIntelligencePanel intelligence={intelligence} hasRecords={!!records.length}/></div></div>
   {focus==='My priorities'&&<PersonalWorkspace data={data} actions={actions} context={context} focus={focus} prefs={prefs}/>}<footer className="at-experiment-footer"><span>ALSight Labs · An isolated product experiment</span><span>Project intelligence covers up to 30 recent accessible active projects; insurance uses their recorded supplier links. Counts cover available source categories, not unique projects. No sample data.</span><span>Updated {new Date(data.refreshedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span></footer>
  </>}
 </div></div>;
}