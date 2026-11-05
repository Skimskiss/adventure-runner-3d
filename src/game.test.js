import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, restart, tick, PLATFORMS, ROTATORS, COINS, platformAt, touchesRotator, formatTime, readBest, saveBest } from './game.js';
const frames = (g, input, n) => { for (let i = 0; i < n; i++) tick(g, input, 1 / 120); };
const started = () => { const g = createGame(); restart(g); return g; };
test('ready/paused states freeze physics, diagonal speed matches straight movement', () => {
  const g = createGame(); tick(g, { forward: true }, .05); assert.equal(g.z, 4);
  restart(g); frames(g, { forward: true }, 60); assert.ok(Math.abs(g.z - 1) < .01);
  g.status = 'paused'; const t = g.time; frames(g, { forward: true }, 120); assert.equal(g.time, t);
  const d = started(); frames(d, { forward: true, right: true }, 30); assert.ok(Math.abs(Math.hypot(d.x, d.z - 4) - 1.5) < .01);
});
test('jump lands, held jump does not bounce, falling consumes hearts and ends the run', () => {
  const g = started(); frames(g, { jump: true }, 150); assert.equal(g.ground, 'start'); assert.equal(g.y, 0);
  for (let i = 0; i < 3; i++) { g.y = -11; tick(g, {}, 1 / 120); }
  assert.equal(g.health, 0); assert.equal(g.status, 'gameover'); assert.equal(g.deaths, 3);
});
test('coins can only be collected once and remain collected after a fall', () => {
  const g = started(); g.z = COINS[0][2]; frames(g, {}, 3); assert.equal(g.coins.size, 1);
  frames(g, {}, 120); assert.equal(g.coins.size, 1); g.y = -11; tick(g, {}, 1 / 120); assert.equal(g.coins.size, 1);
});
test('checkpoint restores health and sets the new respawn location', () => {
  const g = started(); g.health = 1; g.z = -29; g.y = 1; frames(g, {}, 3);
  assert.ok(g.checkpoint); assert.equal(g.health, 3); g.y = -12; tick(g, {}, 1 / 120);
  assert.equal(g.z, -29); assert.equal(g.health, 2); assert.equal(g.ground, 'checkpoint');
});
test('spikes damage on contact, grace period prevents repeated damage, jumping clears them', () => {
  const g = started(); g.x = 4; g.z = -20; g.y = .7; frames(g, {}, 1); assert.equal(g.health, 2);
  g.x = 4; g.z = -20; g.y = .7; frames(g, {}, 1); assert.equal(g.health, 2);
  g.invincible = 0; g.y = 2; frames(g, {}, 1); assert.equal(g.health, 2);
});
test('rotating bar collider follows the visible angle and has jump clearance', () => {
  const g = started(), r = ROTATORS[0]; g.time = 0; g.x = 2; g.z = -10; g.y = .4;
  assert.equal(touchesRotator(g, r), true); g.y = 1.6; assert.equal(touchesRotator(g, r), false);
  g.y = .4; g.time = Math.PI / (2 * r.speed); assert.equal(touchesRotator(g, r), false);
  g.time = 0; frames(g, {}, 1); assert.equal(g.health, 2);
});
test('moving platform carries an idle rider without slipping', () => {
  const g = started(); g.z = -40; g.y = 1; g.ground = 'ferry'; frames(g, {}, 360);
  assert.equal(g.ground, 'ferry'); assert.ok(Math.abs(g.x - platformAt(PLATFORMS[4], g.time).x) < .01);
});
test('all island-to-island gaps fit within the jump envelope', () => {
  for (let i = 0; i < PLATFORMS.length - 1; i++) {
    const a = platformAt(PLATFORMS[i], 0), b = platformAt(PLATFORMS[i + 1], 1), g = started();
    g.x = a.x; g.z = a.z - a.d / 2 + .7; g.y = a.y; g.ground = a.id; g.invincible = 10;
    let landed = false;
    for (let n = 0; n < 180; n++) {
      tick(g, { jump: n === 0, forward: g.z > b.z + 1, left: g.x > b.x + .1, right: g.x < b.x - .1 }, 1 / 120);
      if (g.ground === b.id) { landed = true; break; }
    }
    assert.ok(landed, `${a.id} -> ${b.id}`);
  }
});
test('full unmodified run reaches victory with coins, all three hearts and an activated checkpoint', () => {
  const g = started();
  // These waypoints steer only through ordinary movement and jump input. No teleports or immunity.
  const route = [
    [0, -3.4, false], [2.7, -7.5, true], [2.7, -12, true], [4, -16.5, true],
    [6.4, -21.7, false], [2, -22.4, false], [0, -27, true], [0, -33.8, false],
    [0, -38.5, true], ['ride', -41.8, false], [-3, -45.8, true], [-3, -47, false],
    [-5.6, -51.8, true], [-2.3, -53.02, true], [0, -56.5, true], [0, -63.5, false],
  ];
  for (let i = 0; i < route.length; i++) {
    let [x, z, jump] = route[i]; const ride = x === 'ride'; let reached = false;
    for (let n = 0; n < 600; n++) {
      if (ride) x = platformAt(PLATFORMS[4], g.time).x;
      const dx = x - g.x, dz = z - g.z;
      if (Math.hypot(dx, dz) < .18 && (!jump || g.ground) && (!ride || x < -1)) { reached = true; break; }
      tick(g, { left: dx < -.1, right: dx > .1, forward: dz < -.1, back: dz > .1, jump: jump && n < 90 }, 1 / 120);
      assert.equal(g.health, 3, `damage on waypoint ${i}`);
      if (g.status === 'won') { reached = true; break; }
    }
    assert.ok(reached, `waypoint ${i} was not reachable`);
  }
  assert.equal(g.status, 'won'); assert.ok(g.checkpoint); assert.ok(g.coins.size >= 12); assert.equal(g.deaths, 0);
  const t = g.time; frames(g, { forward: true }, 100); assert.equal(g.time, t);
});
test('restart resets everything, and local best time retains the fastest completed run', () => {
  const g = started(); g.z = -63.5; g.y = 1.2; frames(g, {}, 1); assert.equal(g.status, 'won');
  g.coins.add(0); restart(g); assert.equal(g.coins.size, 0); assert.equal(g.checkpoint, false); assert.equal(g.time, 0);
  const memory = new Map(), storage = { getItem: k => memory.get(k), setItem: (k, v) => memory.set(k, v) };
  assert.equal(readBest(storage), null); assert.equal(saveBest(storage, 30), 30); assert.equal(saveBest(storage, 35), 30); assert.equal(saveBest(storage, 27), 27);
  assert.equal(formatTime(65.123), '01:05.12'); assert.equal(formatTime(59.999), '00:59.99');
});
test('blocked or corrupted storage cannot break the game', () => {
  const broken = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } };
  assert.equal(readBest(broken), null); assert.equal(saveBest(broken, 10), 10);
  assert.equal(readBest({ getItem: () => 'Infinity' }), null); assert.equal(readBest({ getItem: () => '-1' }), null);
});

