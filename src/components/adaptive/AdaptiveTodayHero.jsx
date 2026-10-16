import React from 'react';
import { Image } from '@/components/ui/image';
export default function AdaptiveTodayHero({children}) {
 const src='https://media.base44.com/images/public/6ab62433a194f918c54c8249/c17404602_IMG_7782.jpg';
 return <section className="at-reference-hero" aria-label="Your connected working day"><Image src={src} alt="The Alliance Leisure team celebrates winning Supplier of the Year at the UK active Awards." className="at-hero-photo" focalPointX={0.5} focalPointY={0.6} loading="eager"/><div className="at-hero-shade" aria-hidden="true"/><div className="at-hero-content">{children}</div></section>;
}