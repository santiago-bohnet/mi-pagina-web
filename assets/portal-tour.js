// Parada narrativa en el portal de cada dimensión.
// La posición y la duración se rigen por el scroll, no por un temporizador.
const PLACES=[
  {title:'Portal de la Luz',details:'Kuro: Este es el Portal de la Luz. Más allá comienza el reino celestial.',color:'luz'},
  {title:'Portal del Fuego',details:'Kuro: Este es el Portal del Fuego. Del otro lado te espera la dimensión infernal.',color:'fuego'},
  {title:'Portal de las Sombras',details:'Kuro: Este es el Portal de las Sombras. Elegí si querés descubrir sus secretos.',color:'sombras'},
  {title:'Portal del Cosmos',details:'Kuro: Este es el Portal del Cosmos. Conecta con los mundos estelares.',color:'cosmos'}
];
export function createPortalTour(){
  const panel=document.getElementById('portal-stop');
  const title=document.getElementById('portal-stop-title');
  const description=document.getElementById('portal-stop-text');
  const hint=document.getElementById('portal-stop-hint');
  const enter=document.getElementById('portal-stop-enter');
  const continueButton=document.getElementById('portal-stop-continue');
  let activeLevel=-1,activePhase='';
  let currentState=null;
  const phases={
    landing:'La nave se aproxima y desciende junto al portal…',
    disembark:'Kuro baja de la nave para mostrarte el portal.',
    guide:'¿Querés entrar o seguir recorriendo este mundo?',
    reboard:'Kuro vuelve a subir a la nave. Seguí desplazándote para despegar.',
    takeoff:'Ascendiendo. Continuamos nuestro vuelo.'
  };
  function update(state,zone,teleporting=false){
    const stop=state?.stop;
    const active=zone==='dimensions'&&!teleporting&&stop?.visible;
    if(!active){
      panel.hidden=true;
      document.body.classList.remove('at-portal-stop');
      activeLevel=-1;activePhase='';
      currentState=null;
      return;
    }
    currentState=state;
    const point=PLACES[state.level];
    if(activeLevel!==state.level||activePhase!==stop.phase){
      panel.dataset.side=state.level%2?'left':'right';
      panel.dataset.phase=stop.phase;
      title.textContent=point.title;
      description.textContent=point.details;
      hint.textContent=phases[stop.phase]||'Seguí el recorrido para continuar.';
      activeLevel=state.level;activePhase=stop.phase;
    }
    panel.hidden=false;
    const selectable=stop.interactable;
    enter.hidden=!selectable;
    continueButton.hidden=!selectable;
    // Durante la exposición, la consola de salto se oculta para evitar una
    // transición accidental antes de que Kuro vuelva a subir.
    document.body.classList.toggle('at-portal-stop',stop.parked>.25);
  }
  enter.addEventListener('click',()=>{
    if(!currentState?.stop?.interactable)return;
    // El modal inmersivo existente permite visitar el portal y volver sin
    // perder el punto de la ruta en el que estacionó Kuro.
    document.querySelector('[data-dimension="'+currentState.level+'"]')?.click();
  });
  continueButton.addEventListener('click',()=>{
    if(!currentState)return;
    const stage=document.getElementById('tunel-'+currentState.level);
    if(!stage)return;
    const top=stage.getBoundingClientRect().top+scrollY;
    // Empujamos hasta la fase de embarque, no a la dimensión siguiente.
    window.scrollTo({
      top:top+stage.offsetHeight*.665,
      behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'
    });
  });
  // Atenuar sólo el movimiento de la rueda/táctil durante la visita.
  // La nave ya queda inmóvil en la plataforma; esto evita que un gesto
  // rápido saltee la explicación y el reembarque. Fuera de la parada
  // conservamos el scroll nativo del navegador.
  const slowdown=0.30;
  const slowing=()=>!!currentState?.stop?.visible &&
    currentState.f>=.37 && currentState.f<=.69 &&
    !document.body.classList.contains('is-teleporting') &&
    !document.body.style?.overflow;
  let lastTouchY=null;
  if(typeof window.addEventListener==='function'){
    window.addEventListener('wheel',event=>{
      if(!slowing()||!event.cancelable||event.ctrlKey)return;
      event.preventDefault();
      const factor=event.deltaMode===1?16:event.deltaMode===2?innerHeight:1;
      window.scrollBy(0,event.deltaY*factor*slowdown);
    },{passive:false});
    window.addEventListener('touchstart',event=>{
      if(event.touches.length!==1){lastTouchY=null;return;}
      lastTouchY=event.touches[0].clientY;
    },{passive:true});
    window.addEventListener('touchmove',event=>{
      if(lastTouchY===null||event.touches.length!==1)return;
      const y=event.touches[0].clientY;
      if(!slowing()||!event.cancelable){
        lastTouchY=y;return;
      }
      if(event.target.closest?.('button,a,[role="dialog"]'))return;
      event.preventDefault();
      window.scrollBy(0,(lastTouchY-y)*slowdown);
      lastTouchY=y;
    },{passive:false});
    window.addEventListener('touchend',()=>{lastTouchY=null;},{passive:true});
    window.addEventListener('touchcancel',()=>{lastTouchY=null;},{passive:true});
  }
  return {update};
}
