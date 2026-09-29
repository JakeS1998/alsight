// ─── Role labels & badges ───
export const ROLE_LABELS = {
  admin: "Administrator",
  director: "Director",
  regional_director: "Regional Director",
  bsm: "BSM",
  finance: "Finance",
  bdm: "BDM",
  client: "Client",
  supplier: "Supplier",
  project_manager: "Project Manager",
  framework_stakeholder: "Framework Stakeholder",
};

export const ROLE_BADGE_CLASS = {
  admin: "bg-slate-900 text-white",
  director: "bg-indigo-600 text-white",
  regional_director: "bg-violet-100 text-violet-700",
  bsm: "bg-teal-100 text-teal-700",
  finance: "bg-rose-100 text-rose-700",
  bdm: "bg-sky-100 text-sky-700",
  client: "bg-emerald-100 text-emerald-700",
  supplier: "bg-amber-100 text-amber-700",
  project_manager: "bg-blue-100 text-blue-700",
  framework_stakeholder: "bg-violet-100 text-violet-700",
};

// Internal staff roles (can delegate)
export const INTERNAL_ROLES = ["admin", "director", "regional_director", "bsm", "finance", "bdm"];

// Roles that see everything
export const FULL_ACCESS_ROLES = ["admin", "director", "bsm", "finance"];

// Delegation hierarchy: lower number = higher level. Top: Director, Middle: Regional Director, Bottom: the rest.
export const ROLE_LEVEL = {
  director: 0,
  admin: 0,
  regional_director: 1,
  bdm: 2,
  bsm: 2,
  finance: 2,
};

// A user may delegate to someone at their level or above (up the chain or equal).
export function canDelegateTo(myRole, targetRole) {
  if (!INTERNAL_ROLES.includes(myRole) || !INTERNAL_ROLES.includes(targetRole)) return false;
  if (myRole === "admin") return true;
  const mine = ROLE_LEVEL[myRole] ?? 99;
  const theirs = ROLE_LEVEL[targetRole] ?? 99;
  return theirs <= mine;
}

// Document types hidden from clients (supplier-side appointments, PCSA, LOI)
export const CLIENT_HIDDEN_DOC_TYPES = ["appointment_pm", "appointment_pd_cdm", "appointment_architect", "appointment_pd_br", "pcsa", "loi"];

// ─── Document type (bss_documenttype) ───
export const DOCUMENT_TYPE = {
  access_agreement: { label: "Access Agreement", code: "760820000", order: 1 },
  additional_works: { label: "Additional Works", code: "760820001", order: 2 },
  appointment_pm: { label: "Appointment – PM", code: "760820002", order: 3 },
  appointment_pd_cdm: { label: "Appointment – PD CDM", code: "760820003", order: 4 },
  appointment_architect: { label: "Appointment – Architect", code: "760820004", order: 5 },
  appointment_pd_br: { label: "Appointment – PD BR", code: "760820005", order: 6 },
  pcsa: { label: "PCSA", code: "760820006", order: 7 },
  loi: { label: "LOI", code: "760820017", order: 8 },
  other: { label: "Other", code: "", order: 99 },
};

// Reverse lookup by code
export const DOCUMENT_TYPE_BY_CODE = Object.fromEntries(
  Object.entries(DOCUMENT_TYPE).map(([k, v]) => [v.code, k])
);

