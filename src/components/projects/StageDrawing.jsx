import React from 'react';

const drawings = {
  PIPELINE: ['Project folders and site map', 'M10 72V30h27l8 9h43v33H10z M18 30V19h27l8 8h27v12 M22 51h26v13H22z M60 50l8-5 12 5v14l-12-5-8 5V50z M68 45v14'],
  'RIBA 1': ['Brief clipboard and location pin', 'M16 20h45v63H16z M29 14h20v12H29z M26 38h24 M26 48h19 M26 58h15 M73 73s17-18 17-31a17 17 0 0 0-34 0c0 13 17 31 17 31z M78 41a5 5 0 1 1-10 0 5 5 0 0 1 10 0'],
  'RIBA 2': ['Leisure centre concept sketch', 'M8 79h85 M16 75V39l38-15 32 15v36 M16 39h70 M24 47h17v15H24z M49 47h28v15H49z M47 75V66h13v9 M15 31l38-15 34 16 M70 14l14-5 7 6-14 6-7-7z M70 14l-6 10 13-3'],
  'RIBA 3': ['Architectural floor plan and building model', 'M8 22h43v51H8z M8 44h43 M28 22v22 M28 55v18 M8 59h10 M60 51l18-9 16 9v25l-18 9-16-9V51z M60 51l16 9 18-9 M76 60v25 M66 25h21 M76 16v19'],
  'RIBA 4': ['Technical drawing and set square', 'M9 17h57v62H9z M18 30h34v34H18z M18 46h34 M35 30v34 M13 85h60 M13 81v8 M73 81v8 M59 86l31-50v50H59z M74 76l9-16v16h-9z'],
  'RIBA 5–7': ['Crane and completed leisure centre', 'M8 85h86 M16 83V20 M11 20h76 M25 20L46 8l30 12 M46 8v12 M79 20v24 M74 44h10 M16 31l15-11 M37 83V51l28-10 26 10v32 M37 51h54 M44 59h13v12H44z M65 59h17v12H65z M60 83V74h13v9'],
};
export default function StageDrawing({ stage, className = 'h-12 w-12', bare = false }) {
  const drawing = drawings[stage];
  if (!drawing) return null;
  return <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" role={bare ? undefined : 'img'} aria-label={bare ? undefined : drawing[0]} aria-hidden={bare || undefined} className={`shrink-0 text-als-navy ${className}`}><path d={drawing[1]} /></svg>;
}