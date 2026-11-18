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
export function createShadowMysteries(store,{doc=document}={}){
 const button=doc.createElement('button');button.id='xr-shadow-open';button.hidden=true;
 button.type='button';button.textContent='Investigar el bosque de las sombras';doc.body.append(button);
 const layer=doc.createElement('section');layer.id='xr-mystery';layer.hidden=true;
 layer.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="xr-mystery-title">
  <span>KURO · DESCUBRIMIENTO</span><h2 id="xr-mystery-title"></h2>
  <p id="xr-mystery-story"></p>
  <p id="xr-mystery-hint"></p><div>
  <button type="button" id="xr-mystery-open-door">Abrir puerta secreta</button>
  <button type="button" id="xr-mystery-close">Volver al recorrido</button></div></div>`;
 doc.body.append(layer);
 const el=id=>layer.querySelector('#'+id);
 let lastFocus=null,encounter=0,visits=0;
 function close(){
  layer.hidden=true;doc.body.classList.remove('xr-mystery-open');lastFocus?.focus?.();
 }
 function open(){
  visits++;
  lastFocus=doc.activeElement;
  const index=(visits*7+Math.floor(Date.now()/120000))%EVENTS.length;
  const event=EVENTS[index];
  encounter=index;
  el('xr-mystery-title').textContent=event.name;
  el('xr-mystery-story').textContent=event.text;
  el('xr-mystery-hint').textContent='El bosque guarda una puerta oculta. Podés investigar el arco antiguo.';
  layer.hidden=false;doc.body.classList.add('xr-mystery-open');
  el('xr-mystery-open-door').focus();
 }
 button.addEventListener('click',open);
 el('xr-mystery-close').addEventListener('click',close);
 el('xr-mystery-open-door').addEventListener('click',()=>{
  store.discover(SECRET.id);
  el('xr-mystery-title').textContent=SECRET.name;
  el('xr-mystery-story').textContent=SECRET.text;
  el('xr-mystery-hint').textContent='Se registró el hallazgo en este navegador. Seguiremos descifrando los símbolos durante el recorrido.';
  el('xr-mystery-open-door').hidden=true;
 });
 layer.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 let wasActive=false;
 function update(state,zone,teleporting=false){
  const available=zone==='dimensions'&&state.level===2&&state.f>.66&&state.f<.91&&!teleporting;
  button.hidden=!available||!layer.hidden;
  if(!available&&wasActive&&!layer.hidden)close();
  if(available&&!wasActive){
   el('xr-mystery-open-door').hidden=false;
  }
  wasActive=available;
 }
 return {update,open,close,isOpen:()=>!layer.hidden};
}
