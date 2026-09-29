import React from "react";
import { Image } from "@/components/ui/image";

const FULL_LOGO = "https://media.base44.com/images/public/6ab62433a194f918c54c8249/7f98df654_ALSight_brand_aligned_transparent.png";
const COMPACT_LOGO = "https://media.base44.com/images/public/6ab62433a194f918c54c8249/8b9efea62_ALSight_brand_aligned_compact.png";
const HEADER_LOGO = "https://media.base44.com/images/public/6ab62433a194f918c54c8249/182c2ffdf_image.png";

export default function Logo({ variant = "full", className = "h-20 w-64" }) {
  return (
    <Image
      src={variant === "header" ? HEADER_LOGO : variant === "compact" ? COMPACT_LOGO : FULL_LOGO}
      fittingType="fit"
      alt="ALSight"
      className={`object-contain ${className}`}
    />
  );
}