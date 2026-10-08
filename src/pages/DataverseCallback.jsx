import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dataverseUserRequest from '@/components/dataverse/dataverseClient';

export default function DataverseCallback() {
  const started = useRef(false);
  const [error, setError] = useState('');
  const [returnPath] = useState(() => {
    const path = sessionStorage.getItem('alsight-onboarding-return') || '';
    return path.startsWith('/onboarding?returnTo=') && !path.includes('\\') ? path : '/account-settings';
  });
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code'), state = params.get('state'), denied = params.get('error');
    window.history.replaceState(null, '', window.location.pathname);
    if (denied || !code || !state) { setError(denied === 'access_denied' ? 'Microsoft sign-in was cancelled or consent was declined.' : 'Microsoft sign-in could not be completed. Ask IT to check delegated permissions, consent and the Web redirect URI.'); return; }
    dataverseUserRequest('finish', { code, state }).then(() => {
      sessionStorage.removeItem('alsight-onboarding-return');
      window.location.replace(returnPath);
    }).catch(failure => setError(failure.message));
  }, []);
  return <main className="mx-auto max-w-xl space-y-4 rounded-panel border border-border bg-card p-6 my-12">
    <h1 className="font-heading text-xl font-semibold">Connect Dataverse</h1>
    {error ? <><p role="alert" className="text-destructive">{error}</p><Button asChild><Link to={returnPath}>{returnPath.startsWith('/onboarding') ? 'Return to setup' : 'Return to Account Settings'}</Link></Button></> : <p role="status" className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Confirming your Dataverse user access…</p>}
  </main>;
}