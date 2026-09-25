import React from "react";
import { BarChart3, Users, FileText, Leaf } from "lucide-react";
import Logo from "@/components/Logo";

const HERO_IMAGE =
  "https://allianceleisure.co.uk/wp-content/uploads/2025/10/Wilsons-Cath-Thom-Open-Day-101025-31.jpg";

const FEATURES = [
  { icon: BarChart3, title: "Live Project Insight", text: "Track progress, risks and key milestones in real time." },
  { icon: Users, title: "Better Collaboration", text: "Bring teams, suppliers and stakeholders together." },
  { icon: FileText, title: "Smarter Decisions", text: "Data-driven insight for confident decision making." },
  { icon: Leaf, title: "Lasting Impact", text: "Delivering buildings and communities that make a difference." },
];

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Hero panel (2/3) */}
      <div className="relative hidden lg:block lg:w-2/3 overflow-hidden bg-als-navy">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-als-navy/90 via-als-navy/55 to-als-navy/90" />
        <div className="relative h-full flex flex-col justify-between p-12 xl:p-16">
          <Logo className="h-12" onDark />
          <div className="max-w-xl">
            <h2 className="font-heading text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white">
              A clearer view for a brighter tomorrow.
            </h2>
            <p className="mt-4 text-base text-white/80 leading-relaxed">
              Real-time project insight, stronger collaboration and smarter decisions — for a more
              resilient built environment.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 max-w-lg">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/70 leading-snug">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Login card (1/3) */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-slate-100">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200/60">
          <div className="flex justify-center mb-6">
            <Logo className="h-12" />
          </div>
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="space-y-4">{children}</div>
          {footer && <p className="mt-6 text-center text-xs text-slate-500">{footer}</p>}
        </div>
      </div>
    </div>
  );
}