import React from 'react';
import { Image } from '@/components/ui/image';

const drawings = {
  PIPELINE: ['e9b868f02', 'Stacked project folders and site map'],
  'RIBA 1': ['9d39d9a3b', 'Brief clipboard and location pin'],
  'RIBA 2': ['9b0ecb40e', 'Pencil sketch of a leisure centre'],
  'RIBA 3': ['d2382e6e8', 'Architectural floor plan and building model'],
  'RIBA 4': ['2cac5caea', 'Technical drawing and set square'],
  'RIBA 5–7': ['4291a16fa', 'Crane and completed leisure centre'],
};

export default function StageDrawing({ stage, className = 'h-12 w-12', bare = false }) {
  const drawing = drawings[stage];
  if (!drawing) return null;
  return <Image
    src={`https://media.base44.com/images/public/6ab62433a194f918c54c8249/${drawing[0]}_generated_image.png`}
    alt={bare ? '' : drawing[1]}
    aria-hidden={bare || undefined}
    fittingType="fit"
    className={`shrink-0 ${bare ? '' : 'rounded-md bg-card'} ${className}`}
  />;
}