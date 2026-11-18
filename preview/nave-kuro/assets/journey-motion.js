// Trayectoria cinematográfica con curvas amplias (no zigzag lateral).
// El avión siempre apunta en la dirección de su velocidad.
export const FLIGHT_PATH=Object.freeze({startZ:22,endZ:-158,altitude:6,openingZ:75});
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
  return envelope*(10.2*Math.sin(p*Math.PI*2)+3*Math.sin(p*Math.PI*4));
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

export function journeyAt({scroll,stages,viewportHeight}) {
  let level=0;
  for(let i=1;i<stages.length;i++){
    if(scroll>=stages[i].top-viewportHeight*.12)level=i;
  }
  const start=stages[level].top;
  const end=stages[level+1]?.top??start+stages[level].height;
  const f=clamp((scroll-start)/Math.max(1,end-start),0,1);
  const path=sampleFlightPath(smooth(f));
  return {
    level,f,side:1,fall:0,
    x:path.x,y:-32*level+path.y,z:path.z,
    yaw:path.yaw,bank:path.bank,
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
