import React from 'react';
import { useLocation } from 'react-router-dom';
import { useWellbeing } from '@/components/wellbeing/WellbeingProvider';
import useAdaptiveClock from '@/components/adaptive/useAdaptiveClock';
import useAdaptiveCalendar from '@/components/adaptive/useAdaptiveCalendar';
import useWellbeingReminders from '@/components/wellbeing/useWellbeingReminders';
import WellbeingToast from '@/components/wellbeing/WellbeingToast';
export default function GlobalWellbeingNotifications({user}) {
 const {settings}=useWellbeing(),now=useAdaptiveClock(),{pathname}=useLocation(),calendar=useAdaptiveCalendar(user,now,settings.enabled),{notification,dismiss,snooze}=useWellbeingReminders(calendar,pathname);
 return notification?<WellbeingToast key={notification.id} notification={notification} onDismiss={dismiss} onSnooze={snooze}/>:null;
}