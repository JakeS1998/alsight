import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const formatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/London'
});

export default function HeaderClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <time dateTime={now.toISOString()} title="UK time (Europe/London)" aria-label={`UK time ${formatter.format(now)}`} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm tabular-nums text-sidebar-foreground/80">
    <Clock aria-hidden="true" className="h-4 w-4" />{formatter.format(now)}
  </time>;
}