import React from 'react';
import PriorityActions from '@/components/adaptive/PriorityActions';
import PersonalWorkspace from '@/components/adaptive/PersonalWorkspace';
import NextMeeting from '@/components/adaptive/NextMeeting';
import WorkingDayTimeline from '@/components/adaptive/WorkingDayTimeline';
import TimeAwareBriefing from '@/components/adaptive/TimeAwareBriefing';
import AdaptiveRoleContext from '@/components/adaptive/AdaptiveRoleContext';
import IntelligentRecommendations from '@/components/adaptive/IntelligentRecommendations';
import ALSightIntelligencePanel from '@/components/adaptive/ALSightIntelligencePanel';
import WrapUpChecklist from '@/components/adaptive/WrapUpChecklist';
import CarriedForwardPlan from '@/components/adaptive/CarriedForwardPlan';
import OutlookEmailSummary from '@/components/adaptive/OutlookEmailSummary';
import MeetingIntelligence from '@/components/adaptive/MeetingIntelligence';
import IETodayFeed from '@/components/adaptive/IETodayFeed';
import { IE_ROLES } from '@/components/ie/ieClient';

export default function AdaptiveWorkspaceColumns({user,time,query,data,actions,ranked,prefs,context,focus,intelligence,hasRecords}) {
 return <div className="at-flow-grid">
  <div className="at-flow-primary">
   <div className="at-flow-priorities"><PriorityActions actions={actions} prefs={prefs} onComplete={query.complete} moreTasks={data.moreTasks} resting={time.resting} weekend={!time.workingDay}/></div>
   <div className="at-flow-workspace"><PersonalWorkspace data={data} actions={actions} context={context} focus={focus} prefs={prefs}/></div>
   <div className="at-flow-mail"><OutlookEmailSummary user={user} time={time}/></div>
  </div>
  <div className="at-flow-day">
   <div className="at-flow-diary">
    {time.prominent&&<NextMeeting time={time} userId={user.id}/>}
    <WorkingDayTimeline calendar={query.calendar} actions={actions} time={time}/>
    {!time.prominent&&<NextMeeting time={time} userId={user.id}/>}
   </div>
   <div className="at-flow-briefing"><TimeAwareBriefing time={time} calendar={query.calendar} data={data} prefs={prefs}/><AdaptiveRoleContext context={context} data={data} calendar={query.calendar} since={prefs.since}/></div>
   <div className="at-flow-meetings"><MeetingIntelligence calendar={query.calendar} time={time} projects={data.projects} userId={user.id}/></div>
  </div>
  <div className="at-flow-alice">
   <aside className="at-flow-assistant" aria-label="ALICE Intelligence"><IntelligentRecommendations actions={actions} intelligence={intelligence} prefs={prefs} time={time}/><ALSightIntelligencePanel intelligence={intelligence} hasRecords={hasRecords} time={time}/></aside>
   {(time.checklistAvailable||!!prefs.config.carryForward?.items?.length)&&<div className="at-flow-planning"><WrapUpChecklist time={time} prefs={prefs} actions={ranked} onComplete={query.complete}/><CarriedForwardPlan prefs={prefs}/></div>}
   {IE_ROLES.includes(user.role)&&<div className="at-flow-ie"><IETodayFeed user={user} time={time}/></div>}
  </div>
 </div>;
}