test('world 2 has a different map, its own checkpoint, and two moving platforms', async () => {
  const { getWorld } = await import('./game.js');
  const a = getWorld(0), b = getWorld(1);
  assert.notDeepEqual(a.platforms, b.platforms); assert.equal(b.platforms.filter(p => p.moving).length, 2);
  const g = createGame(1); restart(g); [g.x, g.y, g.z] = b.checkpoint; g.health = 1;
  frames(g, {}, 1); assert.equal(g.health, 3); g.y = -10; frames(g, {}, 1);
  assert.deepEqual([g.x, g.y, g.z], b.checkpoint); assert.equal(g.health, 2);
});
test('world unlock and best records persist independently and tolerate blocked storage', async () => {
  const { completeWorld, readProgress } = await import('./game.js');
  const memory = new Map(), storage = { getItem: k => memory.get(k), setItem: (k, v) => memory.set(k, v) };
  assert.equal(readProgress(storage).unlocked, 0);
  assert.equal(completeWorld(storage, 0).unlocked, 1); assert.equal(readProgress(storage).completed[0], true);
  completeWorld(storage, 1); assert.deepEqual(readProgress(storage).completed.slice(0,2), [true, true]);
  saveBest(storage, 20, 0); saveBest(storage, 30, 1); assert.equal(readBest(storage, 0), 20); assert.equal(readBest(storage, 1), 30);
  const blocked = {getItem(){throw Error('denied')},setItem(){throw Error('denied')}};
  assert.equal(completeWorld(blocked, 0).unlocked, 1);
});
test('world 2 completes through actual input with both ferries, no damage, and the correct portal', async () => {
  const { getWorld } = await import('./game.js');
  const g = createGame(1); restart(g); const level = getWorld(1);
  const route = [[-3,-3.4,false],[-5.6,-7.5,true],[-5.6,-12,true],[-6,-17,true],[-8,-23,false],[-4.6,-24,false],[-1,-28,true],[1,-34.8,false],[2,-39.1,true],['ride',-42.8,false],[5,-46.5,true],[5,-47,false],[7.6,-52.2,true],[4,-53.1,true],[2,-58.4,true],['ride2',-61.8,false],[-1,-65.7,true],[-1,-72.5,false]];
  for (let i = 0; i < route.length; i++) {
    let [x,z,jump] = route[i]; const ride=x==='ride'||x==='ride2'; const p=level.platforms[x==='ride2'?6:4]; let reached=false;
    for(let n=0;n<1000;n++) {
      if(ride)x=platformAt(p,g.time).x; const dx=x-g.x,dz=z-g.z;
      if(Math.hypot(dx,dz)<.18&&(!jump||g.ground)&&(!ride||(i===9?x>3:x<1.5))){reached=true;break}
      tick(g,{left:dx<-.1,right:dx>.1,forward:dz<-.1,back:dz>.1,jump:jump&&n<90},1/120);
      assert.equal(g.health,3,`world 2 damage at waypoint ${i}`);
      if(g.status==='won'){reached=true;break}
    }
    assert.ok(reached,`world 2 waypoint ${i}`);
  }
  assert.equal(g.status,'won'); assert.equal(g.checkpoint,true); assert.equal(g.deaths,0); assert.ok(g.coins.size>=10);
});

