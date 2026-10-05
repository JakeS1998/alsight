import React from 'react';
import { Image } from '@/components/ui/image';
export default function HomeJourneyHero() {
  return <section className="home-hero" aria-label="Your connected ALSight journey">
    <Image src="https://media.base44.com/images/public/6ab62433a194f918c54c8249/68174d3b4_generated_image.png" alt="Two hikers look towards a mountain summit reached by a glowing golden trail at sunrise." className="absolute inset-0 h-full w-full" focalPointX={0.65} focalPointY={0.5} />
    <div className="home-hero-shade" aria-hidden="true" />
    <div className="home-hero-copy"><h2 className="font-heading font-extrabold">From hello<br />to <span className="text-primary">here you go.</span></h2><p className="mt-3 text-base">One connected journey from relationship to handover.</p><div className="my-4 h-1 w-16 bg-primary" /><p className="text-sm leading-relaxed">Build the relationship. Spot the opportunity. Shape the project. Deliver it. Hand it over. <strong>ALSight keeps everything connected along the way.</strong></p></div>
  </section>;
}