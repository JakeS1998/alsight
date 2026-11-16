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
  const information = [matching && account.company_name || account.name, number && `Company number: ${number}`, address && `Registered address: ${address}`].filter(Boolean).join('\n');
  const copy = async () => {
    setError('');
    try {
      await navigator.clipboard.writeText(information);
      setCopied(information);
    } catch {
      setCopied('');
      setError('Unable to copy. Please select and copy the details manually.');
    }
  };
  const success = copied === information;
  return <>
    {number && <span className="break-words">Company number: {number}</span>}
    {address && <span className="min-w-0 max-w-full break-words">Registered address: {address}</span>}
    <Button type="button" variant="outline" size="sm" onClick={copy} aria-label="Copy company name, number and registered address" title="Copy company details" className="h-6 border-sidebar-foreground/25 bg-sidebar-foreground/10 px-2 text-xs text-sidebar-foreground hover:bg-sidebar-foreground/20 hover:text-sidebar-foreground">
      {success ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{success ? 'Copied' : 'Copy'}
    </Button>
    <span role="status" className="sr-only">{success ? 'Company details copied to clipboard.' : ''}</span>
    {error && <p role="alert" className="w-full text-xs text-sidebar-foreground">{error}</p>}
  </>;
}