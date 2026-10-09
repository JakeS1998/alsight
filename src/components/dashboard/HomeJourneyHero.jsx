import React from 'react';
import { Image } from '@/components/ui/image';
export default function HomeJourneyHero() {
  return <section className="home-hero" aria-label="Your connected ALSight journey">
    <Image src="https://media.base44.com/images/public/6ab62433a194f918c54c8249/c17404602_IMG_7782.jpg" alt="The Alliance Leisure team celebrates winning Supplier of the Year on the UK active Awards stage." className="absolute inset-0 hidden h-full w-full object-cover md:block" focalPointX={0.5} focalPointY={0.64} />
    <Image src="https://media.base44.com/images/public/6ab62433a194f918c54c8249/c17404602_IMG_7782.jpg" alt="The Alliance Leisure team with their Supplier of the Year award." className="absolute inset-0 h-full w-full object-cover md:hidden" focalPointX={0.56} focalPointY={0.6} />
    <div className="home-hero-shade" aria-hidden="true" />
    <div className="home-hero-copy"><h2 className="font-heading font-extrabold">From hello<br /><span className="text-primary">to here you go.</span></h2><p className="mt-3 text-xl leading-relaxed">One connected journey from relationship to handover.</p><div className="my-4 h-1 w-16 bg-primary" /><p className="text-lg leading-relaxed">Build the relationship. Spot the opportunity. Shape the project. Deliver it. Hand it over. <strong>ALSight keeps everything connected along the way.</strong></p></div>
  </section>;
}