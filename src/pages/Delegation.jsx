import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { listAll } from "@/components/data/loadAll";
import { ROLE_LABELS, INTERNAL_ROLES, canDelegateTo, REGION_MAP, regionName } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import SearchableSelect from '@/components/forms/SearchableSelect';
import { UserCog, Search, X, Loader2, ArrowLeftRight } from "lucide-react";

export default function Delegation() {
  const { user, checkUserAuth } = useAuth();
  const role = user?.role || "client";
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [regionPick, setRegionPick] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listAll(base44.entities.Contact)
      .then(setContacts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const colleagues = useMemo(() => {
    return contacts
      .filter((c) => c.aad_id && c.portal_role && INTERNAL_ROLES.includes(c.portal_role))
      .filter((c) => c.aad_id !== user?.id)
      .filter((c) => canDelegateTo(role, c.portal_role));
  }, [contacts, role, user]);

  const filtered = useMemo(() => {
    if (!search) return colleagues;
    const s = search.toLowerCase();
    return colleagues.filter((c) =>
      (c.full_name || "").toLowerCase().includes(s) ||
      (c.company_name || "").toLowerCase().includes(s) ||
      (c.job_title || "").toLowerCase().includes(s)
    );
  }, [colleagues, search]);

  const isRDTarget = selected?.portal_role === "regional_director";

  const startCover = async () => {
    if (!selected) return;
    if (isRDTarget && !regionPick) {
      setError("Select the region you are covering.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await base44.auth.updateMe({
        delegate_of: selected.aad_id,
        delegate_of_name: selected.full_name,
        delegate_region: isRDTarget ? regionPick : null,
      });
      await checkUserAuth();
      setSelected(null);
      setRegionPick("");
    } catch (e) {
      setError(e.message || "Could not update delegation.");
    } finally {
      setSaving(false);
    }
  };

  const endCover = async () => {
    setSaving(true);
    setError("");
    try {
      await base44.auth.updateMe({ delegate_of: null, delegate_of_name: null, delegate_region: null });
      await checkUserAuth();
    } catch (e) {
      setError(e.message || "Could not update delegation.");
    } finally {
      setSaving(false);
    }
  };

  if (!INTERNAL_ROLES.includes(role)) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-slate-500">Delegation is available to internal staff only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
      </div>
    );
  }

  const covering = user?.data?.delegate_of;

  return (
    <div className="w-full max-w-none space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Delegation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cover for a colleague while they're away. You can act on behalf of someone at your level or above.
        </p>
      </div>

      {covering ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                You are covering for {user.data.delegate_of_name || "a colleague"}
              </p>
              {user.data.delegate_region && (
                <p className="mt-0.5 text-xs text-slate-600">Region: {regionName(user.data.delegate_region)}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                You can access the projects and documents they manage.
              </p>
            </div>
            <Button variant="outline" onClick={endCover} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <X className="mr-1.5 h-4 w-4" />}
              End cover
            </Button>
          </div>
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-900">Cover for a colleague</h2>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Your role: <span className="font-medium text-slate-700">{ROLE_LABELS[role]}</span>. You can cover for
            colleagues at your level or above.
          </p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, or job title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No eligible colleagues found. An administrator must set up their portal access first.
            </p>
          ) : (
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {filtered.map((c) => {
                const active = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelected(c); setRegionPick(""); setError(""); }}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{c.full_name}</p>
                      <p className="truncate text-xs text-slate-500">{c.job_title || c.company_name || ""}</p>
                    </div>
                    <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {ROLE_LABELS[c.portal_role]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selected && isRDTarget && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">Region to cover</label>
              <SearchableSelect
                value={regionPick}
                onChange={(e) => setRegionPick(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">—</option>
                {Object.entries(REGION_MAP).map(([guid, name]) => (
                  <option key={guid} value={guid}>{name}</option>
                ))}
              </SearchableSelect>
            </div>
          )}

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

          {selected && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setSelected(null); setRegionPick(""); setError(""); }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={startCover} disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="mr-1.5 h-4 w-4" />}
                Start covering
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}