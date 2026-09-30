import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import BriefSourceLink from '@/components/projects/BriefSourceLink';

export default function ProjectBriefHistory({ fileUri }) {
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setBrief(null); setError('');
    (async () => {
      try {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
        const response = await fetch(signed_url);
        if (!response.ok) throw new Error('Unable to load saved brief.');
        const saved = await response.json();
        if (active) setBrief(saved);
      } catch { if (active) setError('The saved brief could not be loaded. Please reopen this project to try again.'); }
    })();
    return () => { active = false; };
  }, [fileUri]);
  return <details className="rounded-xl border border-border bg-card p-5">
    <summary className="cursor-pointer font-semibold">Originating ALICE brief</summary>
    {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : !brief ? <p role="status" className="mt-3 text-sm text-muted-foreground">Loading saved brief…</p> : <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">Submitted by {brief.requestor_name || 'requestor'} on {new Date(brief.created_at).toLocaleString('en-GB')}</p>
      {!!brief.sources?.length && <div className="space-y-2"><h4 className="text-sm font-semibold">Source documents</h4>{brief.sources.map((source, index) => <BriefSourceLink key={index} source={source} />)}</div>}
      <div className="max-h-96 space-y-3 overflow-y-auto" aria-label="Saved project brief conversation">{brief.messages?.map((message, index) => <div key={index} className="rounded-lg bg-muted p-3 text-sm"><p className="mb-1 font-semibold">{message.role === 'user' ? brief.requestor_name || 'Requestor' : 'ALICE'}</p><p className="whitespace-pre-wrap">{message.content}</p></div>)}</div>
    </div>}
  </details>;
}