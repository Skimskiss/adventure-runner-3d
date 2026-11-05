// Explicit route layouts and theme palettes for the twelve-world adventure.
// Generated islands keep a bounded jump envelope; layouts are deterministic.
const specs = [
  ['Frostfall Peaks','Snowy passes and frozen falls',[0,-2,-4,-1,2,4,1,-2,0],[3,6],'snow'],
  ['Sunstone Dunes','Ancient ruins above the desert',[0,3,6,3,0,-3,-5,-2,1],[2,6],'desert'],
  ['Emerald Canopy','A winding trail through the jungle',[0,-3,-6,-3,0,3,6,3,0,-3],[3,7],'jungle'],
  ['Coral Coast','Palm islands over a turquoise sea',[0,2,4,2,-1,-4,-2,1,3],[2,5],'ocean'],
  ['Amberwood Valley','Golden forests and autumn leaves',[0,-2,1,4,1,-2,-5,-2,0,3],[3,7],'autumn'],
  ['Moonstone Orbit','A silver trail beneath the stars',[0,3,1,-2,-5,-2,1,4,2,0],[2,6,8],'moon'],
  ['Mushroom Hollow','Giant mushrooms and glowing spores',[0,-3,-1,2,5,2,-1,-4,-1,2,0],[3,7],'mushroom'],
  ['Thunderhead Isles','Storm clouds and electric beacons',[0,2,-1,-4,-1,2,5,2,-1,1],[2,5,8],'storm'],
  ['Obsidian Forge','Black rock and rivers of fire',[0,-3,-6,-3,0,3,1,-2,-5,-2,0],[3,6,9],'volcano'],
  ['Aurora Summit','The final climb under northern lights',[0,3,6,3,0,-3,-6,-3,0,3,0],[2,5,8],'aurora'],
];
function makeWorld([name, subtitle, layout, ferries, theme], offset) {
  const id = offset + 2, cpIndex = Math.floor(layout.length / 2);
  // Keep the checkpoint on solid ground, even if a route lists that index as a ferry.
  const movingIndices = ferries.filter(i => i !== cpIndex);
  let z = 2;
  const platforms = layout.map((x, i) => {
    const moving = movingIndices.includes(i), finish = i === layout.length-1;
    const d = i === 0 || finish ? 12 : moving ? 6 : 8 + (id + i) % 2;
    if (i) {
      const prevD = i === 1 ? 12 : movingIndices.includes(i-1) ? 6 : 8 + (id+i-1)%2;
      z -= prevD/2 + d/2 + 2.2 + ((id+i)%3)*.2;
    }
    return {id:i===0?'start':finish?'finish':i===cpIndex?'checkpoint':`island-${i}`,x,z,w:finish?12:moving?5.5:10,d,y:Math.min(2.2, i*.18),moving,amplitude:moving?1.1:0,rate:.55+(id%4)*.08,phase:id*.4};
  });
  const cp = platforms[cpIndex], end = platforms.at(-1);
  const coins = platforms.flatMap((p,i) => p.moving ? [] : [[p.x,p.y+1.1,p.z+p.d*.28],[p.x,p.y+1.1,p.z],[p.x,p.y+1.1,p.z-p.d*.28]]);
  const dangers = platforms.filter((p,i) => i>0 && i<platforms.length-1 && !p.moving && p.id!=='checkpoint');
  const rotators = dangers.filter((_,i)=>i%2===0).map((p,i)=>({x:p.x,z:p.z,y:p.y,length:4.6+(id%3)*.2,speed:(i%2?-1:1)*(.65+id*.035),phase:id*.3+i}));
  const hazards = dangers.filter((_,i)=>i%2===1).map(p=>({x:p.x-1.7,z:p.z,y:p.y,r:.8}));
  return {id,name,subtitle,theme,platforms,coins,hazards,rotators,spawn:[0,0,4],checkpoint:[cp.x,cp.y,cp.z+1],flag:[cp.x-2.7,cp.y,cp.z+1],portal:[end.x,end.y,end.z-2.5],stages:platforms.slice(1).map((p,i)=>[p.z+p.d/2+2,`${name} · crossing ${i+1}`]).concat([[-Infinity,`${name} · final gate`]])};
}
export const EXTRA_WORLDS = specs.map(makeWorld);
const theme = (name, ground, path, rock, skyTop, skyBottom, plant, foliage, water, cloud, accent, weather='none') => ({name,ground,path,rock,skyTop,skyBottom,plant,foliage,water,cloud,accent,weather});
export const THEMES = {
  garden:theme('garden','#78bd39','#e8c785',['#a18160','#b9956d','#c6a47d','#887968','#a5947d'],'#217aef','#c4e6ff','pine','#38a854','#219feb','#f3faff','#ffda70'),
  ember:theme('ember','#bc6951','#efbc83',['#8b5364','#b06c70','#c3847a','#63516d','#9c7280'],'#332066','#faa478','crystal','#ba88ed','#f44b15','#c5a6cb','#d5aaff','embers'),
  snow:theme('snow','#edf8ff','#b5ddec',['#8babc1','#bed9e5','#c9e8f2','#7f96b6','#b5c8dd'],'#3c83be','#e4f6ff','snowpine','#97c2d3','#84d1f5','#f5fcff','#a6eaff','snow'),
  desert:theme('desert','#ddaf65','#f5d594',['#b5804c','#d4a36e','#e9b773','#a17551','#d4b27a'],'#348bd6','#ffe2b4','cactus','#59996a','#eec36a','#fff4dd','#ffd35f','dust'),
  jungle:theme('jungle','#347e46','#a9a96c',['#526756','#79946a','#8aa178','#4b6154','#a2b391'],'#326f79','#a4dbbc','palm','#16795b','#51c5b0','#d6ece1','#a1f282','spores'),
  ocean:theme('ocean','#e9d7a3','#fff0c3',['#6b9f9c','#87b8b0','#a8c9bb','#588a91','#d0d6b5'],'#1689cb','#a9f2f6','palm','#2fb284','#16c3d7','#f5ffff','#6eeff1'),
  autumn:theme('autumn','#c0934d','#e8cb85',['#836953','#a48c60','#c9ac76','#78604e','#b69b74'],'#617cb1','#f6d1a5','broadleaf','#ed9845','#9dc0c4','#f4e7d3','#ffd07b','leaves'),
  moon:theme('moon','#9babc6','#cbd9e6',['#5c6383','#939cba','#afb5d0','#535d7c','#7e8bab'],'#090f31','#555c96','crystal','#99bdff','#a2baff','#747697','#c5dcff','stars'),
  mushroom:theme('mushroom','#708795','#a9b9af',['#5d617e','#7e7ca0','#a19db8','#4f5c77','#898bad'],'#282b65','#b19cc8','mushroom','#f488ba','#9ee0e0','#c4b7dc','#ffb0e3','spores'),
  storm:theme('storm','#65778c','#a5b3bc',['#3e4b65','#67728a','#8997aa','#333e59','#7b8999'],'#172039','#859bad','beacon','#a8c7ff','#668ff5','#8a9db0','#87c8ff','rain'),
  volcano:theme('volcano','#553e49','#aa6f54',['#2b2939','#524252','#6d4a58','#292535','#7d5661'],'#2a1a33','#e38663','basalt','#e28b61','#ff5718','#aa777f','#ffb056','embers'),
  aurora:theme('aurora','#d6e8ed','#a8d5de',['#627d9e','#93b6c9','#bfdbe2','#4a6689','#9bb5d0'],'#071e3a','#4e8a9e','snowpine','#9fcbdf','#61e6ce','#a5d3dc','#7effd8','snow'),
};
export const getTheme = world => THEMES[world.theme || (world.id===1?'ember':'garden')];