// ─── Executed tri-state (bss_executed) ───
export const EXECUTED_STATUS = {
  no: { label: "No", code: "760820000", className: "bg-slate-100 text-slate-600 border-slate-200" },
  yes: { label: "Yes", code: "760820001", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  po: { label: "PO", code: "760820002", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

export const EXECUTED_BY_CODE = {
  "760820000": "no", "760820001": "yes", "760820002": "po",
};

// ─── PSO check tri-state (used in DMA and JCT checklists) ───
export const PSO_CHECK = {
  no: { label: "No", code: "760820000", className: "bg-slate-100 text-slate-600 border-slate-200" },
  yes: { label: "Yes", code: "760820001", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  na: { label: "N/A", code: "760820002", className: "bg-slate-50 text-slate-400 border-slate-200" },
  tbc: { label: "TBC", code: "760820003", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

export const PSO_CHECK_BY_CODE = {
  "760820000": "no", "760820001": "yes", "760820002": "na", "760820003": "tbc",
};

// ─── Account type ───
export const ACCOUNT_TYPE = {
  client: { label: "Client", code: "760820000" },
  supplier: { label: "Supplier", code: "760820001" },
};

export const ACCOUNT_TYPE_BY_CODE = { "760820000": "client", "760820001": "supplier" };

// ─── Form of JCT ───
export const FORM_OF_JCT = {
  design_and_build: { label: "Design & Build", code: "760820000" },
  intermediate_with_contractors_design: { label: "Intermediate with Contractor's Design", code: "760820001" },
  minor_works: { label: "Minor Works", code: "760820002" },
};

export const FORM_OF_JCT_BY_CODE = {
  "760820000": "design_and_build", "760820001": "intermediate_with_contractors_design", "760820002": "minor_works",
};

// ─── Warranty status ───
export const WARRANTY_STATUS = {
  awaiting_jct: { label: "Awaiting JCT", code: "760820000", className: "bg-slate-100 text-slate-600 border-slate-200" },
  awaiting_appointment: { label: "Awaiting Appointment", code: "760820001", className: "bg-amber-50 text-amber-700 border-amber-200" },
  in_review: { label: "In Review", code: "760820004", className: "bg-blue-50 text-blue-700 border-blue-200" },
  sent_for_seal: { label: "Sent for Seal", code: "760820005", className: "bg-violet-50 text-violet-700 border-violet-200" },
  drafted: { label: "Drafted", code: "760820011", className: "bg-sky-50 text-sky-700 border-sky-200" },
};

export const WARRANTY_STATUS_BY_CODE = {
  "760820000": "awaiting_jct", "760820001": "awaiting_appointment",
  "760820004": "in_review", "760820005": "sent_for_seal", "760820011": "drafted",
};

// ─── Warranty category ───
export const WARRANTY_CATEGORY = {
  contractor: { label: "Contractor", code: "760820000" },
  consultant: { label: "Consultant", code: "760820001" },
  other: { label: "Other", code: "760820002" },
};

export const WARRANTY_CATEGORY_BY_CODE = {
  "760820000": "contractor", "760820001": "consultant", "760820002": "other",
};

// ─── Warranty beneficiary ───
export const WARRANTY_BENEFICIARY = {
  council: { label: "Council", code: "760820000" },
};

export const WARRANTY_BENEFICIARY_BY_CODE = { "760820000": "council" };

// ─── RIBA stage ───
export const RIBA_STAGE = {
  riba_1: { label: "RIBA 1", code: "760820000" },
  riba_2: { label: "RIBA 2", code: "760820001" },
  riba_3: { label: "RIBA 3", code: "760820002" },
  riba_4: { label: "RIBA 4", code: "760820003" },
  riba_5_7: { label: "RIBA 5–7", code: "760820004" },
};

export const RIBA_STAGE_BY_CODE = {
  "760820000": "riba_1", "760820001": "riba_2", "760820002": "riba_3",
  "760820003": "riba_4", "760820004": "riba_5_7",
};

// ─── DMA PSO checklist items ───
export const DMA_PSO_ITEMS = [
  { key: "payment_terms", label: "Payment Terms", commentsKey: "payment_comments" },
  { key: "lads", label: "LADs", commentsKey: "lad_comments" },
  { key: "pcg_bond", label: "PCG / Bond", commentsKey: "pcg_comments" },
  { key: "retention", label: "Retention", commentsKey: "retention_comments" },
  { key: "framework_support_fee", label: "Framework Support Fee (FSF)", commentsKey: "fsf_comments" },
  { key: "pi_limit", label: "PI Limit", commentsKey: "pi_comments" },
  { key: "schedule2", label: "Schedule 2", commentsKey: "sch2_comments" },
  { key: "equipment", label: "Equipment Payment Terms", commentsKey: "equip_comments" },
  { key: "structural_insurance", label: "Structural Insurance", commentsKey: "si_comments" },
  { key: "risk_register", label: "Risk Register", commentsKey: "rr_comments" },
];

// ─── JCT contract checklist items ───
export const JCT_CHECKLIST_ITEMS = [
  { key: "contract_particulars", label: "Contract Particulars", commentsKey: "cp_comments" },
  { key: "cps", label: "CPs", commentsKey: "cps_comments" },
  { key: "ers", label: "ERs", commentsKey: "er_comments" },
  { key: "pci", label: "PCI", commentsKey: "pci_comments" },
  { key: "prelims", label: "Prelims", commentsKey: "prelim_comments" },
  { key: "soa", label: "SoA", commentsKey: "soa_comments" },
  { key: "rr", label: "RR", commentsKey: "rr_comments" },
  { key: "valuation_schedule", label: "Valuation Schedule", commentsKey: null },
];

// ─── Region mapping (Dataverse GUID → readable name) ───
export const REGION_MAP = {
  "c180b661-4600-f111-8407-000d3a7ed0c8": "South East & London",
  "9d15738c-4600-f111-8407-000d3a7ed0c8": "West Midlands & North Wales",
  "0cde51a5-4600-f111-8407-000d3a7ed0c8": "East",
  "a69051ab-4600-f111-8407-000d3a7ed0c8": "North",
  "336dddc3-4600-f111-8407-000d3a7ed0c8": "Scotland & Northern Ireland",
  "a7da8d48-4600-f111-8407-000d3a7ed0c8": "South West & South Wales",
  "881a8516-e30b-f111-8407-7ced8d390a61": "Insights & Engagement",
  "00947699-c808-f111-8407-000d3ad60c67": "Marketing & Framework",
  "ff937699-c808-f111-8407-000d3ad60c67": "Finance",
  "217d68a9-de01-f111-8407-6045bd11d101": "Business Support Services",
  "2780e6dc-c808-f111-8406-6045bdd07c35": "Executive",
};

export function regionName(guid) {
  if (!guid) return null;
  return REGION_MAP[guid] || guid;
}

export const REGION_OPTIONS = Object.entries(REGION_MAP).map(([value, label]) => ({ value, label }));

// ─── Role helpers ───
export function isInternal(role) {
  return INTERNAL_ROLES.includes(role);
}

// ─── Formatting helpers ───
export function formatCurrency(n) {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

export function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " " + date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// Convert Dataverse date format "2026-09-22 00:00:00.0000000" to ISO
export function cleanDate(d) {
  if (!d || typeof d !== "string") return null;
  const trimmed = d.trim();
  if (!trimmed) return null;
  if (trimmed.includes(" ")) return trimmed.replace(" ", "T").replace(/\.\d+$/, "") + "Z";
  return trimmed;
}

export function num(v) {
  if (!v || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export function bool(v) {
  return v === "True" || v === "true" || v === "1";
}