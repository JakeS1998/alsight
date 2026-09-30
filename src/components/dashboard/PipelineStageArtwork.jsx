import React from 'react';
import { Image } from '@/components/ui/image';

const artwork = {
  PIPELINE: 'e9b868f02',
  'RIBA 1': '9d39d9a3b',
  'RIBA 2': '9b0ecb40e',
  'RIBA 3': 'd2382e6e8',
  'RIBA 4': '2cac5caea',
  'RIBA 5–7': '4291a16fa',
};

export default function PipelineStageArtwork({ stage, className }) {
  const image = artwork[stage];
  if (!image) return null;
  return <Image src={`https://media.base44.com/images/public/6ab62433a194f918c54c8249/${image}_generated_image.png`} alt="" aria-hidden="true" fittingType="fit" className={`shrink-0 mix-blend-multiply grayscale contrast-125 brightness-110 ${className || ''}`} />;
}