import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { filterAll } from "@/components/data/loadAll";
import { Button } from "@/components/ui/button";
import SearchableSelect from '@/components/forms/SearchableSelect';
import ActionOwnerInput from './ActionOwnerInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormField, FormGrid, formInputClass } from "@/components/forms/PowerForm";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/portal";
import { riskIndex } from '@/components/delivery/riskRegisterColumns';
import { riskHeat } from '@/components/delivery/riskHeat';
import RiskIndexBadge from '@/components/delivery/RiskIndexBadge';
import RegisterSortHeading from '@/components/delivery/RegisterSortHeading';
import RegisterStatusDropdown from '@/components/delivery/RegisterStatusDropdown';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import { useAuth } from '@/lib/AuthContext';

const emptyForm = (columns) => Object.fromEntries(columns.map((c) => [c.key, c.type === "boolean" ? false : ""]));

const coerce = (columns, form) => {
  const out = { ...form };
  columns.forEach((c) => {
    if (c.type === "number") out[c.key] = out[c.key] === "" ? null : Number(out[c.key]);
    if (c.type === "boolean") out[c.key] = !!out[c.key];
  });
  return out;
};

export function RegisterList({ title, description, entityName, projectId, project, columns, tableColumns, sortBy = "-created_date", addLabel = "Add", preparePayload = value => value, onChanged, paginated = false, sortable = false, readOnly = false }) {
  const { user } = useAuth();
  const canUpdateStatus = !readOnly && ['admin', 'director', 'bdm', 'bsm'].includes(user?.role) && ['ProjectAction', 'ProjectDecision', 'ProjectRisk'].includes(entityName);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(columns));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(null);
  const [more, setMore] = useState(false);
  const [headingSort, setHeadingSort] = useState(null);
  const activeSort = sortable ? headingSort || sortBy : sortBy;

  const load = useCallback(async (next = null) => {
    setLoading(true); setError('');
    try {
      if (paginated) {
        const page = await base44.entities[entityName].filter({ project_id: projectId }, { sort: activeSort, limit: 50, ...(next ? { cursor: next } : {}) });
        setRows(old => next ? [...old, ...page.items] : page.items);
        setCursor(page.next_cursor); setMore(page.has_more);
      } else {
        setRows(await filterAll(base44.entities[entityName], { project_id: projectId }, activeSort));
      }
    } catch (e) { setError(e.message || 'Unable to load register.'); }
    finally { setLoading(false); }
  }, [entityName, projectId, activeSort, paginated]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm(columns)); setOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    const next = { ...emptyForm(columns), ...(entityName === 'ProjectAction' ? { owner_id: row.owner_id || '' } : {}) };
    columns.forEach((c) => { next[c.key] = row[c.key] ?? (c.type === "boolean" ? false : ""); });
    setForm(next);
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const required = columns.filter((c) => c.required);
    if (required.some((c) => !String(form[c.key] ?? "").trim())) return;
    if (columns.some(c => c.type === "action_owner" && form[c.key]?.trim() && !form[c.key].trim().includes(' '))) return;
    setSaving(true); setError('');
    try {
      const payload = preparePayload({
        ...coerce(columns, form),
        project_id: projectId,
        client_account_id: project.client_account_id || null,
        bdm_aad_id: project.bdm_aad_id || null,
      });
      if (editing) await base44.entities[entityName].update(editing.id, payload);
      else await base44.entities[entityName].create(payload);
      setOpen(false);
      if (entityName === 'ProjectAction') window.dispatchEvent(new Event('alsight-tasks-changed'));
      await load();
      onChanged?.();
    } catch (e) { setError(e.message || 'Unable to save register entry.'); }
    finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try { await base44.entities[entityName].delete(id); if (entityName === 'ProjectAction') window.dispatchEvent(new Event('alsight-tasks-changed')); await load(); onChanged?.(); }
    catch (e) { setError(e.message || 'Unable to delete register entry.'); }
  };

  const renderInput = (col) => {
    const val = form[col.key];
    if (col.type === 'calculated') return <output className="block rounded-md border border-input bg-muted px-3 py-2 text-sm">{entityName === 'ProjectRisk' && col.key === 'risk_index' ? <RiskIndexBadge index={col.calculate(form)} /> : col.calculate(form) ?? '—'}</output>;
    if (col.type === "select")
      return (
        <SearchableSelect value={val} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} className={formInputClass}>
          <option value="">—</option>
          {col.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </SearchableSelect>
      );
    if (col.type === "action_owner")
      return <ActionOwnerInput value={val} onChange={(name, id) => setForm({ ...form, [col.key]: name, ...(entityName === 'ProjectAction' ? { owner_id: id } : {}) })} />;
    if (col.type === "textarea")
      return <textarea rows={2} value={val} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} className={`${formInputClass} h-auto py-2`} />;
    if (col.type === "date")
      return <input type="date" value={val ? String(val).slice(0, 10) : ""} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} className={formInputClass} />;
    if (col.type === "number")
      return <input type="number" min={col.min} step={col.step} value={val} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} className={formInputClass} />;
    if (col.type === "boolean")
      return (
        <label className="flex h-10 items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!val} onChange={(e) => setForm({ ...form, [col.key]: e.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-primary" />
          Yes
        </label>
      );
    return <input value={val} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} className={formInputClass} />;
  };

  const display = (row, col) => {
    const v = col.type === 'calculated' ? col.calculate(row) : row[col.key];
    if (entityName === 'ProjectRisk' && col.key === 'risk_index') return <RiskIndexBadge index={v} />;
    if (col.type === "date") return formatDate(v);
    if (col.key === 'status' && col.type === 'select' && canUpdateStatus) return <RegisterStatusDropdown entityName={entityName} row={row} options={col.options} onSaved={async () => { await load(); onChanged?.(); }} />;
    if (col.type === "select") return col.options.find((o) => String(o.value) === String(v))?.label || "—";
    if (col.type === "boolean") return v ? "Yes" : "No";
    return v === '' || v == null ? '—' : v;
  };

  const shown = tableColumns ? columns.filter((c) => tableColumns.includes(c.key)) : columns;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{description}</p>
        {!readOnly && <Button type="button" variant="outline" size="sm" onClick={openAdd}><Plus className="mr-1.5 h-4 w-4" /> {addLabel}</Button>}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading && !rows.length ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-sm text-slate-500">No {title.toLowerCase()} yet.</div>
      ) : (
        <div className={entityName === 'ProjectRisk' ? 'max-h-[28rem] overflow-auto overscroll-contain rounded-xl border border-border bg-card' : 'overflow-x-auto rounded-xl border border-slate-200 bg-white'}>
          <table className="w-full text-sm">
            <thead className={entityName === 'ProjectRisk' ? 'sticky top-0 z-10 bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground' : 'bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'}>
              <tr>
                {shown.map((c) => sortable ? <RegisterSortHeading key={c.key} column={c} sort={activeSort} onSort={setHeadingSort} loading={loading} /> : <th key={c.key} className="px-3 py-2.5 whitespace-nowrap">{c.label}</th>)}
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className={entityName === 'ProjectRisk' ? riskHeat(riskIndex(row)).rowClass : 'hover:bg-slate-50'}>
                  {shown.map((c, index) => <td key={c.key} className={entityName === 'ProjectRisk' ? 'px-3 py-2.5 align-top text-foreground' : 'px-3 py-2.5 align-top text-slate-700'}>{display(row, c)}{index === 0 && <RecordUpdatedAt record={row} className="mt-2" />}</td>)}
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {!readOnly && <><button onClick={() => openEdit(row)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(row.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {more && <Button type="button" variant="outline" disabled={loading} onClick={() => load(cursor)}>{loading ? 'Loading…' : `Load more ${title.toLowerCase()} entries`}</Button>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <FormGrid>
              {columns.map((col) => (
                <div key={col.key} className={col.fullWidth ? "sm:col-span-2" : ""}>
                  <FormField label={col.label} required={col.required} help={col.help}>{renderInput(col)}</FormField>
                </div>
              ))}
            </FormGrid>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}