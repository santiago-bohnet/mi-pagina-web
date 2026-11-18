// Vuelo libre opcional en Cosmos: WASD, flechas, ratón y controles táctiles.
// Al salir se vuelve al itinerario con scroll de Kuro, sin alterar el progreso.
export const COSMIC_WAYPOINTS=Object.freeze([
 {name:'Estación Aurora',x:85,y:42,z:-18,description:'Una estación orbital de exploradores interestelares.'},
 {name:'Nebulosa Esmeralda',x:-87,y:40,z:-155,description:'Una nube de gas y estrellas jóvenes.'},
 {name:'Singularidad Oscura',x:-105,y:46,z:-235,description:'Una región de gravedad extrema y disco de acreción.'},
 {name:'Puerta de Gusano',x:104,y:28,z:-179,description:'Un pasaje experimental hacia otra región del universo.'},
 {name:'Civilización Exterior',x:138,y:12,z:-291,description:'Estructuras construidas por exploradores desconocidos.'},
 {name:'Planeta Borealis',x:80,y:35,z:-38,description:'Un gigante oceánico de tormentas azules.'},
 {name:'Planeta Umbra',x:-90,y:20,z:-177,description:'Un planeta oscuro rodeado de anillos.'},
 {name:'Planeta Arca',x:128,y:45,z:-296,description:'Un mundo turquesa lleno de regiones desconocidas.'}
]);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const angle=(a)=>Math.atan2(Math.sin(a),Math.cos(a));
export function createCosmicPilot({document:doc=globalThis.document,win=globalThis.window}={}){
 const panel=doc.createElement('aside');panel.id='xr-pilot';panel.hidden=true;
 panel.innerHTML=`<strong>PILOTAJE LIBRE · COSMOS</strong>
 <p id="xr-pilot-status" role="status">Kuro: Las coordenadas son tuyas. Dirigí la nave.</p>
 <label>Destino a explorar<select id="xr-waypoints"></select></label>
 <div class="xr-pilot-buttons">
 <button type="button" id="xr-autopilot">Ir al destino</button>
 <button type="button" id="xr-exit-flight">Volver al recorrido</button></div>
 <div class="xr-pad" aria-label="Controles táctiles">
 <button data-flight="forward" aria-label="Avanzar">↑</button>
 <button data-flight="left" aria-label="Girar a izquierda">←</button>
 <button data-flight="back" aria-label="Retroceder">↓</button>
 <button data-flight="right" aria-label="Girar a derecha">→</button>
 <button data-flight="up" aria-label="Subir">+</button>
 <button data-flight="down" aria-label="Bajar">−</button></div>
 <small>W/S: avanzar · A/D: desplazarse · flechas: girar · Q/E: bajar/subir · Arrastrar: mirar</small>`;
 doc.body.append(panel);
 const begin=doc.createElement('button');begin.id='xr-pilot-open';
 begin.type='button';begin.textContent='Pilotear libremente la nave';begin.hidden=true;doc.body.append(begin);
 const el=id=>panel.querySelector('#'+id),keys=new Set();
 for(const item of COSMIC_WAYPOINTS)el('xr-waypoints').add(new Option(item.name,item.name));
 let active=false,position={x:0,y:-87,z:22},yaw=Math.PI,velocity=0,waypoint=null;
 let dragging=false,lastX=0,landing=false;
 const status=msg=>{el('xr-pilot-status').textContent='Kuro: '+msg;};
 const moveKey=code=>{
  const key=code.toLowerCase();
  if(key==='w'||key==='arrowup')return'forward';
  if(key==='s'||key==='arrowdown')return'back';
  if(key==='a')return'strafeLeft';
  if(key==='d')return'strafeRight';
  if(key==='arrowleft')return'left';
  if(key==='arrowright')return'right';
  if(key==='e'||key===' ')return'up';
  if(key==='q')return'down';
  return null;
 };
 function start(state){
  position={x:state.x,y:state.y,z:state.z};yaw=state.yaw||Math.PI;
  active=true;keys.clear();velocity=0;waypoint=null;
  panel.hidden=false;begin.hidden=true;
  doc.body.classList.add('xr-piloting');
  status('Elegí un destino, o movete libremente por el espacio.');
  el('xr-exit-flight').focus();
 }
 function stop(){
  active=false;keys.clear();waypoint=null;velocity=0;
  panel.hidden=true;doc.body.classList.remove('xr-piloting');
 }
 let latestState=null,latestZone='';
 begin.addEventListener('click',()=>{if(latestState)start(latestState);});
 el('xr-exit-flight').addEventListener('click',stop);
 el('xr-autopilot').addEventListener('click',()=>{
  waypoint=COSMIC_WAYPOINTS.find(w=>w.name===el('xr-waypoints').value)||null;
  if(waypoint)status('Rumbo a '+waypoint.name+'. '+waypoint.description);
 });
 win.addEventListener('keydown',e=>{
  if(!active)return;
  if(e.key==='Escape'){stop();return;}
  if(/INPUT|TEXTAREA|SELECT/.test(doc.activeElement?.tagName||''))return;
  const cmd=moveKey(e.key);
  if(cmd){e.preventDefault();keys.add(cmd);if(cmd!=='left'&&cmd!=='right')waypoint=null;}
 });
 win.addEventListener('keyup',e=>{const cmd=moveKey(e.key);if(cmd)keys.delete(cmd);});
 win.addEventListener('blur',()=>{keys.clear();dragging=false;});
 win.addEventListener('wheel',e=>{
  if(!active||!e.cancelable)return;
  if(e.target.closest?.('#xr-pilot select'))return;
  e.preventDefault();
 },{passive:false,capture:true});
 win.addEventListener('scroll',()=>{
  if(active&&latestZone!=='dimensions')stop();
 },{passive:true});
 for(const button of panel.querySelectorAll('[data-flight]')){
  const command=button.dataset.flight;
  const down=e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);keys.add(command);waypoint=null;};
  const up=e=>{e.preventDefault();keys.delete(command);};
  button.addEventListener('pointerdown',down);
  button.addEventListener('pointerup',up);
  button.addEventListener('pointercancel',up);
  button.addEventListener('lostpointercapture',()=>keys.delete(command));
 }
 win.addEventListener('pointerdown',e=>{
  if(!active||e.target.closest?.('#xr-pilot')||e.target.closest?.('button,a,input'))return;
  dragging=true;lastX=e.clientX;
 });
 win.addEventListener('pointermove',e=>{
  if(!active||!dragging)return;
  yaw=angle(yaw-(e.clientX-lastX)*.0035);lastX=e.clientX;waypoint=null;
 });
 win.addEventListener('pointerup',()=>{dragging=false;});
 function update(dt){
  if(!active)return null;
  const step=clamp(dt,0,.07);
  if(waypoint){
   const dx=waypoint.x-position.x,dy=waypoint.y-(position.y+96),dz=waypoint.z-position.z;
   const distance=Math.hypot(dx,dy,dz);
   if(distance<14){
    status('Llegamos a '+waypoint.name+'. '+waypoint.description);
    waypoint=null;velocity=0;
   }else{
    const aim=Math.atan2(dx,dz);
    yaw=angle(yaw+clamp(angle(aim-yaw),-step*.95,step*.95));
    const travel=Math.min(distance-10,27*step);
    position.x+=dx/distance*travel;position.y+=dy/distance*travel;position.z+=dz/distance*travel;
   }
  }else{
   if(keys.has('left'))yaw=angle(yaw-step*1.1);
   if(keys.has('right'))yaw=angle(yaw+step*1.1);
   const command=(keys.has('forward')?1:0)-(keys.has('back')?1:0);
   const strafe=(keys.has('strafeRight')?1:0)-(keys.has('strafeLeft')?1:0);
   velocity+=(command*35-velocity)*Math.min(1,step*3);
   position.x+=Math.sin(yaw)*velocity*step+Math.cos(yaw)*strafe*20*step;
   position.z+=Math.cos(yaw)*velocity*step-Math.sin(yaw)*strafe*20*step;
   position.y+=((keys.has('up')?1:0)-(keys.has('down')?1:0))*20*step;
  }
  position.x=clamp(position.x,-185,185);
  position.y=clamp(position.y,-120,75);
  position.z=clamp(position.z,-430,95);
  return {...position,yaw,bank:keys.has('left')?.06:keys.has('right')?-.06:0};
 }
 function showButton(state,zone,teleport=false){
  latestState=state;latestZone=zone;
  const valid=zone==='dimensions'&&state.level===3&&!teleport;
  begin.hidden=!valid||active;
  if(active&&!valid)stop();
 }
 return {showButton,start,stop,update,get active(){return active;}};
}
