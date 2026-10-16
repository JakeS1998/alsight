import React from 'react';
import { Image } from '@/components/ui/image';
export default function AdaptiveTodayHero() {
 const src='https://media.base44.com/images/public/6ab62433a194f918c54c8249/c17404602_IMG_7782.jpg';
 return <section className="relative mt-6 h-64 overflow-hidden rounded-hero md:h-80 lg:h-96" aria-label="Alliance Leisure award ceremony">
  <Image src={src} alt="The Alliance Leisure team celebrates winning Supplier of the Year on the UK active Awards stage." className="absolute inset-0 hidden h-full w-full md:block" focalPointX={0.5} focalPointY={0.6}/>
  <Image src={src} alt="The Alliance Leisure team with their Supplier of the Year award." className="absolute inset-0 h-full w-full md:hidden" focalPointX={0.56} focalPointY={0.6}/>
 </section>;
}