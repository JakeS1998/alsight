import React from 'react';
import { Image } from '@/components/ui/image';

export default function AliceAvatar() {
  return <span className="alice-bot alice-avatar" aria-hidden="true">
    <span className="alice-avatar-crop">
      <Image src="https://media.base44.com/images/public/6ab62433a194f918c54c8249/e066d7a31_image.png" fittingType="fit" alt="" className="alice-avatar-logo" />
    </span>
  </span>;
}