import React,{useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {performanceStep} from './preferences';
export function ParticleEffects({game,low=false}){
 const mesh=useRef(),cursor=useRef(0),serial=useRef(0),lastTime=useRef(0);
 const count=low?100:200;
 const pool=useMemo(()=>Array.from({length:count},()=>({life:0,born:-100,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,color:new THREE.Color()})),[count]);
 const dummy=useMemo(()=>new THREE.Object3D(),[]);
 useFrame(()=>{
  if(game.time<lastTime.current){serial.current=0;pool.forEach(p=>{p.life=0;});}lastTime.current=game.time;
  for(const effect of game.fx){
   if(effect.id<=serial.current)continue;
   serial.current=effect.id;
   const sparkle=effect.type==='coin'||effect.type==='checkpoint';
   const n=effect.type==='dust'?2:low?8:14;
   for(let i=0;i<n;i++){
    const p=pool[cursor.current++%count],a=i/n*Math.PI*2+effect.id*.7;
    Object.assign(p,{born:effect.time,life:sparkle?.65:.45,x:effect.x,y:effect.y+(sparkle?.2:.06),z:effect.z,vx:Math.cos(a)*(sparkle?2:.9),vy:sparkle?1.6+(i%3)*.6:.35+(i%3)*.18,vz:Math.sin(a)*(sparkle?2:.9),size:sparkle?.09:.15});
    p.color.set(sparkle?(i%2?'#fff0a5':'#ffca42'):effect.type==='hit'?'#f78b73':'#dfd3b3');
   }
  }
  pool.forEach((p,i)=>{const age=Math.max(0,game.time-p.born),live=age<p.life;
   dummy.position.set(p.x+p.vx*age,p.y+p.vy*age-(p.life>.5?2:0)*age*age,p.z+p.vz*age);
   const scale=live?p.size*(1-age/p.life):0;dummy.scale.setScalar(scale);dummy.rotation.set(age*4+i,age*3,0);dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix);mesh.current.setColorAt(i,p.color);
  });
  mesh.current.instanceMatrix.needsUpdate=true;if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;
 });
 return <instancedMesh ref={mesh} args={[undefined,undefined,count]} frustumCulled={false}><icosahedronGeometry args={[1,0]}/><meshBasicMaterial transparent opacity={.8} depthWrite={false}/></instancedMesh>;
}
export function SunGlow({night=false}){
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,night?'#d6edff':'#fff4c9');gradient.addColorStop(.12,night?'#bfdcff':'#ffefac');gradient.addColorStop(.3,'#ffffff50');gradient.addColorStop(1,'#ffffff00');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);},[night]);
 return <sprite position={[-45,45,-105]} scale={[42,42,1]}><spriteMaterial map={texture} transparent opacity={night?.35:.7} depthWrite={false} blending={THREE.AdditiveBlending}/></sprite>;
}
export function FrameMonitor({game,onSlow,onStats}){
 const sampling=useRef({samples:0,elapsed:0,fps:null,downgrade:false});
 useFrame(({gl},dt)=>{
  if(document.hidden||game.status!=='playing')return;
  const next=performanceStep(sampling.current,dt,game.status==='playing');sampling.current=next;
  if(next.samples===0&&next.fps){onStats?.({fps:next.fps,calls:gl.info.render.calls,triangles:gl.info.render.triangles});if(next.downgrade)onSlow?.();}
 });return null;
}

