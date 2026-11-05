import { movementVector } from './controls.js';
import { EXTRA_WORLDS } from './worlds.js';
// World-space units are metres. Player y is the sole of the character's feet.
export const PLATFORMS = [
  { id: 'start', x: 0, z: 2, w: 11, d: 12, y: 0 },
  { id: 'step', x: 0, z: -10, w: 7, d: 6, y: .4 },
  { id: 'grove', x: 4, z: -19, w: 9, d: 8, y: .7 },
  { id: 'checkpoint', x: 0, z: -30, w: 10, d: 9, y: 1 },
  { id: 'ferry', x: 0, z: -40, w: 4.5, d: 5, y: 1, moving: true },
  { id: 'ruins', x: -3, z: -49, w: 9, d: 8, y: 1 },
  { id: 'finish', x: 0, z: -61, w: 12, d: 12, y: 1.2 },
];
export const COINS = [
  [0, 1.1, 1], [0, 1.1, -1], [0, 1.1, -3],
  [0, 1.5, -8], [1.8, 1.5, -10], [0, 1.5, -12],
  [3, 1.8, -16.5], [5.8, 1.8, -18], [5.8, 1.8, -21], [2, 1.8, -22],
  [0, 2.1, -27], [-2.4, 2.1, -29], [0, 2.1, -31.5], [1.4, 2.1, -33],
  [-3, 2.1, -46.5], [-5.5, 2.1, -48], [-5.5, 2.1, -51], [-2, 2.1, -52],
  [-1, 2.3, -56.5], [0, 2.3, -58.5], [0, 2.3, -60.5], [3.7, 2.3, -62],
];
export const HAZARDS = [
  { x: 4, z: -20, y: .7, r: .9 },
  { x: -1.3, z: -49, y: 1, r: .8 },
  { x: 2.7, z: -59, y: 1.2, r: .8 },
];
export const ROTATORS = [
  { x: 0, z: -10, y: .4, length: 5.8, speed: .85, phase: 0 },
  { x: -3, z: -49.5, y: 1, length: 6.5, speed: -1, phase: .7 },
];
export const WORLDS = [
  {
    id: 0, name: 'Floating Gardens', subtitle: 'A path above the clouds',
    platforms: PLATFORMS, coins: COINS, hazards: HAZARDS, rotators: ROTATORS,
    spawn: [0, 0, 4], checkpoint: [0, 1, -29], flag: [-2.7, 1, -29], portal: [0, 1.2, -63.5],
    stages: [[-6, 'The first leap'], [-24, 'Spinning gardens'], [-35, 'The checkpoint'], [-44, 'The drifting stone'], [-54, 'The final trial'], [-Infinity, 'The sky gate']],
  },
  {
    id: 1, name: 'Ember Canyon', subtitle: 'Across the crystal frontier',
    platforms: [
      { id: 'start', x: 0, z: 2, w: 10, d: 12, y: 0 },
      { id: 'step', x: -3, z: -10, w: 7, d: 6, y: .5 },
      { id: 'grove', x: -6, z: -20, w: 8, d: 9, y: 1 },
      { id: 'checkpoint', x: -1, z: -31, w: 10, d: 9, y: 1.2 },
      { id: 'ferry', x: 2, z: -41, w: 4.5, d: 5, y: 1.2, moving: true, amplitude: 2.5, rate: .7 },
      { id: 'ruins', x: 5, z: -50, w: 9, d: 8, y: 1.4 },
      { id: 'ferry2', x: 2, z: -60, w: 4.5, d: 5, y: 1.4, moving: true, amplitude: 1.7, rate: .9, phase: 1 },
      { id: 'finish', x: -1, z: -70, w: 12, d: 12, y: 1.5 },
    ],
    coins: [[0,1.1,1],[0,1.1,-1],[0,1.1,-3],[-3,1.6,-8],[-5,1.6,-10],[-3,1.6,-12],[-6,2.1,-17],[-8,2.1,-20],[-8,2.1,-23],[-4.5,2.1,-23],[-1,2.3,-28],[-3.4,2.3,-30],[-1,2.3,-33],[1,2.3,-34],[5,2.5,-47.5],[7.4,2.5,-49],[7.4,2.5,-52],[3.8,2.5,-52],[-1,2.6,-66],[-1,2.6,-68],[-1,2.6,-70],[2,2.6,-71]],
    hazards: [{x:-5.4,z:-20,y:1,r:.9},{x:3.5,z:-50,y:1.4,r:.8},{x:1.8,z:-68,y:1.5,r:.8}],
    rotators: [{x:-3,z:-10,y:.5,length:5.8,speed:-1.05,phase:.5},{x:5,z:-50,y:1.4,length:6.4,speed:1.15,phase:.2}],
    spawn: [0,0,4], checkpoint: [-1,1.2,-30], flag: [-3.7,1.2,-30], portal: [-1,1.5,-72.5],
    stages: [[-6,'Into the canyon'],[-25,'The crystal turn'],[-36,'Ember checkpoint'],[-45,'The first crossing'],[-55,'The turning forge'],[-64,'The last crossing'],[-Infinity,'The ember gate']],
  },
];
WORLDS.push(...EXTRA_WORLDS);
export function getWorld(id = 0) { return WORLDS[id] || WORLDS[0]; }
export const progressKey = 'adventure-runner-worlds-v1';
export function readProgress(storage) {
 const empty=()=>({unlocked:0,completed:WORLDS.map(()=>false),played:WORLDS.map(()=>false),stars:WORLDS.map(()=>0),tasks:WORLDS.map(()=>({coins:0,checkpoint:false}))});
 try {
  const v=JSON.parse(storage.getItem(progressKey));const result=empty();
  result.unlocked=Math.min(WORLDS.length-1,Math.max(0,Number.isInteger(v?.unlocked)?v.unlocked:0));
  for(const w of WORLDS){const i=w.id;result.completed[i]=v?.completed?.[i]===true;result.played[i]=v?.played?.[i]===true||result.completed[i];result.stars[i]=Math.max(result.completed[i]?1:0,Math.min(3,Number.isInteger(v?.stars?.[i])?v.stars[i]:0));result.tasks[i]={coins:Math.min(w.coins.length,Math.max(0,Number.isInteger(v?.tasks?.[i]?.coins)?v.tasks[i].coins:0)),checkpoint:v?.tasks?.[i]?.checkpoint===true};}
  return result;
 }catch{return empty();}
}
function writeProgress(storage,p){try{storage.setItem(progressKey,JSON.stringify(p));}catch{}return p;}
export function starsForRun(coins,total,time=Infinity,hearts=0,par=60){
 const coinMedal=coins>=total?3:coins>=Math.ceil(total*.6)?2:1;
 if(!Number.isFinite(time))return coinMedal; // Legacy callers/saves preserve their original coin ratings.
 return 1+Number(coins>=Math.ceil(total*.6))+Number(time<=par&&hearts>=2);
}
export function runMedals(g){const world=getWorld(g.world),par=world.platforms.length*7;return {time:g.time<=par,coins:g.coins.size>=Math.ceil(world.coins.length*.6),hearts:g.health>=2,par};}
export function recordRunProgress(storage,g){
 const p=readProgress(storage),i=g.world;if(!WORLDS[i]||g.status==='ready')return p;
 p.played[i]=true;p.tasks[i].coins=Math.max(p.tasks[i].coins,g.coins.size);p.tasks[i].checkpoint ||= g.checkpoint;
 return writeProgress(storage,p);
}
export function completeWorld(storage,id,coins=0,time=Infinity,hearts=0){
 const p=readProgress(storage);if(!Number.isInteger(id)||!WORLDS[id])return p;
 p.unlocked=Math.max(p.unlocked,Math.min(WORLDS.length-1,id+1));p.completed[id]=true;p.played[id]=true;
 p.stars[id]=Math.max(p.stars[id],starsForRun(coins,WORLDS[id].coins.length,time,hearts,WORLDS[id].platforms.length*7));
 p.tasks[id].coins=Math.max(p.tasks[id].coins,Math.min(WORLDS[id].coins.length,coins));
 return writeProgress(storage,p);
}
export const resumeKey='adventure-runner-resume-v1';
export function clearRun(storage){try{storage.setItem(resumeKey,'null');}catch{}}
export function saveRun(storage,g){
 if(!['playing','paused'].includes(g.status)||g.health<1)return null;
 const w=getWorld(g.world),safe=g.lastSafe||{x:w.spawn[0],y:w.spawn[1],z:w.spawn[2],ground:'start'};
 const data={version:1,world:g.world,time:g.time,health:g.health,coins:[...g.coins],checkpoint:g.checkpoint,deaths:g.deaths,safe:{...safe}};
 try{storage.setItem(resumeKey,JSON.stringify(data));return data;}catch{return null;}
}
export function readRun(storage){
 try{
  const v=JSON.parse(storage.getItem(resumeKey));if(v?.version!==1||!Number.isInteger(v.world)||!WORLDS[v.world]||!Number.isFinite(v.time)||v.time<0||!Number.isInteger(v.health)||v.health<1||v.health>3||!Array.isArray(v.coins)||!v.safe)return null;
  const w=getWorld(v.world),p=w.platforms.find(p=>p.id===v.safe.ground&&!p.moving);
  if(!p||![v.safe.x,v.safe.y,v.safe.z].every(Number.isFinite)||Math.abs(v.safe.x-p.x)>p.w/2+.18||Math.abs(v.safe.z-p.z)>p.d/2+.18||Math.abs(v.safe.y-p.y)>.01)return null;
  return {...v,checkpoint:v.checkpoint===true,deaths:Number.isInteger(v.deaths)&&v.deaths>=0?v.deaths:0,coins:[...new Set(v.coins.filter(i=>Number.isInteger(i)&&i>=0&&i<w.coins.length))]};
 }catch{return null;}
}
export function restoreRun(storage){
 const v=readRun(storage);if(!v)return null;
 const g=createGame(v.world);Object.assign(g,{time:v.time,health:v.health,checkpoint:v.checkpoint,deaths:v.deaths,coins:new Set(v.coins),x:v.safe.x,y:v.safe.y,z:v.safe.z,ground:v.safe.ground,lastSafe:{...v.safe},invincible:2,status:'playing',toast:'Adventure restored · back on the trail',toastTime:3});return g;
}
export const bestKey = 'adventure-runner-best-v1';
export function platformAt(p, time) {
  return { ...p, x: p.x + (p.moving ? Math.sin(time * (p.rate ?? .8) + (p.phase ?? 0)) * (p.amplitude ?? 3) : 0) };
}
export function createGame(world = 0) {
  return {
    world, x: 0, y: 0, z: 4, vy: 0, vx:0,vz:0, facing: Math.PI, ground: 'start',
    time: 0, health: 3, coins: new Set(), checkpoint: false, status: 'ready',
    invincible: 0, toast: '', toastTime: 0, jumpHeld: false, jumpBuffer: 0,
    coyote: .1, steps: 0, moving: false, deaths: 0, events: [], jumpAge:0,jumpCut:false,landTime:-100,fade:0,fx:[],fxSerial:0,dustClock:0, lastSafe:{x:0,y:0,z:4,ground:'start'},
  };
}
export function restart(g, world = g.world) {
  Object.assign(g, createGame(world));
  g.status = 'playing';
  g.events.push('start');
}
export function emitEffect(g,type,x=g.x,y=g.y,z=g.z){g.fx.push({id:++g.fxSerial,type,x,y,z,time:g.time});if(g.fx.length>32)g.fx.shift();}
export function respawn(g) {
  emitEffect(g,'hit');
  g.fade=.22;
  g.health--;
  g.deaths++;
  g.invincible = 2;
  const level = getWorld(g.world);
  [g.x, g.y, g.z] = g.checkpoint ? level.checkpoint : level.spawn;
  g.vy = 0;
  g.ground = g.checkpoint ? 'checkpoint' : 'start';
  g.lastSafe={x:g.x,y:g.y,z:g.z,ground:g.ground};
  g.coyote = .1;
  g.jumpBuffer = 0;
  g.facing = Math.PI;
  g.toast = g.health > 0 ? 'Safe landing · try that jump again' : 'The trail is calling. Try again.';
  g.toastTime = 2.5;
  g.events.push('hurt');
  if (g.health <= 0) g.status = 'gameover';
}
export function touchesRotator(g, r) {
  if (g.y > r.y + 1.05 || g.y + 1.5 < r.y + .35) return false;
  const angle = g.time * r.speed + r.phase;
  const dx = g.x - r.x, dz = g.z - r.z;
  const along = dx * Math.cos(angle) - dz * Math.sin(angle);
  const across = dx * Math.sin(angle) + dz * Math.cos(angle);
  return Math.abs(along) < r.length / 2 + .3 && Math.abs(across) < .48;
}
export function tick(g, input, dt) {
  if (g.status !== 'playing') return;
  const level = getWorld(g.world);
  dt = Math.max(0, Math.min(dt, .05));
  g.time += dt;
  g.invincible = Math.max(0, g.invincible - dt);
  g.toastTime = Math.max(0, g.toastTime - dt);
  g.fade=Math.max(0,g.fade-dt);
  g.jumpAge+=dt;
  const previousGround=g.ground;
  const carrier = level.platforms.find(p => p.id === g.ground && p.moving);
  if (carrier) g.x += platformAt(carrier, g.time).x - platformAt(carrier, g.time - dt).x;
  const movement=movementVector(input),dx=movement.x,dz=movement.z;
  g.moving=movement.strength>0;
  if(g.moving){g.steps+=dt*movement.strength;g.facing=Math.atan2(dx,dz);}
  g.vx=dx*6;g.vz=dz*6;
  g.coyote = g.ground ? .1 : Math.max(0, g.coyote - dt);
  g.jumpBuffer = input.jumpQueued || (input.jump && !g.jumpHeld) ? .14 : Math.max(0, g.jumpBuffer - dt);
  input.jumpQueued=false;
  g.jumpHeld = !!input.jump;
  if (g.jumpBuffer > 0 && g.coyote > 0) {
    g.vy = 9.7; g.ground = null; g.coyote = 0; g.jumpBuffer = 0;g.jumpAge=0;g.jumpCut=false;
    g.events.push('jump');
  }
  // Minimum launch time makes quick taps useful; holding retains the full jump envelope.
  if(!input.jump&&!g.jumpCut&&g.jumpAge>.14&&g.vy>0&&!g.ground){g.vy*=.55;g.jumpCut=true;}
  const impactVelocity=g.vy;
  const previousY = g.y, previousX = g.x;
  g.x += dx * 6 * dt; g.z += dz * 6 * dt;
  g.vy -= 19 * dt; g.y += g.vy * dt;
  // Railings block lateral movement at their visible height; jumping clears them.
  for (const p of level.platforms) {
    if (p.moving || Math.abs(g.z - p.z - p.d * .07) > p.d * .3 + .12
        || g.y > p.y + .95 || g.y + 1.8 < p.y) continue;
    for (const side of [-1, 1]) {
      const wall = p.x + side * (p.w / 2 - .35);
      const before = previousX - wall, after = g.x - wall;
      if (Math.abs(after) < .3 && Math.abs(before) >= Math.abs(after)) {
        g.x = wall + (before < 0 ? -.3 : .3);
      } else if (before * after < 0) g.x = wall + (before < 0 ? -.3 : .3);
    }
  }
  g.ground = null;
  if (g.vy <= 0) {
    for (const base of level.platforms) {
      const p = platformAt(base, g.time);
      if (Math.abs(g.x - p.x) < p.w / 2 + .18 && Math.abs(g.z - p.z) < p.d / 2 + .18
          && previousY >= p.y - .04 && g.y <= p.y) {
        g.y = p.y; g.vy = 0; g.ground = p.id;
        if(!previousGround&&impactVelocity<-2){g.landTime=g.time;g.events.push('land');emitEffect(g,'land');}
        break;
      }
    }
  }
  for (let i = 0; i < level.coins.length; i++) {
    const c = level.coins[i];
    if (!g.coins.has(i) && Math.hypot(g.x - c[0], g.y + .8 - c[1], g.z - c[2]) < 1) {
      g.coins.add(i); g.events.push('coin');emitEffect(g,'coin',c[0],c[1],c[2]);
    }
  }
  if (!g.checkpoint && g.ground === 'checkpoint') {
    g.checkpoint = true; g.health = 3;
    g.toast = 'Checkpoint activated · all hearts restored'; g.toastTime = 3;
    g.events.push('checkpoint');g.fade=.12;emitEffect(g,'checkpoint');
  }
  const hitSpikes = level.hazards.some(h => Math.hypot(g.x - h.x, g.z - h.z) < h.r + .28
    && g.y < h.y + .65 && g.y + 1.5 > h.y);
  if (g.y < -9 || (g.invincible <= 0 && (hitSpikes || level.rotators.some(r => touchesRotator(g, r))))) {
    respawn(g); return;
  }
  if(g.ground&&g.moving){g.dustClock+=dt;if(g.dustClock>.12){g.dustClock=0;emitEffect(g,'dust');}}
  if(g.ground && !level.platforms.find(p=>p.id===g.ground)?.moving)g.lastSafe={x:g.x,y:g.y,z:g.z,ground:g.ground};
  if (g.ground === 'finish' && Math.hypot(g.x - level.portal[0], g.z - level.portal[2]) < 1.5) {
    g.status = 'won'; g.events.push('win');
  }
}
export function formatTime(seconds) {
  const cs = Math.floor(Math.max(0, Number.isFinite(seconds) ? seconds : 0) * 100);
  return `${Math.floor(cs / 6000).toString().padStart(2, '0')}:${(Math.floor(cs / 100) % 60).toString().padStart(2, '0')}.${(cs % 100).toString().padStart(2, '0')}`;
}
export function readBest(storage, world = 0) {
  try {
    const value = Number(storage.getItem(world === 0 ? bestKey : `${bestKey}-world-${world}`));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch { return null; }
}
export function saveBest(storage, time, world = 0) {
  const previous = readBest(storage, world);
  const best = previous ? Math.min(previous, time) : time;
  try { storage.setItem(world === 0 ? bestKey : `${bestKey}-world-${world}`, String(best)); } catch { /* Private mode can deny storage. */ }
  return best;
}



export function landingPreview(g){
 if(g.ground)return null;
 const world=getWorld(g.world);let result=null;
 for(const base of world.platforms){
  const discriminant=g.vy*g.vy+38*(g.y-base.y);if(discriminant<0)continue;
  const t=(g.vy+Math.sqrt(discriminant))/19;if(t<0||t>1.6)continue;
  const p=platformAt(base,g.time+t),x=g.x+(g.vx||0)*t,z=g.z+(g.vz||0)*t;
  if(Math.abs(x-p.x)<p.w/2&&Math.abs(z-p.z)<p.d/2&&(!result||t<result.t))result={x,y:p.y+.035,z,t};
 }
 return result;
}
