import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatDate } from "@/lib/portal";
import { Users, ExternalLink, Mail, Phone, BadgeCheck } from "lucide-react";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.Contact.list("-created_date", 500)
      .then(setContacts)
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? contacts.filter((c) =>
        (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.job_title || "").toLowerCase().includes(search.toLowerCase())
      )
    : contacts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Contacts</h1>
        <p className="mt-1 text-sm text-slate-500">All contacts across projects and accounts.</p>
      </div>

      <input
        type="text"
        placeholder="Search by name, company, email, or job title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
          {filtered.slice(0, 100).map((c) => (
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
                {c.identify_verified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
              </div>
              <dl className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500">
                {c.company_name && <div className="flex justify-between"><dt>Company</dt><dd className="truncate text-slate-700">{c.company_name}</dd></div>}
                {c.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> <span className="truncate">{c.email}</span></div>}
                {c.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</div>}
                {c.officer_role && <div className="flex justify-between"><dt>Officer Role</dt><dd className="text-slate-700">{c.officer_role}</dd></div>}
                {c.appointed_on && <div className="flex justify-between"><dt>Appointed</dt><dd className="text-slate-700">{formatDate(c.appointed_on)}</dd></div>}
              </dl>
              {c.officer_appointments_link && (
                <a href={c.officer_appointments_link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Companies House
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {filtered.length > 100 && (
        <p className="text-center text-xs text-slate-400">Showing first 100 of {filtered.length} contacts. Refine your search to see more.</p>
      )}
    </div>
  );
}