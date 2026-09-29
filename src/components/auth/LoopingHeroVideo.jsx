import React, { useEffect, useRef } from "react";

const VIDEO_URL = "https://allianceleisure.co.uk/wp-content/uploads/2026/02/whitchurch-drone.mp4";

export default function LoopingHeroVideo({ poster }) {
  const videoRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const playBackwards = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    let position = video.duration;
    let previousFrame = null;
    const step = (now) => {
      if (previousFrame !== null) position = Math.max(0, position - Math.min((now - previousFrame) / 1000, 0.1));
      previousFrame = now;
      if (position <= 0.04) {
        video.currentTime = 0;
        video.play();
        return;
      }
      if (!video.seeking) video.currentTime = position;
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  };

  return <video
    ref={videoRef}
    className="pointer-events-none absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
    autoPlay
    muted
    playsInline
    preload="auto"
    poster={poster}
    aria-hidden="true"
    onEnded={playBackwards}
  ><source src={VIDEO_URL} type="video/mp4" /></video>;
}