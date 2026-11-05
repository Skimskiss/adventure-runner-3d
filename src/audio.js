// AudioContext and the complete score are created only after a user gesture.
let context,master,timer,step=0,enabled=true,musicActive=false;
export function audioStatus(){return {created:!!context,enabled,musicActive,scheduled:!!timer};}
export function enableSound(value){enabled=value;if(master&&context)master.gain.setTargetAtTime(value?.72:0,context.currentTime,.08);scheduleMusic();}
export function unlockAudio(){
 try{
  if(!context){context=new(window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=enabled?.72:0;master.connect(context.destination);}
  if(context.state==='suspended')context.resume().then(scheduleMusic).catch(()=>{});else scheduleMusic();
 }catch{}
}
export function setMusicPlaying(value){musicActive=value;scheduleMusic();}
function note(frequency,start,duration,type='sine',volume=.065){
 if(!enabled||!context||context.state!=='running')return;
 const osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,context.currentTime+start);
 gain.gain.setValueAtTime(.0001,context.currentTime+start);gain.gain.linearRampToValueAtTime(volume,context.currentTime+start+.015);gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+start+duration);
 osc.connect(gain);gain.connect(master);osc.start(context.currentTime+start);osc.stop(context.currentTime+start+duration+.03);
 osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
const melody=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5,880,783.99,659.25,587.33];
function scheduleMusic(){
 if(timer){clearTimeout(timer);timer=null;}
 if(!musicActive||!enabled||!context||context.state!=='running')return;
 note(melody[step%melody.length],.02,.48,'sine',.018);
 if(step%4===0)note([130.81,146.83,130.81,174.61][Math.floor(step/4)%4],0,1.6,'triangle',.014);
 step++;timer=setTimeout(scheduleMusic,430);
}
export function playSound(event){
 if(event==='coin'){note(988,0,.13);note(1480,.06,.2);}
 if(event==='jump'){note(260,0,.08,'triangle',.04);note(390,.045,.09,'triangle',.035);}
 if(event==='land')note(100,0,.09,'triangle',.02);
 if(event==='hurt'){note(150,0,.18,'triangle');note(90,.08,.3,'triangle');}
 if(event==='checkpoint'||event==='start')[523,659,784].forEach((f,i)=>note(f,i*.12,.3,'triangle'));
 if(event==='win')[523,659,784,1047,784,1047].forEach((f,i)=>note(f,i*.15,.4,'triangle'));
}
