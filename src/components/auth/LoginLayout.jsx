import React from "react";
import Logo from "@/components/Logo";

const HERO_IMAGE = "https://allianceleisure.co.uk/wp-content/uploads/2025/10/Wilsons-Cath-Thom-Open-Day-101025-31.jpg";

export default function LoginLayout({ children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-als-navy font-body">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-als-navy/95 via-als-navy/30 to-als-navy/65" aria-hidden="true" />
      <div className="absolute inset-0 bg-als-navy/25 lg:hidden" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen flex-col gap-10 px-6 py-8 sm:px-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] lg:items-center lg:gap-12 lg:py-12 lg:pl-[8vw] lg:pr-[7vw] 2xl:pr-[16vw]">
        <div className="lg:flex lg:min-h-[min(780px,85vh)] lg:flex-col">
          <div className="mt-12 max-w-xl lg:my-auto lg:pr-8">
            <h1 className="max-w-[600px] font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[48px] xl:text-[54px]">
              One connected view of every project.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white sm:text-xl lg:text-lg xl:text-xl">
              Project, commercial, legal and delivery insight in one place.
            </p>
            <p className="mt-7 text-sm font-medium tracking-wide text-white/85">Projects · Pipeline · Delivery · Insight</p>
          </div>
        </div>
        <section aria-label="Sign in to ALS Live" className="w-full max-w-[460px] self-center rounded-[20px] bg-card p-6 text-center shadow-2xl sm:p-10 lg:justify-self-center">
          <div className="mb-8">
            <Logo className="mx-auto h-10" />
            <p className="mt-5 font-heading text-2xl font-extrabold tracking-tight text-als-navy">ALS Live</p>
            <h2 className="mt-4 font-heading text-xl font-bold text-als-navy">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue.</p>
          </div>
          {children}
          <p className="mt-7 text-center text-xs text-muted-foreground">Need access? Contact your ALS Live administrator.</p>
        </section>
      </div>
    </main>
  );
}