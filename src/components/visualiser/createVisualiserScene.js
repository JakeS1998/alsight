import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import visualiserTheme from '@/components/visualiser/visualiserTheme';
import buildVisualiserGeometry from '@/components/visualiser/buildVisualiserGeometry';
export default function createVisualiserScene(host,zones,onSelect,onError){
 const theme=visualiserTheme(),scene=new THREE.Scene();scene.background=theme.background;
 const camera=new THREE.PerspectiveCamera(40,1,.1,250);camera.position.set(53,52,58);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,3);controls.minDistance=10;controls.maxDistance=130;controls.maxPolarAngle=Math.PI/2-.04;controls.enableDamping=false;controls.saveState();
 scene.add(new THREE.HemisphereLight(theme.surface,theme.neutral,2.2));const light=new THREE.DirectionalLight(theme.surface,3);light.position.set(25,50,20);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-35,right:35,top:35,bottom:-35});scene.add(light);
 const groups=buildVisualiserGeometry(scene,zones,theme),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start=null;
 const render=()=>renderer.render(scene,camera);controls.addEventListener('change',render);
 const resize=()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);render();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const down=e=>{start={x:e.clientX,y:e.clientY};};const up=e=>{if(!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)return;start=null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(groups.map(g=>g.group),true)[0];let object=hit?.object;while(object&&!object.userData.zoneId)object=object.parent;if(object?.userData.zoneId)onSelect(object.userData.zoneId);};
 const lost=e=>{e.preventDefault();onError();};renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('webglcontextlost',lost);
 return {camera,renderer,controls,groups,render,theme,
  zoom:factor=>{camera.position.sub(controls.target).multiplyScalar(factor).clampLength(10,130).add(controls.target);controls.update();render();},
  reset:()=>{controls.reset();render();},
  focus:id=>{const item=groups.find(g=>g.zone.id===id);if(!item)return;controls.target.copy(item.group.position);const distance=Math.max(item.zone.w,item.zone.d)*1.5;camera.position.copy(controls.target).add(new THREE.Vector3(distance,distance,distance));controls.update();render();},
  dispose:()=>{observer.disconnect();controls.removeEventListener('change',render);controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(object=>{object.geometry?.dispose();if(object.material){const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
 };
}