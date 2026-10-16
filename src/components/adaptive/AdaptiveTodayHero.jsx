import React from 'react';
import { Image } from '@/components/ui/image';
export default function AdaptiveTodayHero({children}) {
 const src='https://media.base44.com/images/public/6ab62433a194f918c54c8249/da9395d2a_generated_image.png';
 return <section className="at-reference-hero" aria-label="Your connected working day"><Image src={src} alt="Illustration of a contemporary leisure centre at sunset." className="at-hero-photo" focalPointX={0.6} focalPointY={0.55} loading="eager"/><div className="at-hero-shade" aria-hidden="true"/><div className="at-hero-content"><p className="at-hero-motto">Projects, People &amp;<br/>Information Connected</p>{children}</div></section>;
}