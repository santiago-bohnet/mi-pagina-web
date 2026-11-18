// Capa nubosa celestial: superficie y masas gaseosas de ruido fractal.
// No utiliza esferas, círculos, ni materiales de suelo rocoso.
function rand(x,y,s=0){const n=Math.sin(x*127.13+y*311.71+s*17.11)*43758.545;return n-Math.floor(n);}
function fade(x){return x*x*(3-2*x);}
function noise(x,y,s=0){
  const a=Math.floor(x),b=Math.floor(y),u=fade(x-a),v=fade(y-b);
  const p=rand(a,b,s),q=rand(a+1,b,s),r=rand(a,b+1,s),t=rand(a+1,b+1,s);
  return (p+(q-p)*u)*(1-v)+(r+(t-r)*u)*v;
}
function fractal(x,y,s=0){
  let v=0,amp=.55,frequency=1;
  for(let i=0;i<5;i++){v+=noise(x*frequency,y*frequency,s+i*13)*amp;frequency*=2.13;amp*=.53;}
  return v;
}
function makeCloudAtlas(THREE,compact){
  const n=compact?192:256;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=n;
  const ctx=canvas.getContext('2d');const img=ctx.createImageData(n,n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const u=(x+.5)/n*2-1,v=(y+.5)/n*2-1;
    const warp=fractal(u*2.9+8,v*2.4+3,2);
    const elongated=Math.sqrt((u*.89)**2+(v*1.3)**2);
    const billow=fractal(u*5.3+warp*1.45+3,v*5.4+warp*.91+7,19);
    const micro=fractal(u*14+5,v*14-5,35);
    const shape=1.18-elongated*1.04+(billow-.37)*.67+(micro-.37)*.19;
    const alpha=Math.max(0,Math.min(1,(shape-.39)*2.7));
    const i=(y*n+x)*4;
    const light=222+Math.round(Math.max(0,Math.min(1,billow)) * 30);
    img.data[i]=light;
    img.data[i+1]=Math.min(255,light+3);
    img.data[i+2]=255;
    img.data[i+3]=Math.round(alpha*222);
  }
  ctx.putImageData(img,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.LinearFilter;
  return texture;
}

// Plano raymarched de nubes: irregularidad fractal en lugar de círculos planos.
const floorVertex=`
varying vec2 vUv;
varying vec3 vWorld;
void main(){
  vUv=uv;
  vec4 world=modelMatrix*vec4(position,1.0);
  vWorld=world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}`;
const floorFragment=`
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorld;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float n2(vec2 p){
 vec2 i=floor(p),f=fract(p);
 f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
 mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
}
float fbm(vec2 p){
 float a=.55,s=0.;
 for(int i=0;i<5;i++){s+=n2(p)*a;p=p*2.09+vec2(12.6,3.5);a*=.51;}
 return s;
}
void main(){
 vec2 p=vWorld.xz*.034+vec2(uTime*.004,uTime*.002);
 float warp=fbm(p*.69+7.);
 float depth=fbm(p*2.5+warp*1.75);
 float wisps=fbm(p*6.4-warp*.36);
 float density=smoothstep(.24,.8,depth*.84+warp*.48+wisps*.12);
 float highlight=smoothstep(.36,.85,fbm(p*.65+14.)*.6+depth*.55);
 vec3 shadow=vec3(.41,.54,.70);
 vec3 white=vec3(.91,.94,.98);
 vec3 sun=vec3(1.,.96,.83);
 vec3 color=mix(shadow,white,clamp(density*.74+.22,0.,1.));
 color=mix(color,sun,highlight*.45);
 color*=.93+.12*wisps;
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export function createHeavenlyCloudscape(THREE,group,{compact=false,reduced=false}={}){
  const floorMat=new THREE.ShaderMaterial({
    vertexShader:floorVertex,fragmentShader:floorFragment,
    uniforms:{uTime:{value:0}},side:THREE.DoubleSide,depthWrite:true,
    fog:false
  });
  // Sin rocas debajo: un mar continuo de nubes iluminadas.
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(520,900,1,1),floorMat);
  floor.rotation.x=-Math.PI/2;
  floor.position.set(0,-10,-145);
  floor.name='Océano de nubes realistas — cielo de la Luz';
  floor.receiveShadow=false;
  group.add(floor);

  const atlas=makeCloudAtlas(THREE,compact);
  const num=compact?85:155;
  const layers=[];
  for(let i=0;i<num;i++){
    const side=i%3===0?0:i%2?1:-1;
    const drift=rand(i,6,1),broad=rand(i,2,7);
    const mat=new THREE.SpriteMaterial({
      map:atlas,color:new THREE.Color().setHSL(.60,.08,.84+.12*broad),
      transparent:true,depthWrite:false,depthTest:true,opacity:.41+.38*drift,
      fog:true
    });
    const sprite=new THREE.Sprite(mat);
    const x=side===0?(drift-.5)*65:side*(18+drift*122);
    const z=50-rand(i,9,4)*405;
    const y=-8.5+rand(i,11,9)*19;
    sprite.position.set(x,y,z);
    const scale=23+rand(i,3,8)*38;
    sprite.scale.set(scale*(1+.55*broad),scale*(.49+.22*drift),1);
    sprite.material.rotation=(rand(i,18,4)-.5)*.38;
    sprite.renderOrder=side===0?0:1;
    group.add(sprite);
    layers.push({sprite,x,y,phase:i*.6});
  }
  const mist=new THREE.HemisphereLight(0xfff8ee,0x93b9dc,.72);
  group.add(mist);
  return time=>{
    floorMat.uniforms.uTime.value=reduced?0:time;
    if(reduced)return;
    for(const part of layers){
      part.sprite.position.x=part.x+Math.sin(time*.095+part.phase)*1.2;
      part.sprite.position.y=part.y+Math.sin(time*.12+part.phase)*.38;
    }
  };
}
