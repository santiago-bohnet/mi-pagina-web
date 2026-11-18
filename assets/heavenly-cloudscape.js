// Volumetría aproximada con estratos de vapor, nubes de ruido fractal
// y luz direccional. Sin circunferencias de sprites ni suelo de piedra.
// Las capas usan InstancedMesh para mantener un número bajo de draw calls.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>x*x*(3-2*x);
const fract=x=>x-Math.floor(x);
const rand=(x,y,s=0)=>fract(Math.sin(x*127.17+y*311.73+s*37.11)*43758.5453);
function noise(x,y,seed=0){
  const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
  return (rand(ix,iy,seed)*(1-fx)+rand(ix+1,iy,seed)*fx)*(1-fy)+
   (rand(ix,iy+1,seed)*(1-fx)+rand(ix+1,iy+1,seed)*fx)*fy;
}
function fbm(x,y,seed=0){
  let a=.56,v=0;
  for(let i=0;i<5;i++){
    v+=a*noise(x,y,seed+i*9);
    x=x*2.08+6.3;y=y*2.08+9.1;a*=.52;
  }
  return v;
}
function cloudAtlas(THREE,compact){
  const n=compact?256:512;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=n;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('No se pudo generar la textura nubosa');
  const img=ctx.createImageData(n,n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const u=(x+.5)/n*2-1, v=(y+.5)/n*2-1;
    const warp=fbm(u*3.4+5,v*3.4+8,11);
    const billow=fbm(u*6+warp*1.6,v*5+warp*.9,17);
    const micro=fbm(u*15+warp*2.9,v*15-warp*2,25);
    const rim=1-Math.pow(Math.abs(u)*.94,1.7)-Math.pow(Math.abs(v)*1.12,1.7);
    const density=rim*.9+(billow-.45)*1.05+(micro-.45)*.30;
    const alpha=clamp((density-.25)*2.0);
    const shade=clamp((billow-.2)*1.45)*.68+clamp((micro-.2)*1.3)*.32;
    const light=clamp(.65+shade*.35);
    const k=(y*n+x)*4;
    img.data[k]=Math.round(245*light);
    img.data[k+1]=Math.round(248*light);
    img.data[k+2]=Math.round(255*light);
    img.data[k+3]=Math.round(Math.pow(alpha,1.34)*225);
  }
  ctx.putImageData(img,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.LinearFilter;
  texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;
  return texture;
}
const vertexShader=`
 varying vec3 vWorld;
 void main(){
   vec4 world=modelMatrix*vec4(position,1.);
   vWorld=world.xyz;
   gl_Position=projectionMatrix*viewMatrix*world;
 }`;
const fragmentShader=`
 precision highp float;
 uniform float uTime;
 varying vec3 vWorld;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){
   vec2 i=floor(p),f=fract(p);
   f=f*f*(3.-2.*f);
   return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
     mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
 }
 float fbm(vec2 p){
   float v=0.,a=.55;
   for(int i=0;i<5;i++){v+=noise(p)*a;p=p*2.08+vec2(11.3,8.5);a*=.53;}
   return v;
 }
 float field(vec2 p){
   float warp=fbm(p*.61+vec2(7.2,-1.4));
   return fbm(p*2.3+warp*2.2)*.68+fbm(p*.47)*.4+
      fbm(p*6.3-warp*.8)*.1;
 }
 void main(){
   vec2 p=vWorld.xz*.020+vec2(uTime*.0007,uTime*.0002);
   // Integración de siete estratos: densidad y autosombreado.
   float coverage=0.,shading=0.;
   for(int k=0;k<7;k++){
     float d=float(k)/6.;
     float density=smoothstep(.31,.71,field(p+vec2(d*.22,-d*.1))-d*.045);
     float shadow=field(p+vec2(.17+d*.26,-.24-d*.16));
     float optical=density*(1.-coverage)*(.36-d*.032);
     shading+=optical*(.75+.36*(density-shadow));
     coverage+=optical;
   }
   vec3 shade=vec3(.45,.56,.72);
   vec3 white=vec3(.89,.93,.97);
   vec3 sun=vec3(1.,.94,.80);
   float wisps=field(p*1.55+vec2(13.6,3.1));
   float bright=clamp(shading*2.35+wisps*.2,.0,1.);
   vec3 color=mix(shade,white,bright);
   color=mix(color,sun,pow(clamp(wisps,0.,1.),4.)*.16);
   // Franja de niebla lejana integrada al manto.
   color=mix(color,vec3(.75,.83,.92),.12);
   gl_FragColor=vec4(color,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
 }`;
function strata(THREE,group,atlas,{compact=false,reduced=false}={}){
  const geo=new THREE.PlaneGeometry(1,1);
  geo.rotateX(-Math.PI/2);
  const mat=new THREE.MeshBasicMaterial({
    map:atlas,color:0xe5eef8,transparent:true,opacity:.73,
    depthWrite:false,side:THREE.DoubleSide,fog:true
  });
  const layerCounts=compact?[80,32,20]:[175,65,40];
  const objects=[];
  const transform=new THREE.Object3D();
  for(let band=0;band<layerCounts.length;band++){
    const count=layerCounts[band];
    const mesh=new THREE.InstancedMesh(geo,mat,count);
    mesh.name=['Cumulonimbos cercanos','Bancos de vapor','Neblina elevada'][band];
    mesh.frustumCulled=false;
    mesh.renderOrder=band;
    for(let i=0;i<count;i++){
      const id=i+band*300;
      const side=id%3===0?0:id%2?1:-1;
      const sx=23+rand(id,5,band)*39;
      const x=side===0?(rand(id,2,7)-.5)*110:side*(23+rand(id,4,3)*165);
      const z=70-rand(id,19,4)*490;
      const y=-8.4+band*4.5+rand(id,6,11)*(band?12:5);
      transform.position.set(x,y,z);
      transform.rotation.set(0,rand(id,7,4)*6.28,0);
      transform.scale.set(sx*(.9+band*.35),sx*(.8+rand(id,3,9)*.55),1);
      transform.scale.z=1;
      // The geometry lies horizontally, local Y controls width in world Z.
      transform.scale.set(sx,1,sx*.62);
      transform.updateMatrix();
      mesh.setMatrixAt(i,transform.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;
    group.add(mesh);
    objects.push(mesh);
  }
  return t=>{
    if(reduced)return;
    for(let i=0;i<objects.length;i++){
      objects[i].position.x=Math.sin(t*.02+i*3.7)*(i+1)*.12;
    }
  };
}
export function createHeavenlyCloudscape(THREE,group,{compact=false,reduced=false}={}){
  const uniforms={uTime:{value:0}};
  const mat=new THREE.ShaderMaterial({
    vertexShader,fragmentShader,uniforms,
    side:THREE.DoubleSide,depthWrite:true,fog:false
  });
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(580,950),mat);
  floor.rotation.x=-Math.PI/2;
  floor.position.set(0,-10,-155);
  floor.name='Mar de nubes multicapa — infinito a la vista';
  group.add(floor);
  const atlas=cloudAtlas(THREE,compact);
  const advance=strata(THREE,group,atlas,{compact,reduced});
  const lighting=new THREE.HemisphereLight(0xfff8f0,0x91b7d4,.48);
  group.add(lighting);
  return t=>{
    uniforms.uTime.value=reduced?0:t;
    advance(t);
  };
}
