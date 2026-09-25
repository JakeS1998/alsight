import React from "react";
import { Image } from "@/components/ui/image";

const LOGO_URL = "https://media.base44.com/images/public/6ab62433a194f918c54c8249/939d27d85_alliance-logo-200px.png";

export default function Logo({ className = "h-10", onDark = false }) {
  return (
    <Image
      src={LOGO_URL}
      fittingType="fit"
      alt="Alliance Leisure"
      className={`w-40 object-contain ${className} ${onDark ? "mix-blend-lighten" : ""}`}
    />
  );
}