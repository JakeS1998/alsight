import * as THREE from 'three';
export default function visualiserTheme(){
 const style=window.getComputedStyle(document.documentElement);
 const color=token=>new THREE.Color(`hsl(${style.getPropertyValue(`--${token}`).trim().split(/\s+/).join(',')})`);
 return {surface:color('card'),background:color('background'),neutral:color('border'),navy:color('als-navy'),water:color('chart-4'),selected:color('primary'),risk:color('risk-critical')};
}