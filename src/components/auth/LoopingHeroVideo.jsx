import React, { useEffect, useRef, useState } from "react";

const VIDEO_URL = "https://allianceleisure.co.uk/wp-content/uploads/2026/02/whitchurch-drone.mp4";

export default function LoopingHeroVideo({ poster }) {
  const videos = [useRef(null), useRef(null)];
  const activeRef = useRef(0);
  const switchingRef = useRef(false);
  const timerRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const crossfade = async (index) => {
    if (index !== activeRef.current || switchingRef.current) return;
    switchingRef.current = true;
    const next = 1 - index;
    const incoming = videos[next].current;
    const outgoing = videos[index].current;
    incoming.currentTime = 0;
    try {
      await incoming.play();
      activeRef.current = next;
      setActive(next);
      timerRef.current = setTimeout(() => {
        outgoing.pause();
        outgoing.currentTime = 0;
        switchingRef.current = false;
      }, 1400);
    } catch {
      switchingRef.current = false;
    }
  };

  return <div className="pointer-events-none absolute inset-0 motion-reduce:hidden" aria-hidden="true">
    {[0, 1].map((index) => <video
      key={index}
      ref={videos[index]}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out ${active === index ? "opacity-100 z-10" : "opacity-0 z-0"}`}
      autoPlay={index === 0}
      muted
      playsInline
      preload="auto"
      poster={poster}
      onTimeUpdate={(event) => {
        const video = event.currentTarget;
        if (video.duration && video.duration - video.currentTime <= 2.2) crossfade(index);
      }}
    ><source src={VIDEO_URL} type="video/mp4" /></video>)}
  </div>;
}