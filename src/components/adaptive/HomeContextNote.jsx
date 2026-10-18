import React from 'react';
export default function HomeContextNote({data,time,calendar}) {
 if(time.resting)return null;
 const monday=new Date(time.now).getDay()===1;
 const text=!time.withinPersonal?`Your saved planning hours are ${time.workdayStart}–${time.workdayEnd}. No assumption is made that you are working now.`:calendar.loading?'Your diary is still loading; availability is not yet confirmed.':calendar.error?'Your diary is unavailable. The recorded work below is still accessible.':calendar.more?'Your diary is partial. Load remaining appointments before planning around a gap.':data.priorityTotal===0&&calendar.rows.length===0?'A quieter day in the available sources. There is no need to manufacture a next action.':calendar.rows.length>=4&&data.taskTotal>0?'Several diary commitments and assigned tasks are recorded today. Preparing for the next meeting may be a useful starting point.':monday?'A new working week: review your assigned deadlines and pending decisions before choosing a next step.':null;
 return text?<p className="at-context-note">{text}{data.warnings.length>0?' Some work sources are unavailable; this is a partial view.':''}</p>:null;
}