import React, { createContext, useContext, useLayoutEffect, useMemo, useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import { getWorld, platformAt, tick, landingPreview } from './game';
import {ParticleEffects,SunGlow,FrameMonitor} from './Effects';
import { getTheme, THEMES } from './worlds';
import StaticIsland from './StaticIsland';


const LowDetail=createContext(false);
const WorldTheme = createContext(THEMES.garden);
function paint(color,t) {
 const map={'#78bd39':t.ground,'#7abd43':t.ground,'#79bc45':t.ground,'#e8c785':t.path,'#8dcc44':t.ground,'#fff9df':t.name==='snow'?'#ffffff':t.accent,'#ffcd45':t.accent,'#6aba37':t.foliage,'#489c3d':t.foliage,'#ae742f':t.name==='snow'?'#87a9ba':'#996e52','#bd873f':t.name==='snow'?'#abcad4':'#b98a60'};
 return map[color]||color;
}
const rand = seed => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
function Box({ at = [0, 0, 0], size = [1, 1, 1], color = '#af8c61', ...props }) {
  const theme = useContext(WorldTheme), ember = theme.name === 'ember' || theme.name === 'volcano';
  color = paint(color, theme);
  return <mesh position={at} scale={size} castShadow receiveShadow {...props}><boxGeometry /><meshStandardMaterial color={color} roughness={.83} /></mesh>;
}
function Cylinder({ at, args, color, ...props }) {
  return <mesh position={at} castShadow receiveShadow {...props}><cylinderGeometry args={args} /><meshStandardMaterial color={color} roughness={.7} /></mesh>;
}
function InstanceSet({ geometry, color, transforms, roughness = .8 }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    transforms.forEach((t, i) => {
      dummy.position.set(...t.p); dummy.rotation.set(...(t.r || [0, 0, 0]));
      dummy.scale.set(...(t.s || [1, 1, 1])); dummy.updateMatrix(); ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [transforms]);
  const theme = useContext(WorldTheme), ember = theme.name === 'ember' || theme.name === 'volcano';
  color = paint(color, theme);
  return <instancedMesh ref={ref} args={[geometry, undefined, transforms.length]} castShadow receiveShadow><meshStandardMaterial color={color} roughness={roughness} /></instancedMesh>;
}
function Rock({ w, d, seed = 1 }) {
  const theme = useContext(WorldTheme), ember = theme.name === 'ember' || theme.name === 'volcano';
  const geo = useMemo(() => {
    const vertices = [], colors = [], palette = theme.rock.map(c => new THREE.Color(c));
    const rings = [0, 1, 2].map((ring) => Array.from({ length: 8 }, (_, i) => {
      const a = i / 8 * Math.PI * 2;
      const scale = [1, .8, .18][ring];
      return [Math.cos(a) * w * .6 * scale, [-.35, -2.1, -5.2][ring] + (rand(seed + i * 2 + ring) - .5) * .5, Math.sin(a) * d * .6 * scale];
    }));
    function triangle(a, b, c, shade) { vertices.push(...a, ...b, ...c); for (let j = 0; j < 3; j++) colors.push(shade.r, shade.g, shade.b); }
    for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8, col = palette[Math.floor(rand(seed + i * 3 + r) * palette.length)];
      triangle(rings[r][i], rings[r + 1][i], rings[r][j], col);
      triangle(rings[r][j], rings[r + 1][i], rings[r + 1][j], palette[(i + r) % palette.length]);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals(); return geometry;
  }, [w, d, seed, theme]);
  return <mesh geometry={geo} castShadow receiveShadow><meshStandardMaterial vertexColors flatShading side={THREE.DoubleSide} /></mesh>;
}
function Pine({ at, scale = 1 }) {
  const theme=useContext(WorldTheme), kind=theme.plant,low=useContext(LowDetail);
  if(kind==='cactus')return <group position={at} scale={scale}><Cylinder at={[0,1.2,0]} args={[.29,.34,2.4,7]} color={theme.foliage}/>{[-1,1].map((v,i)=><group key={v}><Cylinder at={[v*.46,1+i*.5,0]} args={[.15,.15,.8,6]} color={theme.foliage} rotation={[0,0,Math.PI/2]}/><Cylinder at={[v*.78,1.3+i*.5,0]} args={[.16,.18,.8,6]} color={theme.foliage}/></group>)}</group>;
  if(kind==='mushroom')return <group position={at} scale={scale}><Cylinder at={[0,.8,0]} args={[.24,.36,1.6,7]} color="#e8dbd4"/><mesh position={[0,1.5,0]} scale={[1.2,.6,1.2]} castShadow><sphereGeometry args={[1,10,7,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={theme.foliage} emissive={theme.foliage} emissiveIntensity={.13}/></mesh>{[-.55,0,.55].map(x=><mesh key={x} position={[x,1.94-Math.abs(x)*.22,.27]} scale={[.15,.045,.15]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial color="#fff3de"/></mesh>)}</group>;
  if(kind==='palm')return <group position={at} scale={scale}><Cylinder at={[0,1.3,0]} args={[.16,.28,2.6,6]} color="#987146"/>{Array.from({length:6},(_,i)=><mesh key={i} position={[Math.cos(i*Math.PI/3)*.7,2.65,Math.sin(i*Math.PI/3)*.7]} rotation={[0,-i*Math.PI/3,.15]} scale={[1.2,.12,.35]} castShadow><octahedronGeometry/><meshStandardMaterial color={theme.foliage}/></mesh>)}</group>;
  if(kind==='broadleaf')return <group position={at} scale={scale}><Cylinder at={[0,1,0]} args={[.18,.28,2,6]} color="#805b43"/>{[-1,0,1].map((v,i)=><mesh key={i} position={[v*.5,2.1+(i===1?.6:0),v*.17]} scale={[.85,.9,.85]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={i%2?theme.foliage:'#c45f3b'}/></mesh>)}</group>;
  if(['crystal','basalt','beacon'].includes(kind))return <group position={at} scale={scale}>{[-1,0,1].map((v,i)=><mesh key={i} position={[v*.35,.75+(i===1?.55:0),v*.2]} scale={[.4,.95+(i===1?.65:0),.4]} rotation={[0,i*.8,v*-.25]} castShadow>{kind==='beacon'?<boxGeometry/>:<octahedronGeometry/>}<meshStandardMaterial color={kind==='basalt'?'#3f354d':theme.foliage} emissive={theme.accent} emissiveIntensity={kind==='basalt'?.12:.35} roughness={.35}/></mesh>)}{kind==='beacon'&&<mesh position={[0,2,0]}><sphereGeometry args={[.18,8,6]}/><meshBasicMaterial color={theme.accent}/></mesh>}</group>;
  return <group position={at} scale={scale}><Cylinder at={[0,.7,0]} args={[.17,.27,1.5,5]} color="#88552d"/>{(low?[{y:1.8,r:1.1,h:2.4},{y:2.9,r:.65,h:1.6}]:[{y:1.6,r:1.15,h:1.8},{y:2.4,r:.88,h:1.65},{y:3.1,r:.6,h:1.5}]).map((v,i)=><group key={i}><mesh position={[0,v.y,0]} rotation={[0,i*.4,0]} castShadow><coneGeometry args={[v.r,v.h,5]}/><meshStandardMaterial color={kind==='snowpine'?'#537f94':theme.foliage} flatShading/></mesh>{kind==='snowpine'&&<mesh position={[0,v.y+.2,0]} rotation={[0,i*.4,0]} castShadow><coneGeometry args={[v.r*.92,v.h*.83,5]}/><meshStandardMaterial color="#f1fbff" flatShading/></mesh>}</group>)}</group>;
}
function Flowers({ p, seed }) {
  const data = useMemo(() => {
    const petals = [], centers = [], grass = [], leaves = [];
    for (let i = 0; i < 8; i++) {
      const x = (i % 2 ? 1 : -1) * (p.w * .27 + rand(seed + i) * p.w * .14);
      const z = (rand(seed + i * 5) - .5) * p.d * .83;
      centers.push({ p: [x, .15, z], s: [.08, .08, .08] });
      for (let j = 0; j < 5; j++) petals.push({ p: [x + Math.cos(j * 1.256) * .105, .13, z + Math.sin(j * 1.256) * .105], s: [.11, .035, .07], r: [0, -j * 1.256, 0] });
      for (let j = 0; j < 3; j++) grass.push({ p: [x + .4, .16, z + j * .1], s: [.13, .45 + j * .08, .1], r: [.2, j * 1.2, .4] });
    }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) leaves.push({ p: [p.w * (.2 - i * .27), -.2 - j * .38, p.d * .48], s: [.25, .37, .12], r: [0, 0, (j % 2 ? 1 : -1) * .55] });
    return { petals, centers, grass, leaves };
  }, [p, seed]);
  const sphere = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const blade = useMemo(() => new THREE.ConeGeometry(1, 1, 3), []);
  return <><InstanceSet geometry={sphere} color="#fff9df" transforms={data.petals} /><InstanceSet geometry={sphere} color="#ffcd45" transforms={data.centers} /><InstanceSet geometry={blade} color="#6aba37" transforms={data.grass} /><InstanceSet geometry={sphere} color="#489c3d" transforms={data.leaves} /></>;
}
function Fence({ x, z, length, rotate = false }) {
  return <group position={[x, 0, z]} rotation={[0, rotate ? Math.PI / 2 : 0, 0]}>
    {[-length / 2, 0, length / 2].map((v, i) => <Box key={i} at={[0, .55, v]} size={[.22, 1.1, .24]} color="#ae742f" />)}
    {[.4, .8].map(y => <Box key={y} at={[0, y, 0]} size={[.13, .14, length]} color="#bd873f" />)}
  </group>;
}
function Island({ p, index, game }) {
  const low=useContext(LowDetail);
  const ref = useRef();
  useFrame(() => { if (p.moving) ref.current.position.x = platformAt(p, game.time).x; });
  return <group ref={ref} position={[p.x, p.y, p.z]}><StaticIsland enabled={low}>
    <Rock w={p.w} d={p.d} seed={index + 10} />
    <Box at={[0, -.21, 0]} size={[p.w, .42, p.d]} color={p.moving ? '#caab6c' : '#78bd39'} />
    <Box at={[0, .014, 0]} size={[Math.min(2.8, p.w * .45), .035, p.d - .12]} color={p.moving ? '#ae7c3e' : '#e8c785'} />
    {p.moving ? <>{[-1.6, -.8, 0, .8, 1.6].map(x => <Box key={x} at={[x, .05, 0]} size={[.07, .07, p.d]} color="#8b6139" />)}<Box at={[0, -.4, 0]} size={[p.w + .2, .2, 1]} color="#889aa3" /></> : <>
      <Flowers p={p} seed={index * 7} />
      {[0, 2, 3].includes(index) && <group position={[0, .03, -p.d / 2 + .8]}>
        {[-.6, -.2, .2, .6].map(z => <Box key={z} at={[0, 0, z]} size={[3, .06, .35]} color="#c3924f" />)}
        {[-1.28, 1.28].map(x => <Box key={x} at={[x, .045, 0]} size={[.12, .04, 1.7]} color="#9b6b3d" />)}
      </group>}
      {[-1, 1].map((side) => <group key={side}><Fence x={side * (p.w / 2 - .35)} z={p.d * .07} length={p.d * .6} /><Box at={[side * (p.w / 2 - .15), -.1, -p.d * .35]} size={[.5, .4, .9]} color="#8dcc44" /></group>)}
      {index !== 1 && <Pine at={[(index % 2 ? -1 : 1) * (p.w / 2 - 1.25), 0, -p.d / 2 + 1.3]} scale={.7 + (index % 3) * .15} />}
      {[0, 1].map(i => <mesh key={i} position={[(i ? -1 : 1) * (p.w * .34), .15, p.d * .3]} scale={[.45, .35, .4]} rotation={[0, index, .1]} castShadow><dodecahedronGeometry /><meshStandardMaterial color="#99a1a0" flatShading /></mesh>)}
    </>}
  </StaticIsland></group>;
}
const starShape = new THREE.Shape();
for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? .12 : .25; i ? starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
starShape.closePath();
const starGeometry = new THREE.ShapeGeometry(starShape);
const coinGeometry=(()=>{
 const pieces=[];
 const add=(geometry,color)=>{geometry=geometry.toNonIndexed();const c=new THREE.Color(color),values=[];for(let i=0;i<geometry.attributes.position.count;i++)values.push(c.r,c.g,c.b);geometry.setAttribute('color',new THREE.Float32BufferAttribute(values,3));pieces.push(geometry);};
 const body=new THREE.CylinderGeometry(.36,.36,.1,12);body.rotateX(Math.PI/2);add(body,'#ffc83a');
 for(const side of [-1,1]){const ring=new THREE.TorusGeometry(.3,.033,4,12);ring.translate(0,0,side*.06);add(ring,'#ffeb91');const star=starGeometry.clone();if(side<0)star.rotateY(Math.PI);star.translate(0,0,side*.067);add(star,'#fff1aa');}
 const result=mergeGeometries(pieces,false);pieces.forEach(p=>p.dispose());return result;
})();
function Coin({at,index,game}){
 const ref=useRef();useFrame(()=>{ref.current.visible=!game.coins.has(index);ref.current.rotation.y=game.time*2.3+index*.5;ref.current.position.y=at[1]+Math.sin(game.time*3+index)*.1;});
 return <mesh ref={ref} position={at} geometry={coinGeometry} dispose={null}><meshStandardMaterial vertexColors metalness={.12} roughness={.32}/></mesh>;
}
function Limb({ at, color, leg = false, limbRef }) {
  return <group position={at} ref={limbRef}><mesh position={[0, -.2, 0]} castShadow><capsuleGeometry args={[leg ? .115 : .095, .25, 3, 6]} /><meshStandardMaterial color={color} /></mesh>{leg ? <><Cylinder at={[0, -.39, 0]} args={[.115, .115, .13, 6]} color="#fff9e8" /><Box at={[0, -.49, .06]} size={[.26, .2, .41]} color="#224faa" /><Box at={[0, -.58, .08]} size={[.27, .07, .43]} color="#f8f1db" /></> : <mesh position={[0, -.4, 0]} castShadow><sphereGeometry args={[.13, 8, 6]} /><meshStandardMaterial color="#ffbe83" /></mesh>}</group>;
}
function Character({ game }) {
  const shape=useMemo(()=>new THREE.Vector3(1,1,1),[]);
  const ref = useRef(), leftArm = useRef(), rightArm = useRef(), leftLeg = useRef(), rightLeg = useRef();
  useFrame((_, dt) => {
    ref.current.position.set(game.x, game.y, game.z);
    const sinceLanding=game.time-game.landTime;
    const squash=game.ground&&sinceLanding<.18?Math.sin(sinceLanding/.18*Math.PI)*.18:0;
    const stretch=!game.ground?THREE.MathUtils.clamp(game.vy*.014,-.05,.14):0;
    ref.current.scale.lerp(shape.set(1+squash-stretch*.45,1-squash+stretch,1+squash-stretch*.45),1-Math.exp(-dt*20));
    ref.current.visible = game.invincible <= 0 || Math.floor(game.invincible * 9) % 2 === 0;
    let difference = THREE.MathUtils.euclideanModulo(game.facing - ref.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    ref.current.rotation.y += difference * Math.min(1, dt * 17);
    const swing = game.moving && game.ground ? Math.sin(game.steps * 17) * .75 : 0;
    leftLeg.current.rotation.x = game.ground ? swing : -.5;
    rightLeg.current.rotation.x = game.ground ? -swing : .45;
    leftArm.current.rotation.x = -swing * .8 - (game.ground ? 0 : .65);
    rightArm.current.rotation.x = swing * .8 - (game.ground ? 0 : .65);
  });
  return <group ref={ref}>
    <Limb at={[-.17, .59, 0]} color="#275bad" leg limbRef={leftLeg} /><Limb at={[.17, .59, 0]} color="#275bad" leg limbRef={rightLeg} />
    <mesh position={[0, .89, 0]} scale={[1, 1, .72]} castShadow><capsuleGeometry args={[.28, .26, 4, 8]} /><meshStandardMaterial color="#f04735" /></mesh>
    <Limb at={[-.35, 1.05, 0]} color="#f86a43" limbRef={leftArm} /><Limb at={[.35, 1.05, 0]} color="#f86a43" limbRef={rightArm} />
    <mesh position={[0, 1.36, .015]} scale={[1, 1.03, 1]} castShadow><sphereGeometry args={[.28, 12, 8]} /><meshStandardMaterial color="#ffc28b" /></mesh>
    <mesh position={[0, 1.44, -.045]} castShadow><sphereGeometry args={[.284, 12, 8]} /><meshStandardMaterial color="#533020" /></mesh>
    <mesh position={[0, 1.56, 0]} castShadow><sphereGeometry args={[.31, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#ed342c" /></mesh>
    <mesh position={[0, 1.55, .17]} scale={[1, .18, 1]} castShadow><sphereGeometry args={[.31, 10, 6]} /><meshStandardMaterial color="#e7362b" /></mesh>
    <mesh position={[0, 1.88, 0]}><sphereGeometry args={[.045, 8, 5]} /><meshStandardMaterial color="#c52525" /></mesh>
    {[-1, 1].map(side => <group key={side}><mesh position={[side * .275, 1.36, .005]}><sphereGeometry args={[.065, 7, 5]} /><meshStandardMaterial color="#f7ad74" /></mesh><mesh position={[side * .095, 1.39, .265]}><sphereGeometry args={[.035, 6, 5]} /><meshStandardMaterial color="#392b25" /></mesh><Box at={[side * .18, 1.02, -.19]} size={[.075, .5, .06]} color="#2679c9" /></group>)}
    <Box at={[0, .91, -.29]} size={[.46, .48, .21]} color="#1387dd" /><Box at={[0, .78, -.415]} size={[.35, .19, .1]} color="#1266bc" /><Box at={[0, 1.05, -.411]} size={[.13, .06, .025]} color="#f3b85e" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .025, 0]}><circleGeometry args={[.4, 16]} /><meshBasicMaterial color="#213c4d" transparent opacity={.16} depthWrite={false} /></mesh>
  </group>;
}
function Rotator({ r, game }) {
  const bar = useRef();
  useFrame(() => { bar.current.rotation.y = game.time * r.speed + r.phase; });
  return <group position={[r.x, r.y, r.z]}>
    <Cylinder at={[0, .12, 0]} args={[.65, .8, .24, 8]} color="#78848a" />
    <group ref={bar} position={[0, .65, 0]}><mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[.2, .2, r.length, 12]} /><meshStandardMaterial color="#f23c34" metalness={.3} roughness={.32} /></mesh></group>
    <Box at={[0, .65, 0]} size={[.85, .95, .85]} color="#78858d" />
    <Cylinder at={[0, 1.15, 0]} args={[.36, .36, .1, 8]} color="#a5b1b6" />
    {[-1, 1].map(side => <mesh key={side} position={[side * .28, .7, .432]}><sphereGeometry args={[.055, 6, 4]} /><meshStandardMaterial color="#d5e1e2" metalness={.6} /></mesh>)}
  </group>;
}
function Checkpoint({ game }) {
 const low=useContext(LowDetail);
  const level = getWorld(game.world);
  const flag = useRef(), glow = useRef();
  useFrame(() => { flag.current.rotation.y = Math.sin(game.time * 3) * .1; glow.current.material.opacity = game.checkpoint ? .5 + Math.sin(game.time * 3) * .1 : .15; });
  return <group position={level.flag}>
    <Cylinder at={[0, .08, 0]} args={[1.1, 1.2, .16, 12]} color="#a8afb0" /><Cylinder at={[0, .24, 0]} args={[.83, .93, .18, 12]} color="#d9d6ba" />
    <Cylinder at={[0, 1.6, 0]} args={[.06, .07, 2.8, 8]} color="#de9d35" /><mesh position={[0, 3.07, 0]}><sphereGeometry args={[.13, 8, 6]} /><meshStandardMaterial color="#ffe16f" metalness={.5} roughness={.3} /></mesh>
    <group ref={flag} position={[.64, 2.6, 0]}><Box size={[1.2, .76, .045]} color="#f54a37" />{Array.from({ length: 6 }, (_, i) => <Box key={i} at={[(i % 3) * .23 - .3, Math.floor(i / 3) * .23 - .11, .03]} size={[.22, .22, .014]} color={(i + Math.floor(i / 3)) % 2 ? '#fff4cf' : '#f54a37'} />)}</group>
    <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, .35, 0]}><ringGeometry args={[.68, .9, 40]} /><meshBasicMaterial color="#ffe15b" transparent opacity={.3} depthWrite={false} /></mesh>
    {!low&&<pointLight position={[0, 1, 0]} color="#ffcf41" intensity={1.5} distance={5} />}
  </group>;
}
const portalVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const portalFragment = `uniform float time;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float r=length(p);if(r>1.)discard;float a=atan(p.y,p.x);float spiral=pow(.5+.5*sin(a*3.+r*17.-time*3.),7.);float edge=pow(r,7.);vec3 c=mix(vec3(.025,.29,.87),vec3(.15,.87,1.),.4+r*.4);c+=spiral*.75+edge*.8;float center=exp(-r*9.);gl_FragColor=vec4(c+center, .93);}`;
function Portal({ game }) {
 const low=useContext(LowDetail);
  const level = getWorld(game.world);
  const mat = useRef(), crystal = useRef(), particles = useRef();
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  const sparkleGeometry=useMemo(()=>new THREE.IcosahedronGeometry(.035,0),[]);
  const stars = useMemo(() => Array.from({ length: 24 }, (_, i) => { const a = i * 2.399; return [Math.cos(a) * (1.4 + rand(i) * 1.3), 1.5 + rand(i + 15) * 3, Math.sin(a) * .7]; }), []);
  useFrame((state, dt) => { mat.current.uniforms.time.value += dt; crystal.current.rotation.y += dt; particles.current.rotation.y += dt * .15; });
  return <group position={level.portal}>
    <Box at={[0, .12, 1.1]} size={[4.1, .24, 2.2]} color="#c3c0a6" />
    <Box at={[0, .27, .65]} size={[3.6, .3, 1.6]} color="#dfd4b2" />
    {[-1, 1].map(side => <group key={side}>{[0, 1, 2, 3].map(i => <Box key={i} at={[side * 1.5, .5 + i * .6, 0]} size={[.65, .57, .9]} color={i % 2 ? '#9594ae' : '#aaabc2'} rotation={[0, 0, side * -.025]} />)}</group>)}
    {[0, 1, 2, 3, 4].map(i => { const a = (i / 4) * Math.PI; return <Box key={i} at={[Math.cos(a) * 1.5, 2.3 + Math.sin(a) * 1.45, 0]} size={[.77, .68, .95]} color={i % 2 ? '#b7b6c8' : '#9699b5'} rotation={[0, 0, a - Math.PI / 2]} />; })}
    <mesh position={[0, 1.95, .12]} scale={[1.25, 1.68, 1]}><circleGeometry args={[1, 64]} /><shaderMaterial ref={mat} uniforms={uniforms} vertexShader={portalVertex} fragmentShader={portalFragment} transparent side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 1.95, .1]} scale={[1.23, 1.65, 1]}><torusGeometry args={[1, .055, 8, 48]} /><meshBasicMaterial color="#9cffff" /></mesh>
    <mesh ref={crystal} position={[0, 3.95, .53]} scale={[.26, .4, .18]}><octahedronGeometry /><meshStandardMaterial color="#6ff5ff" emissive="#1cb4ee" emissiveIntensity={1.5} metalness={.2} roughness={.15} /></mesh>
    <group ref={particles}><InstanceSet geometry={sparkleGeometry} color="#b7ffff" transforms={stars.map(p=>({p}))}/></group>
    <mesh position={[0,1.95,-.02]} scale={[1.7,2.2,1]}><circleGeometry args={[1,48]}/><meshBasicMaterial color="#40d7ff" transparent opacity={.11} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide}/></mesh>{!low&&<pointLight position={[0, 2, 1]} color="#55e8ff" intensity={6} distance={7} />}
    {[-1, 1].map(side => <group key={side} position={[side * 2.7, 0, .8]}><Cylinder at={[0, .55, 0]} args={[.3, .43, 1.1, 6]} color="#aaa8a0" /><mesh position={[0, 1.45, 0]}><sphereGeometry args={[.2, 7, 6]} /><meshBasicMaterial color="#ffcd43" /></mesh><mesh position={[0, 1.64, 0]}><coneGeometry args={[.18, .55, 6]} /><meshBasicMaterial color="#ffeb86" /></mesh></group>)}
  </group>;
}
const waterFrag = `uniform float time; uniform vec3 baseColor; varying vec2 vUv;void main(){float wave=.5+.5*sin(vUv.x*50.+sin(vUv.y*9.-time*4.)*.9);vec3 c=mix(baseColor,vec3(1.),pow(wave,5.));float alpha=smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x)*(.45+vUv.y*.4);gl_FragColor=vec4(c,alpha);}`;
function Waterfall({at,width=2,height=13}) {
 const theme=useContext(WorldTheme),mat=useRef();
 const uniforms=useMemo(()=>({time:{value:0},baseColor:{value:new THREE.Color(theme.water).convertLinearToSRGB()}}),[theme]);
 useFrame((_,dt)=>{mat.current.uniforms.time.value+=dt;});
 return <mesh position={at}><planeGeometry args={[width,height]}/><shaderMaterial ref={mat} uniforms={uniforms} vertexShader={portalVertex} fragmentShader={waterFrag} transparent side={THREE.DoubleSide} depthWrite={false}/></mesh>;
}
function Castle() {
 const low=useContext(LowDetail);
  return <group position={[-24, 5, -51]} scale={1.4}><StaticIsland enabled={low}>
    <Rock w={11} d={10} seed={88} /><Box at={[0, -.15, 0]} size={[11, .4, 10]} color="#79bc45" />
    <Box at={[0, 2.1, 0]} size={[5, 4.2, 3.5]} color="#e4d8ba" /><Box at={[0, 4.1, 0]} size={[5.5, .45, 3.9]} color="#c8c3b1" />
    {[[-3, 0, 2], [3, 0, 2], [-2.5, 0, -2], [2.5, 0, -2]].map((at, i) => <group key={i} position={at}><Cylinder at={[0, 2.6 + i * .2, 0]} args={[.8, .85, 5.2 + i * .4, 8]} color="#ede1c5" /><mesh position={[0, 5.8 + i * .4, 0]}><coneGeometry args={[1.16, 2, 8]} /><meshStandardMaterial color="#ed795c" /></mesh><Box at={[0, 4, .79]} size={[.22, .8, .06]} color="#657c8b" /><Cylinder at={[0, 7.1 + i * .4, 0]} args={[.035, .035, 1, 5]} color="#dbc285" /><Box at={[.24, 7.3 + i * .4, 0]} size={[.5, .3, .035]} color="#ffb85e" /></group>)}
    <Box at={[0, 1.1, 1.78]} size={[1.3, 2.2, .05]} color="#566573" />
    <Pine at={[4.2, 0, 3]} scale={.7} /><Pine at={[-4.1, 0, 1.2]} scale={.75} />
    <Waterfall at={[1.6, -6.2, 5.05]} width={2.1} height={12} /></StaticIsland>
  </group>;
}
function Landmark() {
 const theme=useContext(WorldTheme);
 const wind=useRef();useFrame((_,dt)=>{if(wind.current)wind.current.rotation.z+=dt*.6;});
 if(theme.name==='garden')return <Castle/>;
 return <group position={[-25,5,-48]}><Rock w={16} d={14} seed={71}/><Box at={[0,-.2,0]} size={[16,.4,14]} color={theme.ground}/>
 {theme.name==='desert'?<><mesh position={[0,3,0]} rotation={[0,Math.PI/4,0]}><coneGeometry args={[6,6,4]}/><meshStandardMaterial color="#dfb772" flatShading/></mesh><mesh position={[5,1.6,2]} rotation={[0,Math.PI/4,0]}><coneGeometry args={[3,3.2,4]}/><meshStandardMaterial color="#cda166"/></mesh></>:theme.name==='ocean'?<><Cylinder at={[0,3,0]} args={[.9,1.3,6,12]} color="#fff5df"/><Cylinder at={[0,5,0]} args={[.93,.93,1,12]} color="#e8795e"/><mesh position={[0,6.6,0]}><sphereGeometry args={[.5,10,7]}/><meshBasicMaterial color="#ffed9b"/></mesh><Pine at={[-4,0,2]} scale={1.2}/></>:theme.name==='mushroom'?<Pine at={[0,0,0]} scale={4}/>:theme.name==='autumn'?<><Box at={[0,2,0]} size={[3,4,3]} color="#c5a57a"/><mesh position={[0,4.8,0]}><coneGeometry args={[2.5,2,4]}/><meshStandardMaterial color="#a55f4f"/></mesh><group ref={wind} position={[0,3,1.7]}>{[0,Math.PI/2].map(r=><Box key={r} size={[.3,6,.15]} rotation={[0,0,r]} color="#f4dfad"/>)}</group></>:['snow','aurora'].includes(theme.name)?<><mesh position={[0,4,0]}><coneGeometry args={[5,8,5]}/><meshStandardMaterial color="#8bacbf" flatShading/></mesh><mesh position={[0,6.1,0]}><coneGeometry args={[2.8,4.3,5]}/><meshStandardMaterial color="#f4fcff" flatShading/></mesh><Pine at={[-5,0,3]} scale={1.5}/></>:theme.name==='jungle'?<>{[0,1,2,3].map(i=><Box key={i} at={[0,i*.8+.4,0]} size={[7-i*1.6,.8,6-i*1.3]} color="#74896b"/>)}</>:<>{[-4,-2,0,2,4].map((x,i)=><group key={i} position={[x,0,-1]}><Box at={[0,2+i%3,0]} size={[1.4,4+i%3*2,1.4]} color={theme.rock[0]}/><mesh position={[0,5+i%3,0]}><octahedronGeometry args={[.7]}/><meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={1.1}/></mesh></group>)}</>}
 <Waterfall at={[3,-7,7.05]} width={2.5} height={14}/></group>;
}
function Weather({game}) {
 const theme=useContext(WorldTheme),ref=useRef();
 const count=theme.weather==='rain'?150:85;
 const positions=useMemo(()=>new Float32Array(Array.from({length:count*3},(_,i)=>(rand(i+45)-.5)*(i%3===1?18:36))),[count]);
 useFrame((state,dt)=>{if(!ref.current)return;ref.current.position.set(game.x,game.y+6,game.z-12);const attr=ref.current.geometry.attributes.position;for(let i=0;i<count;i++){attr.array[i*3+1]-=dt*(theme.weather==='rain'?11:theme.weather==='embers'?-1.2:1.7);if(attr.array[i*3+1]<-9)attr.array[i*3+1]=9;if(attr.array[i*3+1]>9)attr.array[i*3+1]=-9;}attr.needsUpdate=true;});
 if(!theme.weather||theme.weather==='none')return null;
 return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial color={theme.weather==='snow'?'#ffffff':theme.accent} size={theme.weather==='rain'?.065:.11} transparent opacity={.75} depthWrite={false} sizeAttenuation/></points>;
}
function Background() {
 const low=useContext(LowDetail);
 const drift=useRef();
 useFrame(({clock})=>{if(drift.current)drift.current.position.x=Math.sin(clock.elapsedTime*.025)*3;});
 const theme=useContext(WorldTheme);
 const sphere=useMemo(()=>new THREE.IcosahedronGeometry(1,2),[]);
 const clouds=useMemo(()=>Array.from({length:low?24:55},(_,i)=>({p:[(rand(i+6)-.5)*135,-9+rand(i+9)*5,25-rand(i+21)*180],s:[3+rand(i+3)*6,1+rand(i)*2,2+rand(i+4)*3]})),[low]);
 const high=useMemo(()=>Array.from({length:low?10:24},(_,i)=>({p:[(rand(i+29)-.5)*200,19+rand(i+81)*8,-35-rand(i+2)*150],s:[5+rand(i)*8,1.4+rand(i+3)*3,2+rand(i+4)*4]})),[low]);
 const uniforms=useMemo(()=>({top:{value:new THREE.Color(theme.skyTop).convertLinearToSRGB()},bottom:{value:new THREE.Color(theme.skyBottom).convertLinearToSRGB()}}),[theme]);
 return <><mesh><sphereGeometry args={[190,24,16]}/><shaderMaterial side={THREE.BackSide} uniforms={uniforms} vertexShader={`varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`uniform vec3 top;uniform vec3 bottom;varying vec3 v;void main(){float h=clamp(normalize(v).y*.8+.1,0.,1.);gl_FragColor=vec4(mix(bottom,top,h),1.);}`} depthWrite={false}/></mesh>
 <group ref={drift}><InstanceSet geometry={sphere} color={theme.cloud} transforms={clouds}/><InstanceSet geometry={sphere} color={theme.cloud} transforms={high}/></group><SunGlow night={['moon','aurora','storm'].includes(theme.name)}/><Landmark/>
 {Array.from({length:low?6:12},(_,i)=>{const x=(i%2?-1:1)*(19+rand(i+2)*25),z=4-i*11,y=-3+rand(i+4)*10,s=3+rand(i+6)*4;return <group key={i} position={[x,y,z]}><StaticIsland enabled={low}><Rock w={s} d={s} seed={i+50}/><Box at={[0,-.2,0]} size={[s,.4,s]} color={theme.ground}/><Pine at={[0,0,-.3]} scale={.5+rand(i)*.4}/>{i%3===0&&<Waterfall at={[.7,-5.5,s/2+.02]} width={1.1} height={11}/>}</StaticIsland></group>;})}
 {theme.name==='moon'&&<group position={[25,26,-90]}><mesh><sphereGeometry args={[10,24,16]}/><meshStandardMaterial color="#d4c7e7"/></mesh><mesh rotation={[1.2,.1,.3]}><torusGeometry args={[14,.4,8,64]}/><meshBasicMaterial color="#a8c7f2"/></mesh></group>}
 {theme.name==='aurora'&&[0,1,2].map(i=><mesh key={i} position={[i*18-18,23+i*3,-70-i*8]} rotation={[0,0,i*.1-.2]}><planeGeometry args={[100,8]}/><meshBasicMaterial color={i%2?'#80a4ff':'#59f7bc'} transparent opacity={.15} depthWrite={false} side={THREE.DoubleSide}/></mesh>)}
 </>;
}
function Sign({ at, children }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 160;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#99602e'; ctx.fillRect(0, 0, 512, 160); ctx.fillStyle = '#b88142'; ctx.fillRect(8, 8, 496, 144); ctx.fillStyle = '#fff6d7'; ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(children, 256, 82);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [children]);
  return <group position={at}><Box at={[0, .6, 0]} size={[.15, 1.2, .15]} color="#885b32" /><mesh position={[0, 1.2, 0]}><boxGeometry args={[1.7, .55, .12]} /><meshStandardMaterial map={texture} /></mesh></group>;
}
function Celebration({ game }) {
  const level = getWorld(game.world);
  const ref = useRef();
  const transforms = useMemo(() => Array.from({ length: 65 }, (_, i) => ({ p: [(rand(i + 4) - .5) * 10, 2 + rand(i) * 6, level.portal[2] + (rand(i + 2) - .5) * 6], s: [.07, .15, .035], r: [i, i * 2, i * 3] })), []);
  const geometry = useMemo(() => new THREE.BoxGeometry(), []);
  useFrame((_, dt) => { ref.current.visible = game.status === 'won'; if (game.status === 'won') ref.current.rotation.y += dt * .2; });
  return <group ref={ref}><InstanceSet geometry={geometry} transforms={transforms} color="#ffdd5e" /></group>;
}
function LandingMarker({game}){
 const ref=useRef();useFrame(()=>{const p=landingPreview(game);ref.current.visible=!!p&&game.status==='playing';if(p)ref.current.position.set(p.x,p.y,p.z);});
 return <group ref={ref}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.33,.44,28]}/><meshBasicMaterial color="#a4ffce" transparent opacity={.9} depthWrite={false}/></mesh><mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.3,20]}/><meshBasicMaterial color="#53caa5" transparent opacity={.22} depthWrite={false}/></mesh></group>;
}
function Scene({ game, input, onStep, quality, cameraMode, mobile, onSlow, onStats }) {
  const level = getWorld(game.world), theme = getTheme(level);
  const cameraReady = useRef(false), previousStatus = useRef(game.status), accumulator = useRef(0);
  const target = useMemo(() => new THREE.Vector3(), []);
  const cameraHeight=useRef(game.y);
  useFrame(({ camera }, delta) => {
    if (game.status === 'playing') {
      accumulator.current += Math.min(delta, .1);
      while (accumulator.current >= 1 / 120) { tick(game, input, 1 / 120); accumulator.current -= 1 / 120; }
    } else accumulator.current = 0;
    if (previousStatus.current !== 'playing' && game.status === 'playing' && game.time < .2) cameraReady.current = false;
    previousStatus.current = game.status;
    const wide=cameraMode==='wide',portrait=camera.aspect<.85;
    const index=level.platforms.findIndex(p=>game.z>p.z-p.d/2-1.5),next=level.platforms[Math.min(level.platforms.length-1,Math.max(0,index)+1)];
    const lookX=mobile?game.x*.76+next.x*.24:game.x*.93;
    const floor=game.lastSafe?.y??0;
    cameraHeight.current=THREE.MathUtils.lerp(cameraHeight.current,floor+Math.max(0,game.y-floor)*.35,1-Math.exp(-delta*5));
    const height=cameraHeight.current;
    const speed=Math.min(1,Math.hypot(game.vx,game.vz)/6);const fov=(mobile?(portrait?68:61):57)+(game.ground&&speed>.8?1.8:0);camera.fov=THREE.MathUtils.lerp(camera.fov,fov,1-Math.exp(-delta*5));camera.updateProjectionMatrix();
    target.set(mobile?game.x*.86+next.x*.14:game.x*.85,height+(wide?8.2:mobile?6.2:4.9),game.z+(wide?12:mobile?10:8));
    if(!cameraReady.current){camera.position.copy(target);cameraReady.current=true;}
    camera.position.lerp(target,1-Math.exp(-delta*6));
    camera.lookAt(lookX,height+.8,game.z-(wide?4:mobile?5.4:4.5));
    onStep();
  }, -2);
  return <LowDetail.Provider value={quality==='low'}><WorldTheme.Provider value={theme}>
    <fog attach="fog" args={[theme.skyBottom, 50, 170]} />
    <hemisphereLight args={[theme.cloud, theme.rock[2], 2.1]} />
    <directionalLight position={[-18, 28, 14]} intensity={3.2} color="#fff2c8" castShadow={quality === 'high'} shadow-mapSize={[2048, 2048]} shadow-camera-left={-32} shadow-camera-right={30} shadow-camera-top={25} shadow-camera-bottom={-145} shadow-camera-far={210} shadow-radius={3} shadow-blurSamples={8} shadow-bias={-.0005} shadow-normalBias={.035} />
    <Background /><Weather game={game}/><ParticleEffects game={game} low={quality==='low'}/><FrameMonitor game={game} onSlow={onSlow} onStats={onStats}/>
    {level.platforms.map((p, i) => <Island key={p.id} p={p} index={i} game={game} />)}
    {level.coins.map((at, i) => <Coin key={i} at={at} index={i} game={game} />)}
    {level.rotators.map((r, i) => <Rotator key={i} r={r} game={game} />)}
    {level.hazards.map((h, i) => <group key={i} position={[h.x, h.y, h.z]}><Box at={[0, .05, 0]} size={[1.65, .1, 1.4]} color="#687782" />{[-.5, 0, .5].flatMap(x => [-.3, .3].map(z => <mesh key={`${x},${z}`} position={[x, .39, z]} castShadow><coneGeometry args={[.2, .7, 7]} /><meshStandardMaterial color="#c4d7e2" metalness={.75} roughness={.25} /></mesh>))}</group>)}
    <Sign at={[-3.1, 0, 3.2]}>START ↑</Sign><Sign at={[2.5, 0, -2.9]}>JUMP ↑</Sign><Sign at={[level.checkpoint[0]+3.3,level.checkpoint[1],level.checkpoint[2]-3]}>WAIT · JUMP</Sign>
    <Checkpoint game={game} /><Portal game={game} /><Character game={game} /><LandingMarker game={game}/><Celebration game={game} />
  </WorldTheme.Provider></LowDetail.Provider>;
}


export default memo(Scene);




