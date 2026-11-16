import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isCouncilAccount } from '@/components/accounts/accountSections';

export default function AccountRegistrationDetails({ account }) {
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const normalise = value => {
    const text = String(value || '').trim().toUpperCase(), match = text.match(/^([A-Z]{2})(\d{1,6})$/);
    return /^\d{1,8}$/.test(text) ? text.padStart(8, '0') : match ? match[1] + match[2].padStart(6, '0') : text;
  };
  const number = String(account.company_number || account.ch_company_number || '').trim();
  const matching = !account.ch_company_number || normalise(account.ch_company_number) === normalise(number);
  const office = matching ? account.company_registered_office || {} : {};
  const address = ['care_of', 'po_box', 'premises', 'address_line_1', 'address_line_2', 'locality', 'region', 'postal_code', 'country']
    .map(field => office[field]).filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()).join(', ');
  if (isCouncilAccount(account) || (!number && !address)) return null;
  const copy = async value => {
    setError('');
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
    } catch {
      setCopied('');
      setError('Unable to copy. Please select and copy the details manually.');
    }
  };
  return <>
    {[['Company number', number], ['Registered address', address]].filter(([, value]) => value).map(([label, value]) => <span key={label} className={`inline-flex min-w-0 max-w-full items-center gap-1.5 ${label === 'Registered address' ? 'account-registered-address' : ''}`}>
      <strong title={value} className={`min-w-0 font-inherit ${label === 'Registered address' ? 'break-words lg:truncate' : 'break-words'}`}>{label}: {value}</strong>
      <Button type="button" variant="ghost" size="icon" onClick={() => copy(value)} aria-label={`Copy ${label.toLowerCase()}`} title={copied === value ? `${label} copied` : `Copy ${label.toLowerCase()}`} className="h-5 w-5 shrink-0 p-0 text-sidebar-foreground hover:bg-sidebar-foreground/20 hover:text-sidebar-foreground [&_svg]:size-3">
        {copied === value ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </Button>
    </span>)}
    <p role="status" className="sr-only">{copied ? 'Copied to clipboard.' : ''}</p>
    {error && <p role="alert" className="w-full text-xs text-sidebar-foreground">{error}</p>}
  </>;
}