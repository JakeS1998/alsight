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

export default function AuthLayout({ title, subtitle, footer, children, overlay = false }) {
  return (
    <div className={overlay ? "relative min-h-screen bg-als-navy" : "min-h-screen flex bg-white"}>
      {/* Hero image spans the whole login page when overlaid. */}
      <div className={overlay ? "absolute inset-0 overflow-hidden bg-als-navy" : "relative hidden lg:block lg:w-2/3 overflow-hidden bg-als-navy"}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="absolute inset-0 bg-als-navy/70" />
        <div className={overlay ? "relative hidden lg:flex lg:h-full lg:w-2/3 flex-col justify-between p-12 xl:p-16" : "relative h-full flex flex-col justify-between p-12 xl:p-16"}>
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

      {/* The login card sits above the full-width photo. */}
      <div className={overlay ? "relative z-10 flex min-h-screen items-center justify-center px-6 py-10 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/3 lg:px-8" : "flex-1 flex items-center justify-center px-6 py-10 bg-white"}>
        <div className="w-full max-w-md rounded-hero bg-card p-6 sm:p-10 shadow-xl ring-1 ring-border/60">
          <div className="flex justify-center mb-6">
            <Logo className="h-24 w-64" />
          </div>
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-als-navy">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="space-y-4">{children}</div>
          {footer && <p className="mt-6 text-center text-xs text-slate-500">{footer}</p>}
        </div>
      </div>
    </div>
  );
}