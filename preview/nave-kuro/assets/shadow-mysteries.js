// Secretos y encuentros opcionales de Sombras; no exige base de datos.
const EVENTS=[
 {id:'eyes',name:'Los ojos del bosque',text:'Entre los troncos aparecen ojos violetas. Se apagan cuando Kuro se acerca. Quizá estén protegiendo un sendero.'},
 {id:'grave',name:'El cementerio olvidado',text:'Una inscripción sobre una tumba menciona a viajeros que atravesaron las dimensiones antes que nosotros.'},
 {id:'mist',name:'La niebla susurrante',text:'La neblina se arremolina alrededor de la nave y revela por unos segundos las ruinas de una ciudad perdida.'},
 {id:'lake',name:'El lago de las voces',text:'En el agua negra se reflejan estrellas de un cielo que no existe en esta dimensión.'}
];
const SECRET={
 id:'shadow-gate',name:'La puerta oculta',
 text:'Detrás de un arco cubierto de hiedra descubrís una sala prohibida. Kuro encuentra símbolos antiguos que parecen señalar hacia el Cosmos.'
};
export function createShadowMysteries(store,{doc=document,THREE=null}={}){
 const button=doc.createElement('button');button.id='xr-shadow-open';button.hidden=true;
 button.type='button';button.textContent='Investigar el bosque de las sombras';doc.body.append(button);
 const layer=doc.createElement('section');layer.id='xr-mystery';layer.hidden=true;
 layer.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="xr-mystery-title">
  <span>KURO · DESCUBRIMIENTO</span><h2 id="xr-mystery-title"></h2>
  <canvas id="xr-mystery-canvas" aria-label="Sala secreta tridimensional del bosque oscuro"></canvas>
  <p id="xr-mystery-story"></p>
  <p id="xr-mystery-hint"></p><div>
  <button type="button" id="xr-mystery-open-door">Abrir puerta secreta</button>
  <button type="button" id="xr-mystery-close">Volver al recorrido</button></div></div>`;
 doc.body.append(layer);
 const el=id=>layer.querySelector('#'+id);
 let lastFocus=null,visits=0,wasActive=false,renderer=null,scene=null,camera=null;
 let gate=null,relic=null,opening=0,doorOpened=false,first=null;
 function makeChamber(){
  if(!THREE||renderer)return;
  const canvas=el('xr-mystery-canvas');
  try{
   renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
   renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));
   scene=new THREE.Scene();scene.background=new THREE.Color(0x0a0b17);
   scene.fog=new THREE.FogExp2(0x141027,.026);
   camera=new THREE.PerspectiveCamera(55,1,.1,200);
   camera.position.set(0,5,24);camera.lookAt(0,4,-10);
   scene.add(new THREE.HemisphereLight(0x8f72b1,0x091117,1.5));
   const lantern=new THREE.PointLight(0xb565f1,200,70);lantern.position.set(-4,10,7);scene.add(lantern);
   const stone=new THREE.MeshStandardMaterial({color:0x333243,roughness:.95});
   const dark=new THREE.MeshStandardMaterial({color:0x171321,roughness:.88,metalness:.1});
   const glyph=new THREE.MeshStandardMaterial({
    color:0xa874d1,emissive:0x662ca5,emissiveIntensity:1.1,metalness:.6,roughness:.3
   });
   const add=(geo,mat,x,y,z,parent=scene)=>{
    const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);parent.add(o);return o;
   };
   add(new THREE.BoxGeometry(40,.8,56),stone,0,-.6,-9);
   add(new THREE.BoxGeometry(40,25,1.4),dark,0,12,-34);
   for(const side of [-1,1]){
    add(new THREE.BoxGeometry(1,22,53),stone,side*19,10,-9);
    for(let i=0;i<6;i++){
     add(new THREE.CylinderGeometry(.8,1,18,10),stone,side*11,9,17-i*9);
     const torch=add(new THREE.SphereGeometry(.34,8,6),glyph,side*10,12,17-i*9);
    }
   }
   // Puerta como objeto 3D real con pivote; abre hacia una cámara interior.
   const frame=add(new THREE.BoxGeometry(10,14,2.0),stone,0,7,-22);
   const arch=add(new THREE.TorusGeometry(5,.8,12,40,Math.PI),stone,0,14,-21);
   gate=new THREE.Group();gate.position.set(-4.7,7,-20.8);scene.add(gate);
   const leaf=add(new THREE.BoxGeometry(9.4,13.3,.7),dark,4.7,0,0,gate);
   for(let i=0;i<5;i++)add(new THREE.TorusGeometry(2+i*.45,.09,8,36),glyph,
    4.7,0,.44,gate);
   relic=add(new THREE.OctahedronGeometry(2.2,2),glyph,0,5,-28);
   relic.visible=false;
   const plinth=add(new THREE.CylinderGeometry(2.8,3.5,2.2,12),stone,0,1,-28);
   const floorSymbol=add(new THREE.RingGeometry(5.2,5.5,60),glyph,0,-.15,-27);
   floorSymbol.rotation.x=-Math.PI/2;
  }catch(e){
   renderer?.dispose();renderer=null;
   el('xr-mystery-canvas').hidden=true;
  }
 }
 function close(){layer.hidden=true;doc.body.classList.remove('xr-mystery-open');lastFocus?.focus?.();}
 function open(){
  visits++;lastFocus=doc.activeElement;
  const index=(visits*7+Math.floor(Date.now()/120000))%EVENTS.length;
  const event=EVENTS[index];
  el('xr-mystery-title').textContent=event.name;
  el('xr-mystery-story').textContent=event.text;
  el('xr-mystery-hint').textContent='Explorá el salón antiguo. Una puerta oculta guarda un secreto.';
  el('xr-mystery-open-door').hidden=false;
  doorOpened=false;opening=0;
  layer.hidden=false;doc.body.classList.add('xr-mystery-open');
  makeChamber();
  if(gate)gate.rotation.y=0;
  if(relic)relic.visible=false;
  el('xr-mystery-open-door').focus();
 }
 button.addEventListener('click',open);
 el('xr-mystery-close').addEventListener('click',close);
 el('xr-mystery-open-door').addEventListener('click',()=>{
  store.discover(SECRET.id);
  el('xr-mystery-title').textContent=SECRET.name;
  el('xr-mystery-story').textContent=SECRET.text;
  el('xr-mystery-hint').textContent='La puerta se abre en el escenario 3D. Se registró el hallazgo en este navegador.';
  doorOpened=true;
  el('xr-mystery-open-door').hidden=true;
 });
 layer.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 function updateScene(t){
  if(layer.hidden||!renderer||!scene)return;
  const canvas=el('xr-mystery-canvas'),w=canvas.clientWidth||530,h=canvas.clientHeight||280;
  camera.aspect=w/h;camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
  if(doorOpened)opening=Math.min(1,opening+.026);
  gate.rotation.y=-Math.PI*.62*(opening*opening*(3-2*opening));
  relic.visible=opening>.65;
  relic.rotation.y=t*.45;
  relic.position.y=5+Math.sin(t*.7)*.3;
  renderer.render(scene,camera);
 }
 function update(state,zone,teleporting=false){
  const available=zone==='dimensions'&&state.level===2&&state.f>.72&&state.f<.91&&!teleporting;
  button.hidden=!available||!layer.hidden;
  if(!available&&wasActive&&!layer.hidden)close();
  wasActive=available;
 }
 return {update,updateScene,open,close,isOpen:()=>!layer.hidden};
}