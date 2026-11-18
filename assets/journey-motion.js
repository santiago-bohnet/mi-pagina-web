// Trayectoria cinematográfica con curvas amplias (no zigzag lateral).
// El avión siempre apunta en la dirección de su velocidad.
// Cada mundo ocupa varios largos de pantalla. En el tramo central hay una
// parada real: la nave desacelera, aterriza, Kuro baja y vuelve a subir.
export const FLIGHT_PATH=Object.freeze({startZ:65,endZ:-270,altitude:9,openingZ:100});
export const PORTAL_STOP=Object.freeze({
  approachStart:.37, dockStart:.43, greetStart:.49,
  greetEnd:.57, boardingEnd:.64, departEnd:.69,
  parkProgress:.53, portalZ:-112, portalX:21
});
export const smooth=value=>{
  const n=Math.max(0,Math.min(1,value));
  return n*n*(3-2*n);
};
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

function lateral(progress) {
  const p=clamp(progress,0,1);
  // Las curvas se desvanecen en la entrada y la salida para que los
  // teletransportes y el cambio de mundo no den tirones.
  const envelope=Math.sin(Math.PI*p)**2;
  return envelope*(13.2*Math.sin(p*Math.PI*2)+4.2*Math.sin(p*Math.PI*4));
}

export function sampleFlightPath(progress) {
  const p=clamp(progress,0,1);
  const eps=.002;
  const derivative=(lateral(clamp(p+eps,0,1))-lateral(clamp(p-eps,0,1)))/
    Math.max(.00001,clamp(p+eps,0,1)-clamp(p-eps,0,1));
  const curvature=(lateral(clamp(p+eps,0,1))-2*lateral(p)+
    lateral(clamp(p-eps,0,1)))/(eps*eps);
  const envelope=Math.sin(Math.PI*p)**2;
  return {
    x:lateral(p),
    y:FLIGHT_PATH.altitude+envelope*.65*Math.sin(p*Math.PI*2),
    z:mix(FLIGHT_PATH.startZ,FLIGHT_PATH.endZ,p),
    // +Z local es la trompa; al girar PI, apunta hacia -Z mundial.
    // El signo mantiene alineada la trompa con la tangente, sin ir de costado.
    yaw:Math.PI-Math.atan2(derivative,FLIGHT_PATH.startZ-FLIGHT_PATH.endZ),
    bank:clamp(-curvature*.00022,-.11,.11)
  };
}

export function getStopState(f,level) {
  const n=clamp(f,0,1),stop=PORTAL_STOP;
  const approach=smooth((n-stop.approachStart)/(stop.dockStart-stop.approachStart));
  const departure=smooth((n-stop.boardingEnd)/(stop.departEnd-stop.boardingEnd));
  const parked=approach*(1-departure);
  const out=smooth((n-stop.dockStart)/(stop.greetStart-stop.dockStart))*
    (1-smooth((n-stop.greetEnd)/(stop.boardingEnd-stop.greetEnd)));
  const side=level%2===0?-1:1;
  return {
    visible:n>=stop.approachStart&&n<=stop.departEnd,
    phase:n<stop.approachStart?'flight'
      :n<stop.dockStart?'landing'
      :n<stop.greetStart?'disembark'
      :n<stop.greetEnd?'guide'
      :n<stop.boardingEnd?'reboard'
      :n<stop.departEnd?'takeoff':'flight',
    parked, out,
    portalX:side*stop.portalX,
    portalZ:stop.portalZ,
    interactable:n>=stop.greetStart&&n<=stop.greetEnd,
    level
  };
}

export function travelProgress(f) {
  const n=clamp(f,0,1),s=PORTAL_STOP;
  if(n<=s.dockStart)return s.parkProgress*smooth(n/s.dockStart);
  if(n<s.boardingEnd)return s.parkProgress;
  return s.parkProgress+(1-s.parkProgress)*
    smooth((n-s.boardingEnd)/(1-s.boardingEnd));
}

export function journeyAt({scroll,stages,viewportHeight}) {
  let level=0;
  for(let i=1;i<stages.length;i++){
    if(scroll>=stages[i].top-viewportHeight*.12)level=i;
  }
  const start=stages[level].top;
  const end=stages[level+1]?.top??start+stages[level].height;
  const f=clamp((scroll-start)/Math.max(1,end-start),0,1);
  const stop=getStopState(f,level);
  const path=sampleFlightPath(travelProgress(f));
  // Durante el descenso la nave se acerca lateralmente al portal y reduce
  // altura. En el despegue vuelve suavemente a su ruta de vuelo.
  // El tren de aterrizaje debe tocar la plataforma (superficie Y=-4.6).
  // Con la escala de la nave y las patas extendidas, el centro Y=-1.7
  // deja los patines apoyados, en lugar de flotar varios metros arriba.
  const dockX=stop.portalX*(13/21);
  const offset=stop.parked;
  const x=mix(path.x,dockX,offset);
  const y=mix(path.y,-1.7,offset);
  const z=mix(path.z,stop.portalZ+7,offset);
  const facing=Math.atan2(stop.portalX-x,stop.portalZ-z);
  // Interpolación angular corta: nunca gira un círculo completo al aparcar.
  const relative=Math.atan2(Math.sin(facing-path.yaw),Math.cos(facing-path.yaw));
  const yaw=path.yaw+relative*offset;
  return {
    level,f,side:1,fall:0,
    x,y:-32*level+y,z,
    yaw,bank:path.bank*(1-offset),stop,
    distance:travelProgress(f),
    active:scroll>stages[0].top-viewportHeight*.8
  };
}

let layout;
export function readJourney() {
  if(!layout||layout.viewportWidth!==innerWidth||layout.viewportHeight!==innerHeight){
    layout={
      stages:Array.from({length:4},(_,i)=>{
        const el=document.getElementById('tunel-'+i);
        const rect=el.getBoundingClientRect();
        return {top:rect.top+scrollY,height:rect.height};
      }),
      viewportHeight:innerHeight,viewportWidth:innerWidth
    };
  }
  return journeyAt({scroll:scrollY,...layout});
}
