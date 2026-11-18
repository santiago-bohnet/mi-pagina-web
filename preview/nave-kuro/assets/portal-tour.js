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
  return {update};
}
