import React from 'react';

export default function DailyBriefing({user,time}) {
 const first=user.full_name?.trim().split(' ')[0]||'there';
 return <section className="at-briefing" aria-labelledby="at-greeting"><div className="at-brief-copy"><h1 id="at-greeting">{time.greeting}, <span>{first}.</span></h1><p className="text-xs tracking-wide opacity-80">Hello to here you go</p></div></section>;
}