function runWorld(world){
 const g=createGame(world.id);restart(g);
 function go(x,z,jump=false,moving=null){let reached=false;for(let n=0;n<1400;n++){
   const targetX=moving?platformAt(moving,g.time).x:x;const dx=targetX-g.x,dz=z-g.z;
   if(Math.hypot(dx,dz)<.17&&(!jump||g.ground)){reached=true;break}
   tick(g,{left:dx<-.08,right:dx>.08,forward:dz<-.08,back:dz>.08,jump:jump&&n<90},1/120);
   if(g.status==='won')return true;if(g.health!==3)throw Error(`damage at target ${x},${z} time ${g.time}`);
 }
 if(!reached)throw Error(`unreachable ${x},${z} at ${g.x},${g.z} on ${g.ground}`);
 tick(g,{},1/120);return true;
 }
 for(let i=0;i<world.platforms.length;i++){
  const p=world.platforms[i],next=world.platforms[i+1];
  if(i){go(p.x,p.z+p.d/2-.55,true);if(g.ground!==p.id)throw Error(`landed on ${g.ground}, expected ${p.id}`);}
  if(!next){go(world.portal[0],world.portal[2]);break;}
  if(p.moving){go(p.x,p.z-p.d/2+.55,false,p);}
  else{
   const front=i?p.z+p.d/2-.55:g.z;
   go(p.x+3.5,front);go(p.x+3.5,p.z-p.d/2+.55);go(next.x,p.z-p.d/2+.55);
  }
 }
 if(g.status!=='won')throw Error('not won');return g;
}

