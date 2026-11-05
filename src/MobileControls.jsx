import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createTouchController,stickVector} from './controls';
import {unlockAudio} from './audio';
export default function MobileControls({input}){
 const controller=useMemo(()=>createTouchController(input),[input]);
 const zone=useRef(),anchor=useRef(null),thumb=useRef();
 const paintThumb=(x=0,y=0)=>{if(thumb.current)thumb.current.style.transform=`translate3d(${x}px,${y}px,0)`;};
 const [origin,setOrigin]=useState(null),[jumping,setJumping]=useState(false);
 useEffect(()=>{const reset=()=>{controller.reset();anchor.current=null;paintThumb();setOrigin(null);setJumping(false);};window.addEventListener('blur',reset);window.addEventListener('orientationchange',reset);return()=>{controller.reset();window.removeEventListener('blur',reset);window.removeEventListener('orientationchange',reset);};},[controller]);
 const move=event=>{if(!anchor.current)return;const v=stickVector(event.clientX-anchor.current.x,event.clientY-anchor.current.y,48);if(controller.moveStick(event.pointerId,v.x,v.z))paintThumb(v.thumbX,v.thumbY);};
 const release=event=>{controller.endStick(event.pointerId);if(!input.axisX&&!input.axisZ){anchor.current=null;paintThumb();setOrigin(null);}};
 const jumpEnd=event=>{controller.endJump(event.pointerId);setJumping(input.jump);};
 return <div className="mobile-controls" aria-label="Touch game controls">
  <div ref={zone} className="move-zone" role="group" aria-label="Floating movement joystick" onContextMenu={e=>e.preventDefault()} onPointerDown={event=>{event.preventDefault();if(!controller.beginStick(event.pointerId))return;const rect=zone.current.getBoundingClientRect();anchor.current={x:event.clientX,y:event.clientY};setOrigin({x:Math.max(67,Math.min(rect.width-67,event.clientX-rect.left)),y:Math.max(67,Math.min(rect.height-67,event.clientY-rect.top))});paintThumb();unlockAudio();event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
   <div className={`joystick ${origin?'steering floating':'resting'}`} style={origin?{left:origin.x,top:origin.y}:undefined}><span className="stick-orbit"/><span className="stick-cross x"/><span className="stick-cross y"/><span ref={thumb} className="stick-thumb"/><span className="stick-arrow">⌃</span></div><span className="control-caption stick-caption">DRAG ANYWHERE HERE</span>
  </div>
  <div className="jump-group"><button className={`jump-pad ${jumping?'jumping':''}`} aria-label="Jump" aria-pressed={jumping} onContextMenu={e=>e.preventDefault()} onPointerDown={event=>{event.preventDefault();if(!controller.beginJump(event.pointerId))return;unlockAudio();event.currentTarget.setPointerCapture(event.pointerId);setJumping(true);}} onPointerUp={jumpEnd} onPointerCancel={jumpEnd} onLostPointerCapture={jumpEnd}><span>↑</span><b>JUMP</b></button><span className="control-caption">HOLD FOR LONGER LEAPS</span></div>
 </div>;
}

