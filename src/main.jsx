import React, { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { WORLDS, getWorld, createGame, restart, formatTime, readBest, saveBest, readProgress, completeWorld, recordRunProgress, saveRun, readRun, restoreRun, clearRun, starsForRun,runMedals } from './game';
import { enableSound, playSound, unlockAudio,setMusicPlaying } from './audio';
import './style.css';
import MobileControls from './MobileControls';
import Icon from './Icon';
import {loadSettings,storeSettings,deviceProfile,feedback} from './preferences';
import {PCFSoftShadowMap} from 'three';
import { getTheme } from './worlds';
const Scene = lazy(() => import('./Scene'));
const storage = { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) };
const input = { forward: false, back: false, left: false, right: false, jump: false,jumpQueued:false,axisX:0,axisZ:0 };
const clearInput = () => Object.keys(input).forEach(key => { input[key] = key.startsWith('axis')?0:false; });
const getSnapshot = game => ({ world: game.world, status: game.status, coins: game.coins.size, time: game.time, health: game.health, checkpoint: game.checkpoint, z: game.z, toast: game.toastTime > 0 ? game.toast : '', deaths: game.deaths,fade:game.fade });
class SceneBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    return this.state.error ? <div className="graphics-error"><h2>The 3D world couldn’t start</h2><p>Enable hardware acceleration in your browser, then reload.</p><button onClick={() => location.reload()}>Reload game</button></div> : this.props.children;
  }
}
function CoinIcon() { return <span className="coin-icon" aria-hidden="true">★</span>; }
function WorldRoute({ world }) {
  const level = getWorld(world);
  const path = level.platforms.map(p => `${p.x},${p.z}`).join(' ');
  return <svg className="route-map" viewBox={`-15 ${level.portal[2]-10} 32 ${25-level.portal[2]}`} aria-label={`World ${world+1} route, ${level.platforms.length} islands`} role="img">
    <polyline points={path} fill="none" stroke={getTheme(level).accent} strokeWidth=".7" strokeDasharray="1.4 1.4"/>
    {level.platforms.map(p => <rect key={p.id} x={p.x-p.w/2} y={p.z-p.d/2} width={p.w} height={p.d} rx="1" fill={p.moving ? '#ffdc76' : getTheme(level).ground} stroke="#f6f4c255" strokeWidth=".35"/>)}
    <circle cx={level.checkpoint[0]} cy={level.checkpoint[2]} r="1.6" fill="#ff7862"/>
    <circle cx={level.portal[0]} cy={level.portal[2]} r="2.2" fill="#91efff"/>
  </svg>;
}
function App() {
  const game = useRef(createGame()).current;
  const [view, setView] = useState(() => getSnapshot(game));
  const [best, setBest] = useState(() => readBest(storage));
  const [preferences,setPreferences]=useState(()=>loadSettings(storage));
  const [sound,setSound]=useState(()=>!loadSettings(storage).muted);
  const feedbackSettings=useRef(preferences);feedbackSettings.current=preferences;
  const [taskOpen,setTaskOpen]=useState(false);
  const [hitId,setHitId]=useState(0);
  const [performanceMode,setPerformanceMode]=useState(false);
  const [fps,setFps]=useState(null);
  const [renderCalls,setRenderCalls]=useState(null);
  const [device]=useState(()=>deviceProfile(navigator,matchMedia('(any-pointer: coarse)').matches));
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [resumeData,setResumeData]=useState(()=>readRun(storage));
  const [mapFilter,setMapFilter]=useState('all');
  const [progress, setProgress] = useState(() => readProgress(storage));
  const [mobile,setMobile]=useState(()=>matchMedia('(any-pointer: coarse), (max-width: 900px), (max-width: 950px) and (max-height: 500px)').matches);
  useEffect(()=>{const query=matchMedia('(any-pointer: coarse), (max-width: 900px), (max-width: 950px) and (max-height: 500px)');const changed=()=>setMobile(query.matches);query.addEventListener('change',changed);return()=>query.removeEventListener('change',changed);},[]);
  const [quality,setQuality]=useState(()=>device.quality);
  const slowFrames=useCallback(()=>{setPerformanceMode(true);setQuality('low');},[]);
  const reportFrames=useCallback(value=>{setFps(Math.round(value.fps));setRenderCalls(value.calls);},[]);
  const [cameraMode, setCameraMode] = useState('follow');
  const [loading, setLoading] = useState(true);
  const [newBest, setNewBest] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const lastAutosave=useRef(0);
  const lastUpdate = useRef(0), savedRun = useRef(false), loaded = useRef(false), panelRef = useRef();
  const captureRun=useCallback(()=>{const data=saveRun(storage,game);if(data)setResumeData(data);setProgress(recordRunProgress(storage,game));lastAutosave.current=performance.now();},[game]);
  const sync = useCallback(() => {
    const events = game.events.splice(0);
    events.forEach(event=>{playSound(event);feedback(event,navigator,feedbackSettings.current.haptics);});
    if(events.includes('hurt'))setHitId(n=>n+1);
    if (game.status === 'won' && !savedRun.current) {
      savedRun.current = true;
      const old = readBest(storage, game.world);
      setNewBest(!old || game.time < old);
      setBest(saveBest(storage, game.time, game.world));
      recordRunProgress(storage,game);setProgress(completeWorld(storage, game.world,game.coins.size,game.time,game.health));clearRun(storage);setResumeData(null);
    }
    if(game.status==='playing'&&(performance.now()-lastAutosave.current>1800||events.some(e=>['checkpoint','start'].includes(e))))captureRun();
    if(game.status==='gameover'&&events.includes('hurt')){recordRunProgress(storage,game);clearRun(storage);setResumeData(null);}
    if (!loaded.current) { loaded.current = true; setLoading(false); }
    if ((game.status === 'playing' && performance.now() - lastUpdate.current > 75) || events.length) {
      lastUpdate.current = performance.now(); setView(getSnapshot(game));
    }
  }, [game,captureRun]);
  const begin = useCallback((world = game.world) => {
    setAtlasOpen(false); unlockAudio(); clearInput(); restart(game, world); setBest(readBest(storage, world)); savedRun.current = false;
    setNewBest(false); captureRun();setView(getSnapshot(game));
  }, [game,captureRun]);
  const pause = useCallback(() => {
    if (game.status === 'playing') {game.status = 'paused';captureRun();}
    else if (game.status === 'paused') { game.status = 'playing';setAtlasOpen(false); unlockAudio(); }
    clearInput(); setView(getSnapshot(game));
  }, [game,captureRun]);
  const openMap=useCallback(()=>{if(!loaded.current)return;if(game.status==='playing')pause();setProgress(recordRunProgress(storage,game));setMapFilter('all');setAtlasOpen(true);clearInput();},[game,pause]);
  const continueAdventure=()=>{const restored=restoreRun(storage);if(!restored)return;Object.assign(game,restored);setAtlasOpen(false);savedRun.current=false;setNewBest(false);clearInput();unlockAudio();setBest(readBest(storage,game.world));setView(getSnapshot(game));};
  useEffect(() => {
    const map = { KeyW: 'forward', ArrowUp: 'forward', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'jump' };
    const held = new Set();
    const updateKeys = () => { Object.values(map).forEach(action => { input[action] = [...held].some(code => map[code] === action); }); };
    const down = event => {
      if (event.target instanceof HTMLSelectElement) return;
      if (map[event.code]) { event.preventDefault(); if (game.status === 'playing') { held.add(event.code);if(event.code==='Space'&&!event.repeat)input.jumpQueued=true; updateKeys(); } }
      if ((event.code === 'Escape' || event.code === 'KeyP') && !event.repeat) { held.clear();if(atlasOpen){setAtlasOpen(false);if(game.status==='paused')pause();}else pause(); }
      if(event.code==='KeyM'&&!event.repeat)openMap();
      if (event.code === 'KeyR' && !event.repeat && ['won', 'gameover'].includes(game.status)) begin();
    };
    const up = event => { if (map[event.code]) { event.preventDefault(); held.delete(event.code); updateKeys(); } };
    const blur = () => { held.clear(); clearInput(); if (game.status === 'playing') { game.status = 'paused';captureRun(); setView(getSnapshot(game)); } };
    const visibility = () => { if (document.hidden) blur(); };
    const pagehide=()=>{saveRun(storage,game);recordRunProgress(storage,game);};
    const full = () => setFullscreen(!!document.fullscreenElement);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility); document.addEventListener('fullscreenchange', full);window.addEventListener('pagehide',pagehide);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('fullscreenchange', full);window.removeEventListener('pagehide',pagehide); };
  }, [game, pause, begin,atlasOpen,openMap,captureRun]);
  useEffect(()=>{enableSound(sound);setPreferences(old=>({...old,muted:!sound}));},[sound]);
  useEffect(()=>{storeSettings(storage,preferences);},[preferences]);
  useEffect(()=>{setMusicPlaying(view.status==='playing');return()=>setMusicPlaying(false);},[view.status]);
  useEffect(()=>{const suppress=e=>{if(e.touches?.length>1||e.type==='gesturestart')e.preventDefault();};document.addEventListener('gesturestart',suppress,{passive:false});document.addEventListener('touchmove',suppress,{passive:false});return()=>{document.removeEventListener('gesturestart',suppress);document.removeEventListener('touchmove',suppress);};},[]);
  useEffect(() => {
    if (view.status !== 'playing') panelRef.current?.querySelector('button:not([hidden])')?.focus();
  }, [view.status, loading,atlasOpen]);
  const toggleSound = () => { unlockAudio(); setSound(value => !value); };
  const toggleFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { game.toast = 'Fullscreen unavailable · you can keep playing here'; game.toastTime = 3; }
  };
  const level = getWorld(view.world);
  const selectWorld = id => {if(atlasOpen&&id===game.world&&game.status==='paused'){pause();return;}if(game.status==='paused')captureRun();setAtlasOpen(false); clearInput(); Object.assign(game, createGame(id)); savedRun.current=false; setBest(readBest(storage,id)); setNewBest(false); setView(getSnapshot(game)); };
  const menu = view.status !== 'playing';
  const won = view.status === 'won';
  const medals=runMedals(game);
  const stars=starsForRun(view.coins,level.coins.length,view.time,view.health,medals.par);
  const visibleWorlds=WORLDS.filter(w=>mapFilter==='all'||(mapFilter==='played'?progress.played[w.id]:progress.completed[w.id]));
  const stage = level.stages.find(([z]) => view.z > z)?.[1];
  return <main data-fps={fps??''} data-draw-calls={renderCalls??''} data-quality={quality} data-auto-performance={performanceMode}>
    <SceneBoundary><Canvas shadows={quality === 'high'} dpr={quality==='high'?[1,1.5]:performanceMode ? (device.low ? .85 : 1) : Math.min(1.25,device.pixelRatio)} camera={{ fov: 57, near: .1, far: 210 }} gl={{antialias:!device.touch&&!device.low,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.shadowMap.type=PCFSoftShadowMap;}}>
      <Suspense fallback={null}><Scene key={view.world} game={game} input={input} onStep={sync} quality={quality} cameraMode={cameraMode} mobile={mobile} onSlow={slowFrames} onStats={reportFrames} /></Suspense>
    </Canvas></SceneBoundary>
    <header className="topbar">
      <div className="wordmark"><span>ADVENTURE</span><b>RUNNER <i>3D</i></b><small>WORLD {view.world+1} · {level.name}</small></div>
      <div className="hud" aria-label="Game statistics">
        <div className="coin-stat"><CoinIcon /><strong key={view.coins} className="coin-count">{view.coins}</strong><small>/ {level.coins.length}</small></div>
        <div className="time-stat"><span className="stat-label">TIME</span><strong>{formatTime(view.time)}</strong></div>
        <div key={hitId} className={`hearts ${hitId?'heart-hit':''}`} aria-label={`${view.health} of 3 hearts`}>{[1, 2, 3].map(n => <span key={n} className={n <= view.health ? '' : 'empty'}><Icon name="heart" size={21}/></span>)}</div>
      </div>
      <div className="tools"><button className="map-button" title="Map (M)" aria-label="Open world map" disabled={loading} onClick={openMap}><Icon name="map" size={17}/><span>MAP</span></button><button title={sound ? 'Mute sound' : 'Enable sound'} aria-label={sound ? 'Mute sound' : 'Enable sound'} onClick={toggleSound}><Icon name={sound?'sound':'muted'}/></button><button title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFullscreen}><Icon name="expand"/></button><button title="Pause (Esc)" aria-label={view.status === 'paused' ? 'Resume game' : 'Pause game'} disabled={!['playing', 'paused'].includes(view.status)} onClick={pause}><Icon name={view.status==='paused'?'play':'pause'}/></button></div>
    </header>
    {!menu && <>
      <div className="trail-progress"><span>{stage}</span><div><i style={{ width: `${Math.min(100, Math.max(0, (level.spawn[2] - view.z) / (level.spawn[2] - level.portal[2]) * 100))}%` }} /></div><b className={view.checkpoint ? 'lit' : ''} title={view.checkpoint ? 'Checkpoint active' : 'Reach the checkpoint'}>⚑</b></div>
      <section className={`task-panel ${taskOpen?'expanded':''}`}><button className="task-toggle" aria-expanded={taskOpen} aria-controls="world-task-list" onClick={()=>setTaskOpen(value=>!value)}><Icon name="flag" size={15}/><span>World tasks</span><b>{Number(view.coins>=Math.ceil(level.coins.length*.6))+Number(view.checkpoint)} / 3</b><Icon name="chevron" size={15}/></button>{taskOpen&&<div id="world-task-list" className="task-list"><span className={view.coins>=Math.ceil(level.coins.length*.6)?'done':''}>★ Collect coins {Math.min(view.coins,Math.ceil(level.coins.length*.6))} / {Math.ceil(level.coins.length*.6)}</span><span className={view.checkpoint?'done':''}>⚑ Activate checkpoint</span><span>◈ Reach the portal</span></div>}</section>
      {mobile&&<div className="rotate-hint">Rotate for a wider view</div>}

      <div className="desktop-help"><kbd>WASD</kbd> move <kbd>SPACE</kbd> jump <kbd>ESC</kbd> pause <span>Follow the coins to the portal</span></div>
      {mobile&&<MobileControls input={input}/>}
    </>}
    {view.fade>0&&!menu&&<div className="respawn-fade" style={{opacity:Math.min(.75,view.fade/.22)}} aria-hidden="true"/>}
    {view.toast && !menu && <div className="toast" role="status">✦ {view.toast}</div>}
    {menu && <div className={`menu-layer ${won ? 'won' : ''}`}><section ref={panelRef} className={`menu-card ${atlasOpen?'atlas-card':''}`} role="dialog" aria-modal="true" aria-labelledby="menu-title" onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = panelRef.current.querySelectorAll('button:not(:disabled):not([hidden]), select');
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
      <div className="chapter-label">WORLD {String(view.world+1).padStart(2,'0')} <span>•</span> {level.name.toUpperCase()}</div>
      {loading ? <><h1 id="menu-title">Building your world…</h1><p>Warming up the sky gate.</p><div className="loading-bar" /></> : <>
        <div className="menu-emblem">{won ? '★' : view.status === 'paused' ? 'Ⅱ' : view.status === 'gameover' ? '♥' : '✦'}</div>
        <h1 id="menu-title">{atlasOpen ? 'Choose your world' : won ? 'Adventure complete!' : view.status === 'paused' ? 'Take a breather.' : view.status === 'gameover' ? 'Another adventure?' : 'The sky is calling.'}</h1>
        <p>{atlasOpen ? `Explore ${WORLDS.length} worlds. Each has its own route, scenery and personal best. All are available to play.` : won ? `You made it through ${level.name.toLowerCase()}.${view.world < WORLDS.length-1 ? ` Next stop: ${WORLDS[view.world+1].name}.` : ' You reached the final world!'}` : view.status === 'paused' ? 'Your progress is safe. The clock is paused.' : view.status === 'gameover' ? 'Every great explorer takes a few tumbles.' : 'Leap across floating islands, dodge the traps, and find your way to the ancient sky gate.'}</p>
        {won && !atlasOpen && <><div className="stars" aria-label={`${stars} of 3 stars`}>{[1, 2, 3].map(n => <span key={n} className={n <= stars ? '' : 'empty'}>★</span>)}</div><div className="victory-burst" aria-hidden="true">✦ ✧ ✦</div><div className="run-medals"><span className={medals.coins?'earned':''}>★ Coin target</span><span className={medals.time?'earned':''}>◷ Under {medals.par}s</span><span className={medals.hearts?'earned':''}>♥ 2+ hearts</span></div><div className="results"><div><small>YOUR TIME</small><b>{formatTime(view.time)}</b></div><div><small>COINS FOUND</small><b>{view.coins} / {level.coins.length}</b></div><div><small>FALLS / HITS</small><b>{view.deaths}</b></div></div>{newBest && <div className="record">✦ NEW PERSONAL BEST</div>}</>}
        {view.status==='ready'&&resumeData&&!atlasOpen&&<button className="continue-button" onClick={continueAdventure}>▶ CONTINUE ADVENTURE <small>World {resumeData.world+1} · {getWorld(resumeData.world).name} · {formatTime(resumeData.time)}</small></button>}
        <button className="primary" hidden={atlasOpen} onClick={view.status === 'paused' ? pause : () => begin(won && view.world < WORLDS.length-1 ? view.world+1 : game.world)}>{view.status === 'ready' ? (resumeData?'START NEW RUN':'PLAY ADVENTURE') : view.status === 'paused' ? 'RESUME ADVENTURE' : won && view.world < WORLDS.length-1 ? `ENTER WORLD ${view.world+2}` : 'PLAY AGAIN'} <span>▶</span></button>
        {view.status === 'paused' && !atlasOpen && <button className="secondary" onClick={() => begin()}>Restart from the beginning</button>}
        {won && !atlasOpen && <button className="secondary" onClick={() => selectWorld(view.world)}>Replay this world / World select</button>}
        {view.status === 'ready' && !atlasOpen && <button className="atlas-toggle" onClick={openMap}>Choose world <span>{WORLDS.length} destinations →</span></button>}
        {view.status === 'paused' && !atlasOpen && <button className="secondary" onClick={openMap}>Map & tasks / Choose world</button>}
        {atlasOpen && <><div className="atlas-summary">{progress.completed.filter(Boolean).length} / {WORLDS.length} worlds complete <button onClick={()=>{setAtlasOpen(false);if(game.status==='paused')pause();}}>{view.status==='paused'?'Resume game':'Back'}</button></div><nav className="map-filters" aria-label="Filter maps">{['all','played','completed'].map(filter=><button key={filter} aria-pressed={mapFilter===filter} onClick={()=>setMapFilter(filter)}>{filter==='all'?'All worlds':filter==='played'?'Played':'Completed'}</button>)}</nav><div className="world-select" aria-label="Choose a world">{visibleWorlds.map(world => <button key={world.id} className={`world-option ${view.world===world.id?'selected':''} ${world.id===1?'ember':''}`} style={{'--world-accent':getTheme(world).accent,'--world-ground':getTheme(world).ground}} aria-pressed={view.world===world.id} onClick={() => selectWorld(world.id)}><WorldRoute world={world.id}/><span><small>WORLD {String(world.id+1).padStart(2,'0')} {progress.completed[world.id]?'✓':''}</small><b>{world.name}</b><span className="map-stars" aria-label={`${progress.stars[world.id]} stars earned`}>{[1,2,3].map(n=><i key={n} className={n<=progress.stars[world.id]?'earned':''}>★</i>)}</span><em>{`${world.platforms.length} islands · ${world.platforms.filter(p=>p.moving).length} moving`}</em><em className="map-tasks">{progress.tasks[world.id].coins>=Math.ceil(world.coins.length*.6)?'✓':'○'} Coins {Math.min(progress.tasks[world.id].coins,Math.ceil(world.coins.length*.6))}/{Math.ceil(world.coins.length*.6)} · {progress.tasks[world.id].checkpoint?'✓':'○'} Flag · {progress.completed[world.id]?'✓':'○'} Gate</em>{view.status==='paused'&&world.id===view.world&&<em className="current-run">▶ Resume this run</em>}</span></button>)}</div>{!visibleWorlds.length&&<p className="empty-maps">{mapFilter==='played'?'Choose any world and start an adventure.':'Finish a world to earn your first star.'}</p>}</>}
        {!atlasOpen && ['ready', 'paused'].includes(view.status) && <>
          <div className="instructions">{mobile?<><span>Left thumb: drag the joystick to move</span><span>Right thumb: tap JUMP while steering</span><span>Hold JUMP for longer leaps · drag gently for precise steps</span></>:<><span><kbd>W A S D</kbd> or arrows to move</span><span><kbd>SPACE</kbd> to jump over gaps & red bars</span></>}<span>⚑ Checkpoint restores your three hearts</span></div>
          <div className="settings"><label>Graphics<select aria-label="Graphics quality" value={quality} onChange={event=>{setQuality(event.target.value);setPerformanceMode(false);}}><option value="high">High · shadows</option><option value="low">Smooth · no shadows</option></select></label><label>Camera<select aria-label="Camera view" value={cameraMode} onChange={event => setCameraMode(event.target.value)}><option value="follow">Follow</option><option value="wide">Wide</option></select></label><button className="sound-setting" onClick={toggleSound} aria-pressed={sound}>Sound {sound ? 'ON' : 'OFF'}</button></div><div className="extras-settings"><button aria-pressed={preferences.haptics} onClick={()=>setPreferences(old=>({...old,haptics:!old.haptics}))}>Haptics {preferences.haptics?'ON':'OFF'}</button><span>{performanceMode?'Adaptive performance mode':device.low?'Low-power device detected':'Adaptive quality enabled'}{fps?` · ${fps} fps`:''}</span></div>
        </>}
        {best && !atlasOpen && <div className="best">PERSONAL BEST <strong>{formatTime(best)}</strong></div>}
      </>}
    </section><span className="menu-footnote">A real-time 3D adventure · Keyboard & touch controls</span></div>}
    <div className="sr-only" aria-live="polite">{view.checkpoint ? 'Checkpoint activated.' : ''}{won ? `Level completed. ${view.coins} coins collected.` : ''}</div>
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);