for (const id of Array.from({length:10},(_,i)=>i+2)) {
  test(`world ${id+1} full route reaches its portal without damage, teleports, or invincibility`,async()=>{
    const {getWorld}=await import('./game.js');
    const g=runWorld(getWorld(id));assert.equal(g.status,'won');assert.equal(g.deaths,0);assert.ok(g.checkpoint);assert.equal(g.health,3);
  });
}
test('twelve routes and themes are distinct, valid and independently recorded',async()=>{
 const {WORLDS,readProgress,completeWorld}=await import('./game.js');
 const {getTheme}=await import('./worlds.js');
 assert.equal(WORLDS.length,12);
 assert.equal(new Set(WORLDS.map(w=>JSON.stringify(w.platforms))).size,12);
 assert.equal(new Set(WORLDS.map(w=>getTheme(w).name)).size,12);
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 // Existing two-world saves migrate without losing completion or best times.
 storage.setItem('adventure-runner-worlds-v1',JSON.stringify({unlocked:1,completed:[true,true]}));
 assert.equal(readProgress(storage).completed.length,12);assert.ok(readProgress(storage).completed[0]);assert.ok(readProgress(storage).completed[1]);
 for(const w of WORLDS){completeWorld(storage,w.id);saveBest(storage,30+w.id,w.id);assert.equal(readBest(storage,w.id),30+w.id);assert.ok(w.platforms.some(p=>p.id==='checkpoint'));assert.ok(w.coins.length>10);}
 assert.ok(readProgress(storage).completed.every(Boolean));assert.equal(readProgress(storage).unlocked,11);
 completeWorld(storage,99);assert.equal(readProgress(storage).completed.length,12);
});

