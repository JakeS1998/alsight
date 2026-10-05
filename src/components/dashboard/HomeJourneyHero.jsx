import React from 'react';
import { Image } from '@/components/ui/image';
export default function HomeJourneyHero() {
  return <section className="home-hero" aria-label="Your connected ALSight journey">
    <Image src="https://media.base44.com/images/public/6ab62433a194f918c54c8249/6d27f6cfb_generated_image.png" alt="A glowing golden track winds up the mountain to a needle-point beacon at the fully visible summit." className="absolute inset-y-0 right-0 h-full w-full md:w-2/3" fittingType="fit" />
    <div className="home-hero-shade" aria-hidden="true" />
    <div className="home-hero-copy"><h2 className="font-heading font-extrabold">From hello<br />to <span className="text-primary">here you go.</span></h2><p className="mt-3 text-base">One connected journey from relationship to handover.</p><div className="my-4 h-1 w-16 bg-primary" /><p className="text-sm leading-relaxed">Build the relationship. Spot the opportunity. Shape the project. Deliver it. Hand it over. <strong>ALSight keeps everything connected along the way.</strong></p></div>
  </section>;
}