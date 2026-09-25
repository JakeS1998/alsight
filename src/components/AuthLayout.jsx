import React, { useState, useEffect } from "react";
import { ShieldCheck, FolderKanban, Building2, Truck, Users } from "lucide-react";
import Logo from "@/components/Logo";

// Real Alliance Leisure leisure-centre photography + complementary facility renders.
const HERO_IMAGES = [
  "https://allianceleisure.co.uk/wp-content/uploads/2026/08/Website-Images-10.png",
  "https://allianceleisure.co.uk/wp-content/uploads/2025/10/Wilsons-Cath-Thom-Open-Day-101025-31.jpg",
  "https://media.base44.com/images/public/6ab62433a194f918c54c8249/482677d7e_generated_image.png",
  "https://media.base44.com/images/public/6ab62433a194f918c54c8249/d5da4df30_generated_image.png",
];

const STATS = [
  { value: "25+", label: "Years delivering leisure" },
  { value: "2,700+", label: "Facilities transformed" },
  { value: "UKLF", label: "Leisure Framework" },
];

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Hero panel (2/3) ── */}
      <div className="relative hidden lg:block lg:w-2/3 overflow-hidden bg-als-navy">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-in-out"
            style={{ backgroundImage: `url(${src})`, opacity: i === active ? 1 : 0 }}
          />
        ))}
        {/* dark gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-als-navy via-als-navy/50 to-als-navy/70" />
        <div className="absolute inset-0 bg-als-navy/20" />

        <div className="relative h-full flex flex-col justify-between p-12 xl:p-16">
          <Logo className="h-14" onDark />

          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              ALS Live Portal
            </span>
            <h2 className="mt-5 font-heading text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white">
              Making public leisure sustainable &amp; building healthy communities.
            </h2>
            <p className="mt-4 text-base text-white/75 leading-relaxed">
              One secure portal for every stakeholder — manage projects, contracts and
              invoices with role-based access tailored to your relationship with Alliance Leisure.
            </p>

            <div className="mt-10 flex flex-wrap gap-8">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="font-heading text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-white/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} Alliance Leisure. All rights reserved.</p>
            <div className="flex gap-1.5">
              {HERO_IMAGES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Image ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-primary" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Login panel (1/3) ── */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            {/* Mobile brand header */}
            <div className="mb-8 lg:hidden">
              <Logo className="h-10" />
            </div>

            <div className="mb-7">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
            </div>

            <div className="space-y-4">{children}</div>

            {footer && <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}