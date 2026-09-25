import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/6ab62433a194f918c54c8249/939d27d85_alliance-logo-200px.png";

export default function Logo({ className = "h-10", onDark = false }) {
  return (
    <img
      src={LOGO_URL}
      alt="Alliance Leisure"
      className={`w-auto rounded-lg ${className} ${onDark ? "mix-blend-lighten" : ""}`}
    />
  );
}