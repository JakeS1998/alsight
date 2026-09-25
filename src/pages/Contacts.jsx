import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { listAll } from "@/components/data/loadAll";
import { useAuth } from "@/lib/AuthContext";
import { formatDate, ROLE_LABELS } from "@/lib/portal";
import { Users, ExternalLink, Mail, Phone, BadgeCheck, UserPlus, ShieldCheck } from "lucide-react";
import { InviteUserDialog } from "@/components/contacts/InviteUserDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ROLE_BADGE = {
  admin: "bg-slate-900 text-white border-slate-700",
  director: "bg-indigo-50 text-indigo-700 border-indigo-200",
  regional_director: "bg-violet-50 text-violet-700 border-violet-200",
  bsm: "bg-teal-50 text-teal-700 border-teal-200",
  finance: "bg-rose-50 text-rose-700 border-rose-200",
  bdm: "bg-sky-50 text-sky-700 border-sky-200",
  client: "bg-emerald-50 text-emerald-700 border-emerald-200",
  supplier: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function Contacts() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteContact, setInviteContact] = useState(null);

  useEffect(() => {
    Promise.all([
      listAll(base44.entities.Contact),
      isAdmin ? listAll(base44.entities.User).catch(() => []) : Promise.resolve([]),
      isAdmin ? listAll(base44.entities.Account, "-name").catch(() => []) : Promise.resolve([]),
    ]).then(([c, u, a]) => {
      setContacts(c);
      setUsers(u);
      setAccounts(a);
    }).finally(() => setLoading(false));
  }, [isAdmin]);

  const userByEmail = useMemo(() => {
    const map = {};
    users.forEach((u) => { if (u.email) map[u.email.toLowerCase()] = u; });
    return map;
  }, [users]);

  const filtered = search
    ? contacts.filter((c) =>
        (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.job_title || "").toLowerCase().includes(search.toLowerCase())
      )
    : contacts;

  const refreshUsers = () => {
    listAll(base44.entities.User)
      .then(setUsers)
      .catch(() => {});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Contacts</h1>
        <p className="mt-1 text-sm text-slate-500">
          All contacts across projects and accounts.
          {isAdmin && " Click “Set Up Access” to invite contacts and assign portal roles."}
        </p>
      </div>

      <input
        type="text"
        placeholder="Search by name, company, email, or job title..."
        value={search}
        onInput={(e) => setSearch(e.currentTarget.value)}
        className="h-10 w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No contacts found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const linkedUser = c.email ? userByEmail[c.email.toLowerCase()] : null;
            return (
              <div key={c.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {c.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{c.full_name}</p>
                      {c.job_title && <p className="truncate text-xs text-slate-500">{c.job_title}</p>}
                    </div>
                  </div>
                  {c.identify_verified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} aria-label="Identity verified" className="inline-flex shrink-0 cursor-help">
                            <BadgeCheck className="h-4 w-4 text-blue-500" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Identity verified</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {linkedUser && (
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[linkedUser.role] || ROLE_BADGE.client}`}>
                      <ShieldCheck className="h-3 w-3" /> {ROLE_LABELS[linkedUser.role] || linkedUser.role}
                    </span>
                  </div>
                )}

                <dl className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500">
                  {c.company_name && <div className="flex justify-between"><dt>Company</dt><dd className="truncate text-slate-700">{c.company_name}</dd></div>}
                  {c.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> <span className="truncate">{c.email}</span></div>}
                  {c.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</div>}
                  {c.officer_role && <div className="flex justify-between"><dt>Officer Role</dt><dd className="text-slate-700">{c.officer_role}</dd></div>}
                  {c.appointed_on && <div className="flex justify-between"><dt>Appointed</dt><dd className="text-slate-700">{formatDate(c.appointed_on)}</dd></div>}
                </dl>

                <div className="mt-4 flex items-center justify-between">
                  {c.officer_appointments_link ? (
                    <a href={c.officer_appointments_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Companies House
                    </a>
                  ) : <span />}

                  {isAdmin && (
                    <button
                      onClick={() => setInviteContact(c)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        linkedUser
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {linkedUser ? <ShieldCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                      {linkedUser ? "Manage Access" : "Set Up Access"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InviteUserDialog
        open={!!inviteContact}
        onOpenChange={(v) => !v && setInviteContact(null)}
        contact={inviteContact}
        accounts={accounts}
        existingUser={inviteContact?.email ? userByEmail[inviteContact.email.toLowerCase()] : null}
        onDone={(email) => {
          if (inviteContact && email) setContacts((current) => current.map((c) => c.id === inviteContact.id ? { ...c, email } : c));
          refreshUsers();
        }}
      />
    </div>
  );
}