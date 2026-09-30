import React from 'react';
import { Image } from '@/components/ui/image';

const UKLF_LOGO = 'https://media.base44.com/images/public/6ab62433a194f918c54c8249/6580cf06a_image.png';

export default function UKLFIcon({ darkBackground = false }) {
  return <span aria-hidden="true" className="mr-1.5 inline-block h-5 w-[18px] shrink-0 overflow-hidden align-middle">
    <Image src={UKLF_LOGO} alt="" fittingType="fit" className={`relative -left-[5px] -top-[4px] !h-[30px] !w-[88px] max-w-none grayscale ${darkBackground ? 'invert brightness-[0.65] mix-blend-screen' : 'mix-blend-multiply'}`} />
  </span>;
}