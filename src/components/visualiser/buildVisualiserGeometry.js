import * as THREE from 'three';
export default function buildVisualiserGeometry(scene,zones,theme){
 const groups=[];
 const box=(parent,w,h,d,x,y,z,color)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.78}));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const base=box(scene,46,.35,51,0,-.45,0,theme.surface);
 for(const zone of zones){
  const group=new THREE.Group();group.userData.zoneId=zone.id;group.position.set(zone.x+zone.w/2-20,0,zone.y+zone.d/2-10);scene.add(group);
  const floor=box(group,zone.w-.5,.25,zone.d-.5,0,0,0,theme.neutral);
  if(!['external','roof','service'].includes(zone.kind)){
   box(group,zone.w-.5,zone.h,.25,0,zone.h/2,-zone.d/2+.3,theme.surface);
   box(group,.25,zone.h,zone.d-.5,-zone.w/2+.3,zone.h/2,0,theme.surface);
   box(group,.25,zone.h,zone.d-.5,zone.w/2-.3,zone.h/2,0,theme.surface);
  }
  if(zone.kind==='pool'){
   box(group,zone.w-7,.32,zone.d-5,0,.28,0,theme.surface);
   box(group,zone.w-8,.08,zone.d-6,0,.48,0,theme.water);
   for(let i=1;i<=5;i++)box(group,zone.w-8,.02,.06,0,.54,-zone.d/2+3+i*2,theme.navy);
  }
  if(zone.kind==='plant')for(let i=0;i<3;i++){
   const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,1.9,16),new THREE.MeshStandardMaterial({color:theme.surface,roughness:.65}));cylinder.position.set(-3+i*3,1.1,0);cylinder.castShadow=true;group.add(cylinder);
  }
  if(zone.kind==='roof')for(let i=0;i<6;i++)box(group,.2,.3,zone.d-.8,-zone.w/2+2+i*4,.3,0,theme.surface);
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(zone.w-.4,.28,zone.d-.4)),new THREE.LineBasicMaterial({color:theme.navy}));outline.position.y=.06;group.add(outline);
  groups.push({zone,group,floor,outline});
 }
 base.receiveShadow=true;return groups;
}