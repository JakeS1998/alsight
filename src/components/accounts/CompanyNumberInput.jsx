import React from 'react';
export default function CompanyNumberInput({ value, onChange }) {
  return <label className="block text-sm">Company Number
    <input className="mt-1 w-full rounded-lg border border-input bg-card p-2" value={value} maxLength={8} pattern="([0-9]{1,8}|[A-Za-z]{2}[0-9]{1,6})" title="Use up to eight digits, or a two-letter prefix followed by up to six digits." onChange={event => onChange(event.target.value.trim().toUpperCase())} aria-describedby="company-number-guidance" />
    <span id="company-number-guidance" className="mt-2 block text-xs leading-relaxed text-muted-foreground">Use the registered Companies House number, not the business name or VAT number. Leading zeros are restored on refresh. Confirm this identifier before importing registry information.</span>
  </label>;
}