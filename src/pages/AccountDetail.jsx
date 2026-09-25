import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatDate, formatCurrency, regionName } from "@/lib/portal";
import { DocTypeBadge, ExecutedBadge, WarrantyStatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, MapPin, ExternalLink, Users, FolderKanban, FileText, ShieldCheck, Mail, Phone, Gavel } from "lucide-react";

export default function AccountDetail() {
  const { accountId } = useParams();
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [docs, setDocs] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [jcts, setJcts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const acc = await base44.entities.Account.get(accountId);
        setAccount(acc);
        const dvId = acc.dataverse_id;
        const companyNo = acc.company_number;

        const [c, p, d, w, j] = await Promise.all([
          companyNo
            ? base44.entities.Contact.filter({ company_number: companyNo }, "-created_date", 500).catch(() => [])
            : [],
          base44.entities.Project.filter({ $or: [{ client_account_id: dvId }, { account_id: dvId }] }, "-created_date", 500).catch(() => []),
          base44.entities.LegalDocument.filter({ account_id: dvId, status: { $in: ["active", "inactive"] } }, "-created_date", 500).catch(() => []),
          base44.entities.Warranty.filter({ $or: [{ account_id: dvId }, { supplier_id: dvId }] }, "-created_date", 500).catch(() => []),
          base44.entities.JCT.filter({ $or: [{ account_id: dvId }, { contractor_id: dvId }] }, "-created_date", 500).catch(() => []),
        ]);

        setContacts(c);
        setProjects(p);
        setDocs(d);
        setWarranties(w);
        setJcts(j);
      } finally {
        setLoading(false);
      }
    })();
  }, [accountId]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>;
  }

  if (!account) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-slate-500">Account not found.</p>
        <Link to="/accounts" className="mt-3 inline-block text-sm text-primary hover:underline">Back to Accounts</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/accounts" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to Accounts
      </Link>

      {/* Account header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white">
              {account.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">{account.name}</h1>
              <span className="text-sm uppercase tracking-wide text-slate-400">{account.account_type}</span>
            </div>
          </div>
          {account.uklf_approved && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">UKLF Approved</span>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Company Number" value={account.company_number} />
          <Detail label="Company Status" value={account.company_status} />
          <Detail label="Incorporated" value={formatDate(account.date_of_incorporation)} />
          <Detail label="Region" value={regionName(account.region)} />
        </div>
        {account.address_postcode && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4" />
            {[account.address_line1, account.address_city, account.address_county, account.address_postcode].filter(Boolean).join(", ")}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {account.email && <a href={`mailto:${account.email}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Mail className="h-4 w-4" /> {account.email}</a>}
          {account.phone && <span className="flex items-center gap-1 text-sm text-slate-500"><Phone className="h-4 w-4" /> {account.phone}</span>}
          {account.ch_links_self && <a href={account.ch_links_self} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="h-4 w-4" /> Companies House</a>}
          {account.sharepoint_folder && <a href={account.sharepoint_folder} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="h-4 w-4" /> SharePoint</a>}
        </div>
      </div>

      {/* Linked Contacts */}
      <Section icon={Users} title="Linked Contacts" count={contacts.length}>
        {contacts.length === 0 ? <Empty text="No contacts linked to this account" /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{c.full_name}</p>
                {c.job_title && <p className="text-xs text-slate-500">{c.job_title}</p>}
                {c.email && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" /> {c.email}</p>}
                {c.phone && <p className="text-xs text-slate-500">{c.phone}</p>}
                {c.officer_role && <p className="mt-1 text-xs text-slate-400">Officer: {c.officer_role}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Related Projects */}
      <Section icon={FolderKanban} title="Related Projects" count={projects.length}>
        {projects.length === 0 ? <Empty text="No projects linked to this account" /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="group rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-2">
                  {p.project_number && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{p.project_number}</span>}
                  {p.live_project && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Live</span>}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900 group-hover:text-primary">{p.name}</p>
                <p className="text-xs text-slate-500">{formatCurrency(p.estimated_value)}</p>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Legal Documents */}
      <Section icon={FileText} title="Legal Documents" count={docs.length}>
        {docs.length === 0 ? <Empty text="No legal documents for this account" /> : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Document ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Executed</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Drafted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{d.document_id}</td>
                    <td className="px-4 py-3"><DocTypeBadge type={d.document_type} /></td>
                    <td className="px-4 py-3"><ExecutedBadge status={d.executed} /></td>
                    <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">{formatDate(d.drafted_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Warranties & JCTs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={ShieldCheck} title="Warranties" count={warranties.length}>
          {warranties.length === 0 ? <Empty text="No warranties" /> : (
            <div className="space-y-2">
              {warranties.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{w.warranty_id}</p>
                    <p className="truncate text-xs text-slate-500">{w.services || "—"}</p>
                  </div>
                  <WarrantyStatusBadge status={w.warranty_status} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={Gavel} title="JCT Contracts" count={jcts.length}>
          {jcts.length === 0 ? <Empty text="No JCT contracts" /> : (
            <div className="space-y-2">
              {jcts.map((j) => (
                <div key={j.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{j.document_id}</p>
                    <p className="truncate text-xs text-slate-500">{j.form_of_jct || "—"}</p>
                  </div>
                  <ExecutedBadge status={j.executed} />
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{count}</span>
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || "—"}</p>
    </div>
  );
}

function Empty({ text }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-slate-400">{text}</div>;
}