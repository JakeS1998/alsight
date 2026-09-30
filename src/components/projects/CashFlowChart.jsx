import React, { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/portal';

export default function CashFlowChart({ entries }) {
  const data = useMemo(() => {
    const byDate = new Map();
    entries.forEach(({ date, type, amount }) => {
      if (!date || !['received', 'spent'].includes(type)) return;
      const row = byDate.get(date) || { date, received: 0, spent: 0 };
      row[type] += Number(amount) || 0;
      byDate.set(date, row);
    });
    let received = 0, spent = 0;
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).map(row => {
      received += row.received;
      spent += row.spent;
      return { date: row.date, received, spent, balance: received - spent };
    });
  }, [entries]);

  if (!data.length) return <p className="py-10 text-center text-sm text-muted-foreground">No paid invoices or dated spending recorded for this project yet.</p>;
  return <div className="h-72 w-full" role="img" aria-label="Cumulative client payments, spending and net cash balance over time">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tickFormatter={d => new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })} tick={{ fontSize: 11 }} minTickGap={25} />
        <YAxis tickFormatter={v => `£${Intl.NumberFormat('en-GB', { notation: 'compact' }).format(v)}`} tick={{ fontSize: 11 }} width={68} />
        <Tooltip labelFormatter={d => new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { dateStyle: 'medium' })} formatter={(v, name) => [formatCurrency(v), name]} />
        <Legend />
        <Line type="linear" dataKey="received" name="Payments received" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        <Line type="linear" dataKey="spent" name="Money out" stroke="hsl(var(--chart-3))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        <Line type="linear" dataKey="balance" name="Net balance" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}