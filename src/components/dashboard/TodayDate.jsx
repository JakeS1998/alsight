import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { plannerDay } from '@/components/dashboard/plannerDates';
export default function TodayDate() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const label = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(now));
  return <time dateTime={plannerDay(now)} className="mt-3 flex items-start gap-2 text-base font-bold text-chart-2"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0" />{label}</time>;
}