import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/portal';
import { Trash2 } from 'lucide-react';

export default function CashFlowEntries({ entries, onAdd, onDelete }) {
  const [date, setDate] = useState('');
  const [type, setType] = useState('received');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await onAdd({ date, type, amount: Number(amount) });
      setAmount('');
    } catch { setError('Could not save the transaction. Please try again.'); }
    finally { setBusy(false); }
  };
  const remove = async id => {
    setError(''); setDeleting(id);
    try { await onDelete(id); }
    catch { setError('Could not remove the transaction. Please try again.'); }
    finally { setDeleting(null); }
  };
  return <div className="space-y-4">
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="text-xs font-medium text-foreground">Date<Input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-40" /></label>
      <label className="text-xs font-medium text-foreground">Transaction<select value={type} onChange={e => setType(e.target.value)} className="mt-1 flex h-9 w-48 rounded-md border border-input bg-background px-3 text-sm"><option value="received">Received from council</option><option value="spent">Spent</option></select></label>
      <label className="text-xs font-medium text-foreground">Amount (£)<Input type="number" min="0.01" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-40" /></label>
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add transaction'}</Button>
    </form>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {entries.length > 0 && <div className="max-h-48 overflow-y-auto divide-y divide-border border-t border-border">
      {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map(item => <div key={item.id} className="flex items-center gap-3 py-2 text-sm">
        <span className="w-28 shrink-0 text-muted-foreground">{formatDate(item.date)}</span>
        <span className="min-w-0 flex-1">{item.type === 'received' ? 'Received from council' : 'Spent'}</span>
        <span className="font-semibold">{formatCurrency(item.amount)}</span>
        <button type="button" onClick={() => remove(item.id)} disabled={!!deleting || busy} aria-label="Remove transaction" className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
      </div>)}
    </div>}
  </div>;
}