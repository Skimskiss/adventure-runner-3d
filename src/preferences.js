export const SETTINGS_KEY='adventure-runner-settings-v1';
export function loadSettings(storage){
 try{const s=JSON.parse(storage.getItem(SETTINGS_KEY));return {muted:s?.muted===true,haptics:s?.haptics!==false};}catch{return {muted:false,haptics:true};}
}
export function storeSettings(storage,settings){try{storage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}}
export function deviceProfile(nav={},touch=false){
 const low=(Number.isFinite(nav.deviceMemory)&&nav.deviceMemory<=4)||(Number.isFinite(nav.hardwareConcurrency)&&nav.hardwareConcurrency<=4)||nav.connection?.saveData===true;
 return {low,touch,quality:low||touch?'low':'high',pixelRatio:low ? .85 : touch ? 1.25 : 1.5};
}
export function feedback(event,nav=globalThis.navigator,enabled=true){
 if(!enabled||typeof nav?.vibrate!=='function')return false;
 const pattern={jump:12,coin:7,hurt:[30,35,45],checkpoint:[12,25,18]};
 if(!pattern[event])return false;
 try{return nav.vibrate(pattern[event]);}catch{return false;}
}
export function performanceStep(state,delta,playing=true){
 if(!playing||delta<=0||delta>.5)return state;
 const samples=state.samples+1,elapsed=state.elapsed+delta;
 if(elapsed<2)return {...state,samples,elapsed};
 const fps=samples/elapsed;return {samples:0,elapsed:0,fps,downgrade:fps<50};
}

