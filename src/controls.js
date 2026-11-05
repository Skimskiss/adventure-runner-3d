// Radial dead zone prevents thumb drift, while proportional speed allows careful positioning.
export function stickVector(dx,dy,radius=48){
 const distance=Math.hypot(dx,dy);
 if(!Number.isFinite(distance)||radius<=0)return {x:0,z:0,thumbX:0,thumbY:0};
 const fraction=Math.min(1,distance/radius),visual=distance?Math.min(distance,radius)/distance:0;
 const strength=fraction<=.12?0:(fraction-.12)/.88;
 return {x:distance?dx/distance*strength:0,z:distance?dy/distance*strength:0,thumbX:dx*visual,thumbY:dy*visual};
}
export function movementVector(input){
 const axis=value=>Number.isFinite(value)?Math.max(-1,Math.min(1,value)):0;
 let x=Number(!!input.right)-Number(!!input.left)+axis(input.axisX);
 let z=Number(!!input.back)-Number(!!input.forward)+axis(input.axisZ);
 const length=Math.hypot(x,z);if(length>1){x/=length;z/=length;}
 return {x,z,strength:Math.min(1,length)};
}
// A separate pointer owns each control so lifting the jump thumb never stops steering.
export function createTouchController(input){
 let stickPointer=null,jumpPointer=null;
 return {
  beginStick(id){if(stickPointer!==null)return false;stickPointer=id;return true;},
  moveStick(id,x,z){if(id!==stickPointer)return false;input.axisX=x;input.axisZ=z;return true;},
  endStick(id){if(id!==stickPointer)return;stickPointer=null;input.axisX=0;input.axisZ=0;},
  beginJump(id){if(jumpPointer!==null)return false;jumpPointer=id;input.jump=true;input.jumpQueued=true;return true;},
  endJump(id){if(id!==jumpPointer)return;jumpPointer=null;input.jump=false;},
  reset(){stickPointer=null;jumpPointer=null;input.axisX=0;input.axisZ=0;input.jump=false;input.jumpQueued=false;},
 };
}
