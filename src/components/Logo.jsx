import React from "react";
import { Image } from "@/components/ui/image";

const FULL_LOGO = "https://media.base44.com/images/public/6ab62433a194f918c54c8249/1bd12e65c_image.png";
const COMPACT_LOGO = FULL_LOGO;
const HEADER_LOGO = "https://media.base44.com/images/public/6ab62433a194f918c54c8249/e066d7a31_image.png";

export default function Logo({ variant = "full", className = "h-20 w-64" }) {
  return (
    <Image
      src={variant === "header" ? HEADER_LOGO : variant === "compact" ? COMPACT_LOGO : FULL_LOGO}
      fittingType="fit"
      alt="ALS Hub"
      className={`object-contain ${className}`}
    />
  );
}