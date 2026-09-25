import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { filterAll } from "@/components/data/loadAll";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormField, FormGrid, formInputClass } from "@/components/forms/PowerForm";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/portal";

const emptyForm = (columns) => Object.fromEntries(columns.map((c) => [c.key, c.type === "boolean" ? false : ""]));

const coerce = (columns, form) => {
  const out = { ...form };
  columns.forEach((c) => {
    if (c.type === "number") out[c.key] = out[c.key] === "" ? null : Number(out[c.key]);
    if (c.type === "boolean") out[c.key] = !!out[c.key];
  });
  return out;
};

export function RegisterList({ title, description, entityName, projectId, project, columns, tableColumns, sortBy = "-created_date", addLabel = "Add" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(columns));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await filterAll(base44.entities[entityName], { project_id: projectId }, sortBy).catch(() => []);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [entityName, projectId, sortBy]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm(columns)); setOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    const next = emptyForm(columns);
    columns.forEach((c) => { next[c.key] = row[c.key] ?? (c.type === "boolean" ? false : ""); });
    setForm(next);
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const required = columns.filter((c) => c.required);
    if (required.some((c) => !String(form[c.key] ?? "").trim())) return;
    setSaving(true);
    try {
      const payload = {
        ...coerce(columns, form),
        project_id: projectId,
        client_account_id: project.client_account_id || null,
        bdm_aad_id: project.bdm_aad_id || null,
      };
      if (editing) await base44.entities[entityName].update(editing.id, payload);
      else await base44.entities[entityName].create(payload);
      setOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => { await base44.entities[entityName].delete(id); load(); };

  const renderInput = (col) => {
    const val = form[col.key];
    if (col.type === "select")
      return (
        <select value={val} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} className={formInputClass}>
          <option value="">—</option>
          {col.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    if (col.type === "textarea")
      return <textarea rows={2} value={val} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} className={`${formInputClass} h-auto py-2`} />;
    if (col.type === "date")
      return <input type="date" value={val ? String(val).slice(0, 10) : ""} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} className={formInputClass} />;
    if (col.type === "number")
      return <input type="number" value={val} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} className={formInputClass} />;
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
    const v = row[col.key];
    if (col.type === "date") return formatDate(v);
    if (col.type === "select") return col.options.find((o) => o.value === v)?.label || "—";
    if (col.type === "boolean") return v ? "Yes" : "No";
    return v || "—";
  };

  const shown = tableColumns ? columns.filter((c) => tableColumns.includes(c.key)) : columns;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{description}</p>
        <Button type="button" variant="outline" size="sm" onClick={openAdd}><Plus className="mr-1.5 h-4 w-4" /> {addLabel}</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-sm text-slate-500">No {title.toLowerCase()} yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {shown.map((c) => <th key={c.key} className="px-3 py-2.5 whitespace-nowrap">{c.label}</th>)}
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {shown.map((c) => <td key={c.key} className="px-3 py-2.5 align-top text-slate-700">{display(row, c)}</td>)}
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(row)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(row.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <FormGrid>
              {columns.map((col) => (
                <div key={col.key} className={col.fullWidth ? "sm:col-span-2" : ""}>
                  <FormField label={col.label} required={col.required}>{renderInput(col)}</FormField>
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