import React from "react";

export default function LoopingHeroVideo({ poster }) {
  return <video
    className="pointer-events-none absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
    autoPlay
    muted
    loop
    playsInline
    preload="metadata"
    poster={poster}
    aria-hidden="true"
  ><source src="/whitchurch-pingpong.mp4" type="video/mp4" /></video>;
}