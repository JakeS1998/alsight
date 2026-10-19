import React from 'react';
import { Image } from '@/components/ui/image';
import '@/components/metrics/kpi-illustrations.css';

const artwork = {
  PIPELINE: '27cd0bd39',
  'RIBA 1': '9f8e9a20f',
  'RIBA 2': '54b8cb37c',
  'RIBA 3': '6cfe35936',
  'RIBA 4': '862fa7961',
  'RIBA 5–7': '67cb42bb5',
};

export default function PipelineStageArtwork({ stage, dark = false }) {
  const image = artwork[stage];
  if (!image) return null;
  return <span className="alsight-kpi-art" aria-hidden="true"><Image src={`https://media.base44.com/images/public/6ab62433a194f918c54c8249/${image}_generated_image.png`} alt="" fittingType="fill" focalPointX={0.8} focalPointY={0.6} loading="lazy" className="alsight-kpi-drawing" style={dark ? { filter: 'invert(1)', mixBlendMode: 'screen' } : undefined} /></span>;
}