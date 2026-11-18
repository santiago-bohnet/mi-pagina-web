// El scroll mueve la nave en LÍNEA RECTA, hacia el horizonte (-Z).
// No hay alternancia izquierda/derecha ni descensos entre portales.
export const FLIGHT_PATH = Object.freeze({
  startZ: 22,
  endZ: -158,
  altitude: 6,
  openingZ: 75
});
export const smooth = value => {
  const n = Math.max(0, Math.min(1, value));
  return n * n * (3 - 2 * n);
};
const mix = (a,b,t)=>a+(b-a)*t;

export function journeyAt({ scroll, stages, viewportHeight }) {
  let level = 0;
  for(let i=1;i<stages.length;i++){
    if(scroll >= stages[i].top - viewportHeight * .12) level=i;
  }
  const start=stages[level].top;
  const end=stages[level+1]?.top ?? start+stages[level].height;
  const f=Math.max(0,Math.min(1,(scroll-start)/Math.max(1,end-start)));
  return {
    level,f,side:1,fall:0,
    x:0, y:-32*level+FLIGHT_PATH.altitude,
    z:mix(FLIGHT_PATH.startZ,FLIGHT_PATH.endZ,smooth(f)),
    active:scroll>stages[0].top-viewportHeight*.8
  };
}

let layout;
export function readJourney() {
  if(!layout || layout.viewportWidth!==innerWidth || layout.viewportHeight!==innerHeight){
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
