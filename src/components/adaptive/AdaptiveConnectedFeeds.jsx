import React from 'react';
import { IE_ROLES } from '@/components/ie/ieClient';
import OutlookEmailSummary from '@/components/adaptive/OutlookEmailSummary';
import MeetingIntelligence from '@/components/adaptive/MeetingIntelligence';
import IETodayFeed from '@/components/adaptive/IETodayFeed';
export default function AdaptiveConnectedFeeds({user,time,calendar,projects}) {
 return <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-2"><OutlookEmailSummary user={user} time={time}/><MeetingIntelligence calendar={calendar} time={time} projects={projects} userId={user.id}/>{IE_ROLES.includes(user.role)&&<IETodayFeed user={user} time={time}/>}</div>;
}