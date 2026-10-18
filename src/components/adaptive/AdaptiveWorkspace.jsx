import React, { useState } from 'react';
import useAdaptivePreferences from '@/components/adaptive/useAdaptivePreferences';
import useAdaptiveToday from '@/components/adaptive/useAdaptiveToday';
import useAdaptiveIntelligence from '@/components/adaptive/useAdaptiveIntelligence';
import { focuses, roleContext, rankActions, evidenceContext } from '@/components/adaptive/adaptiveEngine';
import DailyBriefing from '@/components/adaptive/DailyBriefing';
import AdaptiveTodayHero from '@/components/adaptive/AdaptiveTodayHero';
import AdaptiveWorkspaceColumns from '@/components/adaptive/AdaptiveWorkspaceColumns';
import useAdaptiveClock from '@/components/adaptive/useAdaptiveClock';
import { timeState, timeRank } from '@/components/adaptive/adaptiveTime';

import '@/components/adaptive/adaptive-time.css';
import { useWellbeing } from '@/components/wellbeing/WellbeingProvider';

import useWellbeingAnchor from '@/components/wellbeing/useWellbeingAnchor';
import AdaptiveCommandBar from '@/components/adaptive/AdaptiveCommandBar';
import AdaptiveFocusNav from '@/components/adaptive/AdaptiveFocusNav';
import AdaptiveMetrics from '@/components/adaptive/AdaptiveMetrics';

export default function AdaptiveWorkspace({user}) {
 const [commandFeedback,setCommandFeedback]=useState('');
 const {settings}=useWellbeing(),now=useAdaptiveClock(),prefs=useAdaptivePreferences(user.id),query=useAdaptiveToday(user,prefs,now),context=roleContext(user),focus=focuses.includes(prefs.config.focus)?prefs.config.focus:focuses[0],time=timeState(now,query.calendar,settings.hours);
 useWellbeingAnchor(!!query.data);
 const data=query.data,ranked=timeRank(rankActions(data?.actions||[],context,focus,time.day),time),actions=ranked.filter(a=>!prefs.config.dismissed.includes(a.key)),records=evidenceContext(actions,data?.projects||[]),intelligence=useAdaptiveIntelligence(records,time);
 return <div className="adaptive-today"><div className="at-container">
  <AdaptiveTodayHero>
   <DailyBriefing user={user} time={time}/>
   <AdaptiveCommandBar intelligence={intelligence} hasRecords={!!records.length} prefs={prefs} context={context} onFeedback={setCommandFeedback}/>
  </AdaptiveTodayHero>
  <AdaptiveFocusNav focus={focus} prefs={prefs} context={context} ready={!!data}/>
  <p id="adaptive-command-help" className={commandFeedback?'at-small my-3':'sr-only'} role="status">{commandFeedback||'Ask about loaded records or use layout commands such as pin projects and hide documents.'}</p>
  {query.isPending&&<div className="at-loading" role="status"><span className="at-spinner"/><h2>Bringing your working day into focus.</h2><p>Reading your assigned work and accessible project records…</p></div>}
  {query.error&&<div role="alert" className="at-empty"><h2>Your workspace could not be loaded.</h2><p>{query.error.message}</p><button className="at-btn" onClick={()=>query.refetch()}>Try again</button></div>}
  {data&&<><AdaptiveMetrics data={data} calendar={query.calendar}/>
   {data.warnings.length>0&&<details className="at-source-warning"><summary>Some sources are unavailable ({data.warnings.length}). This briefing is partial.</summary>{data.warnings.map(w=><p key={w}>{w}</p>)}</details>}
   <AdaptiveWorkspaceColumns user={user} time={time} query={query} data={data} actions={actions} ranked={ranked} prefs={prefs} context={context} focus={focus} intelligence={intelligence} hasRecords={!!records.length}/>
   <footer className="at-experiment-footer"><span>ALSight · Your workspace</span><span>Project intelligence covers up to 30 recent accessible active projects; insurance uses their recorded supplier links. Counts cover available source categories, not unique projects. No sample data.</span><span>Updated {new Date(data.refreshedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span></footer>
  </>}
 </div></div>;
}