test('star ratings persist as the best completed run and never downgrade',async()=>{
 const {completeWorld,readProgress,starsForRun,recordRunProgress}=await import('./game.js');
 const m=new Map(),s={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 assert.equal(starsForRun(0,22),1);assert.equal(starsForRun(14,22),2);assert.equal(starsForRun(22,22),3);
 completeWorld(s,0,14);assert.equal(readProgress(s).stars[0],2);
 completeWorld(s,0,2);assert.equal(readProgress(s).stars[0],2);
 completeWorld(s,0,22);assert.equal(readProgress(s).stars[0],3);
 const g=createGame(3);restart(g);g.coins.add(0);g.checkpoint=true;recordRunProgress(s,g);
 const p=readProgress(s);assert.ok(p.played[3]);assert.equal(p.completed[3],false);assert.equal(p.stars[3],0);assert.equal(p.tasks[3].coins,1);assert.ok(p.tasks[3].checkpoint);
});
test('continue restores time, coins, hearts, world and last safe island across reload',async()=>{
 const {saveRun,readRun,restoreRun,getWorld,clearRun}=await import('./game.js');
 const m=new Map(),s={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 const g=createGame(6);restart(g);const cp=getWorld(6).checkpoint;[g.x,g.y,g.z]=cp;frames(g,{},2);g.time=45.75;g.health=2;g.coins.add(2);g.coins.add(3);g.deaths=1;g.status='paused';
 assert.ok(saveRun(s,g));assert.equal(readRun(s).world,6);
 const restored=restoreRun(s);assert.equal(restored.world,6);assert.equal(restored.time,45.75);assert.equal(restored.health,2);assert.equal(restored.coins.size,g.coins.size);assert.equal(restored.checkpoint,true);assert.equal(restored.status,'playing');assert.equal(restored.deaths,1);assert.equal(restored.ground,'checkpoint');assert.ok(restored.invincible>0);
 clearRun(s);assert.equal(readRun(s),null);
});
test('airborne or moving-platform autosave returns to the last solid ground safely',async()=>{
 const {saveRun,restoreRun}=await import('./game.js');const m=new Map(),s={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 const g=createGame();restart(g);frames(g,{},1);const safe={...g.lastSafe};frames(g,{jump:true,forward:true},30);assert.equal(g.ground,null);saveRun(s,g);
 let r=restoreRun(s);assert.deepEqual([r.x,r.y,r.z],[safe.x,safe.y,safe.z]);
 g.ground='ferry';g.x=1;g.y=1;g.z=-40;saveRun(s,g);r=restoreRun(s);assert.equal(r.ground,'start');assert.equal(r.z,safe.z);
});
test('bad saves and unavailable browser storage do not break continue',async()=>{
 const {saveRun,readRun,restoreRun,resumeKey}=await import('./game.js');
 const denied={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};
 const g=createGame();restart(g);assert.equal(saveRun(denied,g),null);assert.equal(restoreRun(denied),null);
 const m=new Map(),s={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};saveRun(s,g);
 const data=JSON.parse(s.getItem(resumeKey));data.safe.ground='ferry';s.setItem(resumeKey,JSON.stringify(data));assert.equal(readRun(s),null);
 data.safe.ground='start';data.safe.x=9999;s.setItem(resumeKey,JSON.stringify(data));assert.equal(readRun(s),null);
 data.world=999;s.setItem(resumeKey,JSON.stringify(data));assert.equal(readRun(s),null);
});

test('joystick dead zone removes drift and diagonal movement never exceeds full speed',async()=>{
 const {stickVector,movementVector}=await import('./controls.js');
 assert.equal(stickVector(2,1,48).x,0);assert.equal(stickVector(2,1,48).z,0);
 const full=stickVector(100,-100,48);assert.ok(Math.abs(Math.hypot(full.x,full.z)-1)<.0001);assert.ok(Math.abs(Math.hypot(full.thumbX,full.thumbY)-48)<.0001);
 const precise=stickVector(24,0,48);assert.ok(precise.x>0&&precise.x<.5);
 assert.deepEqual(stickVector(NaN,0),{x:0,z:0,thumbX:0,thumbY:0});
 const mixed=movementVector({right:true,axisX:1,axisZ:-1});assert.ok(Math.hypot(mixed.x,mixed.z)<=1.00001);
});
test('two touch pointers can steer and jump independently, including cancellation',async()=>{
 const {createTouchController}=await import('./controls.js');const input={axisX:0,axisZ:0,jump:false},c=createTouchController(input);
 assert.ok(c.beginStick(1));c.moveStick(1,.5,-.8);assert.ok(c.beginJump(2));assert.equal(input.jump,true);
 assert.equal(c.beginStick(3),false);c.endStick(3);assert.equal(input.axisZ,-.8);
 c.endJump(2);assert.equal(input.jump,false);assert.equal(input.axisZ,-.8);
 c.beginJump(4);c.endStick(1);assert.equal(input.axisX,0);assert.equal(input.axisZ,0);assert.equal(input.jump,true);
 c.reset();assert.equal(input.jump,false);assert.equal(input.axisX,0);assert.ok(c.beginStick(6));
});
test('analogue speed supports precise walking, running and simultaneous jumping',()=>{
 const slow=started(),fast=started();frames(slow,{axisZ:-.3},60);frames(fast,{axisZ:-1},60);
 assert.ok(Math.abs((4-slow.z)-.9)<.001);assert.ok(Math.abs((4-fast.z)-3)<.001);
 tick(slow,{axisZ:-.3,jump:true},1/120);assert.ok(slow.y>0);assert.equal(slow.ground,null);
 const stopped=slow.z;frames(slow,{axisZ:0,axisX:0},10);assert.equal(slow.z,stopped);
});
test('landing preview predicts a real surface and hides while grounded',async()=>{
 const {landingPreview}=await import('./game.js');const g=started();assert.equal(landingPreview(g),null);
 frames(g,{jump:true,axisZ:-1},20);const target=landingPreview(g);assert.ok(target);assert.ok(Number.isFinite(target.x));assert.ok(target.t>0);
 const endY=target.y-.035;let actual=false;for(let i=0;i<180;i++){tick(g,{axisZ:-1},1/120);if(g.ground){actual=true;break;}}
 assert.ok(actual);assert.ok(Math.abs(g.y-endY)<.01);
});

test('a quick jump tap between physics frames is buffered and fires exactly once',async()=>{
 const {createTouchController}=await import('./controls.js');const input={axisX:0,axisZ:0,jump:false,jumpQueued:false};const c=createTouchController(input),g=started();
 c.beginJump(2);c.endJump(2);assert.equal(input.jump,false);assert.equal(input.jumpQueued,true);
 tick(g,input,1/120);assert.ok(g.vy>0);assert.equal(input.jumpQueued,false);assert.equal(g.ground,null);
 frames(g,input,150);assert.equal(g.ground,'start');assert.equal(g.events.filter(e=>e==='jump').length,1);
 c.beginJump(3);c.reset();assert.equal(input.jumpQueued,false);
});


test('holding jump yields a higher arc than a quick tap, with one launch per press',()=>{
 const tap=started(),hold=started();let tapPeak=0,holdPeak=0;
 for(let i=0;i<160;i++){tick(tap,{jump:i===0},1/120);tick(hold,{jump:i<80},1/120);tapPeak=Math.max(tapPeak,tap.y);holdPeak=Math.max(holdPeak,hold.y);}
 assert.ok(holdPeak>tapPeak+.5);assert.equal(tap.events.filter(e=>e==='jump').length,1);assert.equal(hold.events.filter(e=>e==='jump').length,1);
});
test('coyote time and a buffered landing press are both usable',()=>{
 const g=started();g.z=-4.16;frames(g,{forward:true},2);assert.equal(g.ground,null);tick(g,{jump:true},1/120);assert.ok(g.vy>0);
 const b=started();b.y=.06;b.ground=null;b.coyote=0;b.vy=-3;tick(b,{jumpQueued:true},1/120);frames(b,{},5);assert.ok(b.vy>0);assert.equal(b.ground,null);
});
test('running, pickup, landing and respawn produce bounded lightweight effects',()=>{
 const g=started();g.z=1;frames(g,{forward:true},20);assert.ok(g.fx.some(e=>e.type==='coin'));assert.ok(g.fx.some(e=>e.type==='dust'));
 frames(g,{jump:true},90);frames(g,{},90);assert.ok(g.events.includes('land'));g.y=-11;tick(g,{},1/120);assert.ok(g.fade>0);assert.equal(g.health,2);
 for(let i=0;i<1000;i++)tick(g,{right:i%100<50,left:i%100>=50},1/120);assert.ok(g.fx.length<=32);
});
test('settings survive reload and device/slow-frame detection reduces quality',async()=>{
 const {loadSettings,storeSettings,deviceProfile,performanceStep}=await import('./preferences.js');const m=new Map(),s={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 storeSettings(s,{muted:true,haptics:false});assert.deepEqual(loadSettings(s),{muted:true,haptics:false});assert.equal(deviceProfile({deviceMemory:2},true).quality,'low');assert.equal(deviceProfile({hardwareConcurrency:2}).pixelRatio,.85);assert.equal(deviceProfile({hardwareConcurrency:12,deviceMemory:16}).quality,'high');
 let state={samples:0,elapsed:0};for(let i=0;i<85;i++)state=performanceStep(state,.05,true);assert.equal(state.downgrade,true);assert.ok(state.fps<30);
 let fast={samples:0,elapsed:0};for(let i=0;i<245;i++)fast=performanceStep(fast,1/60,true);assert.equal(fast.downgrade,false);assert.ok(fast.fps>59);
});
test('haptics are guarded, optional and specific to game events',async()=>{
 const {feedback}=await import('./preferences.js');const calls=[],nav={vibrate:pattern=>{calls.push(pattern);return true;}};feedback('jump',nav);feedback('coin',nav);feedback('hurt',nav);assert.equal(calls.length,3);feedback('jump',nav,false);assert.equal(calls.length,3);assert.equal(feedback('jump',{}),false);
});
test('new celebration ratings use time, coin target and hearts without downgrading old records',async()=>{
 const {starsForRun,completeWorld,readProgress}=await import('./game.js');assert.equal(starsForRun(14,22,30,3,49),3);assert.equal(starsForRun(14,22,70,3,49),2);assert.equal(starsForRun(14,22,30,1,49),2);assert.equal(starsForRun(2,22,70,1,49),1);
 const m=new Map(),s={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};completeWorld(s,0,22);completeWorld(s,0,2,100,1);assert.equal(readProgress(s).stars[0],3);
});


test('audio and music stay lazy until a gesture, and music stops when muted or paused',async()=>{
 const audio=await import('./audio.js');assert.equal(audio.audioStatus().created,false);audio.enableSound(false);assert.equal(audio.audioStatus().created,false);
 const events=[];const param={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(v){events.push(['gain',v]);}};
 globalThis.window={AudioContext:class{state='running';currentTime=0;destination={};createGain(){return {gain:param,connect(){},disconnect(){}}}createOscillator(){events.push(['note']);return {frequency:param,connect(){},disconnect(){},start(){},stop(){}}}}};
 audio.unlockAudio();assert.equal(audio.audioStatus().created,true);audio.enableSound(true);audio.setMusicPlaying(true);assert.ok(audio.audioStatus().scheduled);assert.ok(events.some(e=>e[0]==='note'));audio.enableSound(false);assert.equal(audio.audioStatus().scheduled,false);audio.setMusicPlaying(false);delete globalThis.window;
});

test('static scenery baking preserves colors and local transforms including moving-parent instances',async()=>{
 const THREE=await import('three');const {bakeIsland}=await import('./batchGeometry.js');
 const root=new THREE.Group();root.position.set(40,3,-20);
 const child=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshStandardMaterial({color:'#ff0000'}));child.position.x=4;root.add(child);
 const instances=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({color:'#00ff00'}),2);
 instances.setMatrixAt(0,new THREE.Matrix4().makeTranslation(-3,0,0));instances.setMatrixAt(1,new THREE.Matrix4().makeTranslation(-6,0,0));root.add(instances);
 const animated=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.ShaderMaterial());root.add(animated);
 const baked=bakeIsland(root);assert.equal(baked.originals.length,2);assert.ok(!baked.originals.includes(animated));
 baked.geometry.computeBoundingBox();assert.equal(baked.geometry.boundingBox.max.x,5);assert.equal(baked.geometry.boundingBox.min.x,-6.5);
 assert.equal(baked.geometry.getAttribute('position').count,108);assert.equal(baked.geometry.getAttribute('color').getX(0),1);
 assert.equal(baked.geometry.getAttribute('color').getY(36),1);assert.equal(child.visible,true);baked.geometry.dispose();
});

test('touch profile retains readable resolution and reacts before frame rate reaches 30',async()=>{
 const {deviceProfile,performanceStep}=await import('./preferences.js');assert.equal(deviceProfile({hardwareConcurrency:6},true).pixelRatio,1.25);
 let state={samples:0,elapsed:0};for(let i=0;i<95;i++)state=performanceStep(state,1/45);assert.equal(state.downgrade,true);assert.ok(state.fps>44&&state.fps<46);
});
