export const ROLE_LABELS = {
  admin: "Administrator",
  company_director: "Company Director",
  development_manager: "Development Manager",
  client: "Client",
  supplier: "Supplier",
};

export const ROLE_BADGE_CLASS = {
  admin: "bg-slate-900 text-white",
  company_director: "bg-indigo-600 text-white",
  development_manager: "bg-sky-100 text-sky-700",
  client: "bg-emerald-100 text-emerald-700",
  supplier: "bg-amber-100 text-amber-700",
};

export const PROJECT_STATUS = {
  requested: { label: "Requested", className: "bg-slate-100 text-slate-700 border-slate-200" },
  in_review: { label: "In Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", className: "bg-blue-50 text-blue-700 border-blue-200" },
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label: "Completed", className: "bg-violet-50 text-violet-700 border-violet-200" },
  rejected: { label: "Rejected", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const CONTRACT_STATUS = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  sent: { label: "Sent", className: "bg-amber-50 text-amber-700 border-amber-200" },
  signed: { label: "Signed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expired: { label: "Expired", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const INVOICE_STATUS = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  sent: { label: "Sent", className: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue: { label: "Overdue", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export function formatCurrency(n) {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

export function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}