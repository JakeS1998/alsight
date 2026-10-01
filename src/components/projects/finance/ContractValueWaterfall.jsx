import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { formatCurrency } from '@/lib/portal';

const NAVY = '#131f3c';
const MUTED_BLUE = '#9199ae';
const ORANGE = '#fd8c3f';
const PEACH = '#ffcfb8';

function compactGBP(v) {
  if (v == null) return '£0';
  const abs = Math.abs(v);
  if (abs >= 1e6) return `£${(v / 1e6).toFixed(1)}m`;
  if (abs >= 1e3) return `£${(v / 1e3).toFixed(0)}k`;
  return `£${v.toFixed(0)}`;
}

function signedGBP(v) {
  if (v == null || v === 0) return '£0';
  return (v > 0 ? '+' : '-') + compactGBP(Math.abs(v));
}

export default function ContractValueWaterfall({ summary }) {
  const data = useMemo(() => {
    const cs = summary.contractSum ?? 0;
    const add = summary.approvedAdditions || 0;
    const om = summary.approvedOmissions || 0;
    const ccv = summary.currentContractValue ?? (cs > 0 ? cs + add - om : 0);
    const pend = summary.pendingVariations || 0;
    const risk = summary.riskAllowance || 0;
    const ffc = summary.forecastFinalCost ?? (ccv + pend + risk);

    return [
      { name: 'Original\nContract Sum', base: 0, value: cs, fill: NAVY, label: compactGBP(cs), kind: 'total' },
      { name: 'Approved\nVariations', base: cs, value: add, fill: ORANGE, label: signedGBP(add), kind: 'increase' },
      { name: 'Approved\nOmissions', base: cs + add - om, value: om, fill: PEACH, label: signedGBP(-om), kind: 'decrease' },
      { name: 'Current\nContract Value', base: 0, value: ccv, fill: NAVY, label: compactGBP(ccv), kind: 'total' },
      { name: 'Pending\nVariations', base: ccv, value: pend, fill: ORANGE, label: signedGBP(pend), kind: 'increase' },
      { name: 'Risk\nAllowance', base: ccv + pend, value: risk, fill: MUTED_BLUE, label: compactGBP(risk), kind: 'risk' },
      { name: 'Forecast\nFinal Cost', base: 0, value: ffc, fill: MUTED_BLUE, label: compactGBP(ffc), kind: 'total-final' },
    ];
  }, [summary]);

  const yMax = useMemo(() => {
    const max = Math.max(...data.map(d => d.base + d.value), 0);
    return Math.ceil(max / 1e6) * 1e6 + 1e6;
  }, [data]);

  const hasData = summary.contractSum != null || summary.currentContractValue != null || summary.forecastFinalCost != null;

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className="text-sm text-slate-400">Contract value data not yet recorded.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h3 className="font-heading text-base font-semibold text-[#0d1117]">Contract value waterfall</h3>
          <p className="text-xs text-[#6e737c]">Shows how the contract value has changed from the original contract sum to the current forecast final cost.</p>
        </div>
      </div>
      <div className="mt-2 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 28, right: 8, left: 0, bottom: 8 }} barCategoryGap="22%">
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6e737c' }} tickLine={false} axisLine={false} interval={0} />
            <YAxis
              tick={{ fontSize: 10, fill: '#6e737c' }}
              tickLine={false}
              axisLine={false}
              width={48}
              domain={[0, yMax]}
              tickFormatter={(v) => compactGBP(v)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(value, name, props) => {
                if (name === 'base') return null;
                const d = props.payload;
                if (d.kind === 'decrease') return [signedGBP(-d.value), d.name.replace('\n', ' ')];
                if (d.kind === 'increase') return [signedGBP(d.value), d.name.replace('\n', ' ')];
                return [compactGBP(d.value), d.name.replace('\n', ' ')];
              }}
            />
            <Bar dataKey="base" stackId="a" radius={0}>
              {data.map((d, i) => <Cell key={i} fill="transparent" />)}
            </Bar>
            <Bar dataKey="value" stackId="a" radius={[3, 3, 0, 0]} minPointSize={2}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
              <LabelList
                dataKey="label"
                position="top"
                offset={6}
                style={{ fontSize: 10, fontWeight: 600, fill: '#0d1117' }}
                formatter={(val, entry) => {
                  const d = entry?.payload;
                  if (!d) return val;
                  if (d.kind === 'decrease') return signedGBP(-d.value);
                  if (d.kind === 'increase') return signedGBP(d.value);
                  return compactGBP(d.value);
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}