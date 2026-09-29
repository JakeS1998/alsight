import React from "react";
import Logo from "@/components/Logo";
import LoopingHeroVideo from "@/components/auth/LoopingHeroVideo";

const HERO_IMAGE = "https://allianceleisure.co.uk/wp-content/uploads/2025/10/Wilsons-Cath-Thom-Open-Day-101025-31.jpg";
// Replace with the name of the featured project if the footage changes or the name is confirmed.
const FEATURED_PROJECT_NAME = "Featured leisure centre";

export default function LoginLayout({ children }) {
  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden bg-als-navy font-body lg:block lg:min-h-screen">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} aria-hidden="true" />
      <LoopingHeroVideo poster={HERO_IMAGE} />
      <div className="absolute inset-0 bg-als-navy/60" aria-hidden="true" />
      <div className="absolute inset-0 bg-als-navy/10 lg:hidden" aria-hidden="true" />
      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 sm:px-10 lg:grid lg:min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] lg:gap-12 lg:py-12 lg:pl-[8vw] lg:pr-[7vw] 2xl:pr-[16vw]">
        <div className="hidden lg:flex lg:min-h-[min(780px,85vh)] lg:flex-col">
          <div className="max-w-xl lg:my-auto lg:pr-8">
            <h1 className="max-w-[600px] font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[48px] xl:text-[54px]">
              One connected view<br />of every project.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white sm:text-xl lg:text-lg xl:text-xl">
              Project, commercial, legal and delivery insight in one place.
            </p>
            <p className="mt-7 text-sm font-medium tracking-wide text-white/85">Projects · Pipeline · Delivery · Insight</p>
          </div>
        </div>
        <section aria-label="Sign in to ALSight" className="w-full max-w-[460px] self-center rounded-[20px] bg-card p-6 text-center shadow-lg sm:p-9 lg:justify-self-center">
          <div className="mb-8">
            <Logo className="mx-auto h-24 w-full max-w-[280px] sm:h-32 sm:max-w-[350px]" />
            <h2 className="mt-3 font-heading text-2xl font-bold text-als-navy">Welcome to ALSight</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your project workspace.</p>
          </div>
          {children}
          <p className="mt-7 text-center text-sm text-muted-foreground">Need access? Contact your ALSight administrator.</p>
        </section>
      </div>
      <p className="relative z-10 px-5 pb-6 text-xs text-white/75 sm:px-10 lg:absolute lg:bottom-6 lg:left-[8vw] lg:p-0">{FEATURED_PROJECT_NAME} · Alliance Leisure Project</p>
    </main>
  );
}