// Ajuste de resolución dinámico con histéresis.
// No modifica la geometría ni crea objetos por cuadro; WebGL permanece estable.
export function createRenderQualityController(renderer,{
  width=()=>innerWidth,height=()=>innerHeight,
  pixelRatio=()=>devicePixelRatio,
  mobile=()=>innerWidth<750,
  reduced=false
}={}){
  const bounds=()=>{
    const scale=mobile()?{min:.65,max:1.16}:{min:.75,max:1.8};
    return scale;
  };
  let ratio=Math.min(pixelRatio(),mobile()?1.12:1.55);
  let frames=0,sum=0,slowWindows=0,fastWindows=0,lastDecision=0;
  let lastWidth=0,lastHeight=0;
  function resize(force=false){
    const w=width(),h=height();
    if(!force&&w===lastWidth&&h===lastHeight)return;
    lastWidth=w;lastHeight=h;
    renderer.setPixelRatio(ratio);
    renderer.setSize(w,h);
  }
  resize(true);
  function update(frameSeconds,timeSeconds){
    if(reduced)return;
    if(!Number.isFinite(frameSeconds)||frameSeconds<=0||frameSeconds>.3)return;
    frames++;sum+=frameSeconds;
    if(frames<110)return;
    const avg=sum/frames;
    frames=0;sum=0;
    if(timeSeconds-lastDecision<3)return;
    const {min,max}=bounds();
    if(avg>1/38){slowWindows++;fastWindows=0;}
    else if(avg<1/63){fastWindows++;slowWindows=0;}
    else{slowWindows=0;fastWindows=0;}
    let next=ratio;
    if(slowWindows>=2){next=Math.max(min,ratio*.85);slowWindows=0;}
    else if(fastWindows>=3){next=Math.min(max,ratio*1.07);fastWindows=0;}
    if(Math.abs(next-ratio)>.015){
      ratio=next;lastDecision=timeSeconds;resize(true);
    }
  }
  function state(){return {ratio,frames,slowWindows,fastWindows};}
  return {update,resize,state};
}
