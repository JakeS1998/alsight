export default function workingDayMessage(time,calendar) {
 if(time.resting)return time.early&&time.workingDay?'Your workspace is ready whenever you need it. Remember to make time for yourself too. Non-urgent work can wait until you are ready.':!time.workingDay?'It is the weekend. Make some room for yourself; non-urgent work will still be here on Monday. ALS Hub remains fully available if something genuinely cannot wait.':'It is outside the flexible working window. Consider leaving non-urgent work for your next working day and making time to rest. Your records and ALICE are still here if you need them.';
 if(calendar.loading)return 'Your diary is loading. Leave space for breaks as you plan your day.';
 if(calendar.error)return 'Outlook is unavailable. Use the accessible records here and check your diary before committing to more work.';
 if(calendar.more)return 'The diary is partial; load remaining events before relying on a gap.';
 if(time.current)return 'A scheduled meeting is underway. Keep the relevant work to hand; break reminders will wait.';
 if(time.allDay)return 'An all-day event is recorded. Confirm your availability in Outlook.';
 if(time.available!==null)return `There is a ${time.available}-minute calendar gap before your next timed event. Consider a short break or a realistic next step; task effort is not recorded.`;
 return time.checklistAvailable?'The wrap-up checklist is ready when useful. This is preparation, not an instruction to stop; flexible working until 18:30 is normal.':'Choose a realistic next step and leave space for breaks. Flexible working from 07:30 to 18:30 is normal, even outside the standard 09:00–17:00 day.';
}