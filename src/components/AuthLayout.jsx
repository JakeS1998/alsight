import React from "react";
import { ShieldCheck, FolderKanban, Building2, Truck, Users } from "lucide-react";
import Logo from "@/components/Logo";

const ROLES = [
  { icon: ShieldCheck, label: "Administrators", desc: "Full oversight of accounts, projects & documents" },
  { icon: Users, label: "Company Directors", desc: "Review requests, approve projects & sign contracts" },
  { icon: FolderKanban, label: "Development Managers", desc: "Submit and track project requests" },
  { icon: Building2, label: "Clients", desc: "View projects, contracts & invoices" },
  { icon: Truck, label: "Suppliers", desc: "Access contracts and billing for your work" },
];

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Branded panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-als-navy p-10 text-white lg:flex">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative">
          <Logo className="h-14" onDark />
        </div>

        <div className="relative max-w-sm">
          <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight">
            One secure portal for every stakeholder.
          </h2>
          <p className="mt-3 text-sm text-white/70">
            Manage projects, contracts and invoices with role-based access tailored to your relationship with Alliance Leisure.
          </p>
          <ul className="mt-8 space-y-4">
            {ROLES.map((r) => {
              const RIcon = r.icon;
              return (
                <li key={r.label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <RIcon className="h-4 w-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.label}</p>
                    <p className="text-xs text-white/60">{r.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Alliance Leisure. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="mb-8 lg:hidden">
            <Logo className="h-10" />
          </div>

          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {children}
          </div>

          {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
        </div>
      </div>
    </div>
  );
}