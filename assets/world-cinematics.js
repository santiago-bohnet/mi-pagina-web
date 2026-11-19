import { surfaceHeight } from './realistic-environments.js?v=realms-16';
import { calderaGeometry } from './realm-models.js?v=realm-models-1';
// XR cinematic world pass — shared scenery infrastructure.
// Procedural geometry + physically based materials, seeded and batched.
// Entirely deterministic: re-entering a dimension never changes its landmarks.
const fract=x=>x-Math.floor(x);
const rng=(i,seed=1)=>fract(Math.sin(i*127.13+seed*93.71)*43758.545);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const palette=[
  {rock:0xd3d8d6,glow:0xffe7a6,low:0x9db9d6},
  {rock:0x241719,glow:0xff4f19,low:0x2b111c},
  {rock:0x201c2a,glow:0xa679ff,low:0x0e111c},
  {rock:0x101d31,glow:0x4ce9db,low:0x090f28}
];
function put(THREE,group,geometry,material,x,y,z,s=1){
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  mesh.scale.setScalar(s);
  group.add(mesh);
  return mesh;
}
function instances(THREE,group,geometry,material,items,shadow=false){
  if(!items.length)return null;
  const mesh=new THREE.InstancedMesh(geometry,material,items.length);
  const transform=new THREE.Object3D();
  items.forEach((p,i)=>{
    transform.position.set(p.x,p.y,p.z);
    transform.rotation.set(p.rx||0,p.ry||0,p.rz||0);
    transform.scale.set(p.sx||1,p.sy||1,p.sz||1);
    transform.updateMatrix();
    mesh.setMatrixAt(i,transform.matrix);
  });
  mesh.instanceMatrix.needsUpdate=true;
  mesh.castShadow=shadow;
  mesh.receiveShadow=true;
  mesh.frustumCulled=false;
  group.add(mesh);
  return mesh;
}
const rockyGeometry=THREE=>{
  const geometry=new THREE.IcosahedronGeometry(1,2);
  const pos=geometry.getAttribute('position');
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    const rough=.80+.19*Math.sin(x*13+y*19+z*11)+.085*Math.sin(x*51-y*24+z*36);
    pos.setXYZ(i,x*rough,y*rough,z*rough);
  }
  geometry.computeVertexNormals();
  return geometry;
};
function portalExclusion(x,z,level){
  const side=level%2===0?-1:1;
  // Ruta libre y espacio junto a plataforma, Kuro y portal.
  return (Math.abs(x)<15 && z>-295&&z<75) ||
    (Math.abs(z+112)<45 && Math.abs(x-side*20)<31);
}
function addAmbientParticles(THREE,group,level,compact,reduced){
  const count=compact?260:850;
  const points=new Float32Array(count*3);
  const colors=new Float32Array(count*3);
  const color=new THREE.Color();
  const cold=new THREE.Color(level===0?0xfffae1:level===1?0xff642d:level===2?0x9b84e9:0x65f1ea);
  for(let i=0;i<count;i++){
    const x=(rng(i,111)-.5)*360,y=3+rng(i,42)*94,z=65-rng(i,5)*400;
    points.set([x,y,z],3*i);
    color.copy(cold).multiplyScalar(.52+rng(i,13)*.48);
    colors.set([color.r,color.g,color.b],3*i);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const mat=new THREE.PointsMaterial({
    vertexColors:true,size:level===1?.5:level===3?.8:.34,
    sizeAttenuation:true,transparent:true,opacity:level===1?.83:.65,
    depthWrite:false,blending:level===1?THREE.AdditiveBlending:THREE.NormalBlending
  });
  const spark=new THREE.Points(geometry,mat);
  group.add(spark);
  return t=>{
    if(reduced)return;
    spark.position.y=Math.sin(t*.17)*.9;
    spark.position.z=(t*.8)%9;
  };
}
function makeCloudCitadels(THREE,group,compact,updates){
  const marble=new THREE.MeshStandardMaterial({
    color:0xbec5c8,roughness:.87,metalness:.03
  });
  const quartz=new THREE.MeshPhysicalMaterial({
    color:0xf9efdc,roughness:.22,metalness:.15,clearcoat:.44
  });
  const gold=new THREE.MeshStandardMaterial({
    color:0xc5a96f,metalness:.75,roughness:.25
  });
  const items=[],capitals=[],struts=[],pedestals=[];
  for(let i=0;i<(compact?15:29);i++){
    const side=i%2?-1:1;
    const x=side*(44+rng(i,1)*64);
    const z=35-i*(compact?23:12)-rng(i,12)*7;
    if(portalExclusion(x,z,0))continue;
    const scale=.7+rng(i,14)*1.05;
    const h=18*scale;
    const base=-7.0;
    items.push({x,y:base+h*.5,z,sx:1.4*scale,sy:h,sz:1.4*scale});
    capitals.push({x,y:base+h+.35,z,sx:3.5*scale,sy:.68*scale,sz:3.5*scale});
    pedestals.push({x,y:base-.45,z,sx:3.7*scale,sy:.9,sz:3.7*scale});
    if(i%3===0)struts.push({x:x+side*5,y:base+h*.42,z,sx:.8,sy:h*.84,sz:.8});
  }
  // Cada columna nace de un pedestal apoyado sobre las nubes, no del vacío.
  instances(THREE,group,new THREE.CylinderGeometry(1,1,1,16),marble,pedestals);
  instances(THREE,group,new THREE.CylinderGeometry(.72,.9,1,16,2),marble,items);
  instances(THREE,group,new THREE.BoxGeometry(1,1,1),quartz,capitals);
  instances(THREE,group,new THREE.CylinderGeometry(.8,1,1,12),gold,struts);
  const floorMat=new THREE.MeshStandardMaterial({color:0xe8f1ef,roughness:.88,transparent:true,opacity:.92});
  // Large floating islands remain far away from the navigable sky lane.
  const islands=[];
  for(let i=0;i<(compact?7:14);i++){
    const side=i%2?1:-1;
    const x=side*(65+rng(i,51)*95),z=32-i*27;
    islands.push({x,y:-7-rng(i,2)*7,z,sx:18+rng(i,3)*14,sy:2+rng(i,4)*5,sz:13+rng(i,5)*17});
  }
  instances(THREE,group,new THREE.IcosahedronGeometry(1,2),floorMat,islands);
}
function makeInferno(THREE,group,compact,updates){
  const basalt=new THREE.MeshStandardMaterial({
    color:0x34272a,roughness:.94,metalness:.08,
    flatShading:true
  });
  const ash=new THREE.MeshStandardMaterial({color:0x2e2225,roughness:1,flatShading:true});
  const luminous=new THREE.MeshBasicMaterial({color:0xff4f13});
  const chunks=[],ridges=[],glowing=[];
  for(let i=0;i<(compact?130:280);i++){
    const side=i%2?-1:1,x=side*(22+rng(i,10)*161),z=45-rng(i,2)*430;
    if(portalExclusion(x,z,1))continue;
    const s=1+rng(i,3)*5;
    chunks.push({x,y:-8,z,sx:s*(.8+rng(i,6)),sy:s*(.45+rng(i,4)),sz:s*(.7+rng(i,7)),ry:rng(i,8)*Math.PI*2});
    if(i%4===0)ridges.push({x,y:-4,z,sx:s*.65,sy:s*(2+rng(i,4)*3),sz:s*.65});
    if(i%9===0)glowing.push({x,y:-5,z,sx:s*.14,sy:.14,sz:s*.8,ry:rng(i,10)*6});
  }
  const rugged=rockyGeometry(THREE);
  instances(THREE,group,rugged,basalt,chunks);
  instances(THREE,group,new THREE.ConeGeometry(1,3,9),ash,ridges);
  instances(THREE,group,new THREE.BoxGeometry(1,.1,1),luminous,glowing);
  const flank = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.96 });
  const heightAt = (x,z) => surfaceHeight(1,x,z);
  for (let i=0;i<(compact?2:3);i++){
    const x=(i%2?1:-1)*(112+rng(i,19)*28),z=7-i*80;
    const height=30+rng(i,4)*27;
    put(THREE,group,calderaGeometry(THREE,x,z,35,height,heightAt,compact),flank,x,0,z);
    const lava=put(THREE,group,new THREE.CircleGeometry(7.5,32),luminous,
      x,heightAt(x,z)+height*.875,z);
    lava.rotation.x=-Math.PI/2;
  }
  const light=new THREE.PointLight(0xff461e,compact?180:350,110);
  light.position.set(42,13,-102);group.add(light);
  updates.push(t=>{if(!compact)light.intensity=270+Math.sin(t*1.7)*48;});
}
function makeShadow(THREE,group,compact,updates){
  const slate=new THREE.MeshStandardMaterial({color:0x1b2030,roughness:.91,metalness:.12});
  const weathered=new THREE.MeshStandardMaterial({color:0x464156,roughness:.92});
  const glow=new THREE.MeshStandardMaterial({color:0x6f55ae,emissive:0x6c33a1,emissiveIntensity:1.6,metalness:.42,roughness:.3});
  const pillars=[],fallen=[],crystals=[];
  for(let i=0;i<(compact?60:130);i++){
    const side=i%2?1:-1,x=side*(24+rng(i,2)*110),z=45-rng(i,3)*406;
    if(portalExclusion(x,z,2))continue;
    const h=3+rng(i,4)*13;
    if(i%3===0){
      pillars.push({x,y:-5+h*.5,z,sx:.9+rng(i,7),sy:h,sz:.9+rng(i,9),ry:rng(i,10)*6});
    }else{
      fallen.push({x,y:-7,z,sx:3+rng(i,14)*8,sy:1+rng(i,21)*3,sz:2+rng(i,17)*5,ry:rng(i,16)*6});
    }
    if(i%2===0)crystals.push({x:x+2,y:-5,z:z-2,sx:.6+rng(i,18)*1.4,sy:2+rng(i,19)*7,sz:.6+rng(i,10)});
  }
  instances(THREE,group,new THREE.BoxGeometry(1,1,1),slate,pillars);
  instances(THREE,group,rockyGeometry(THREE),weathered,fallen);
  const gem=instances(THREE,group,new THREE.OctahedronGeometry(1,1),glow,crystals);
  const haze=new THREE.PointLight(0x7f41ed,130,110);
  haze.position.set(-31,8,-150);group.add(haze);
  updates.push(t=>{if(gem)gem.rotation.y=Math.sin(t*.07)*.015; haze.intensity=110+Math.sin(t*.5)*20;});
}
function makeCosmos(THREE,group,compact,updates){
  // Layered nebula: gas noise in a camera-surrounding cylinder, not colored balls.
  const nebula=new THREE.Mesh(new THREE.SphereGeometry(310,32,20),
    new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0}},
      vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`
        uniform float uTime;varying vec3 vP;
        float h(vec3 p){return fract(sin(dot(p,vec3(12.989,78.23,37.719)))*43758.545);}
        float n(vec3 p){
          vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          float a=h(i),b=h(i+vec3(1.,0.,0.)),c=h(i+vec3(0.,1.,0.)),d=h(i+vec3(1.,1.,0.));
          float e=h(i+vec3(0.,0.,1.)),g=h(i+vec3(1.,0.,1.)),j=h(i+vec3(0.,1.,1.)),k=h(i+vec3(1.,1.,1.));
          return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),
            mix(mix(e,g,f.x),mix(j,k,f.x),f.y),f.z);
        }
        float cloud(vec3 p){
          float s=0.,a=.55;
          for(int i=0;i<5;i++){s+=n(p)*a;p=p*2.1+vec3(5.2,12.1,8.7);a*=.52;}return s;
        }
        void main(){
          vec3 dir=normalize(vP);
          vec3 p=dir*4.7+vec3(0.,uTime*.001,0.);
          float w=cloud(p*.47);
          float d=cloud(p+vec3(w*2.,0.,w*.9));
          float t=smoothstep(.43,.79,d*.7+w*.5);
          vec3 col=mix(vec3(.003,.009,.028),vec3(.029,.14,.23),t);
          col+=vec3(.095,.035,.14)*pow(t,2.3);
          gl_FragColor=vec4(col,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      side:THREE.BackSide,depthWrite:false,fog:false
    }));
  nebula.position.set(0,25,-110);
  group.add(nebula);
  updates.push(t=>{nebula.material.uniforms.uTime.value=t;});
  const ringMat=new THREE.MeshStandardMaterial({color:0x8bb5c2,metalness:.4,roughness:.78});
  const rockMat=new THREE.MeshStandardMaterial({color:0x343c4d,roughness:.92,metalness:.17});
  const asteroids=[];
  for(let i=0;i<(compact?115:260);i++){
    const x=(rng(i,21)-.5)*340,y=(rng(i,9)-.5)*112,z=55-rng(i,27)*415;
    if(portalExclusion(x,z,3))continue;
    const s=.45+rng(i,15)*3.6;
    asteroids.push({x,y,z,sx:s,sy:s*(.7+rng(i,4)),sz:s,ry:rng(i,14)*6});
  }
  instances(THREE,group,rockyGeometry(THREE),rockMat,asteroids);
  const planets=[];
  const planetColors=[0x547d9b,0x98736a,0x496b82,0x8d7596,0x749194];
  for(let i=0;i<(compact?7:12);i++){
    const side=i%2?1:-1;
    const radius=5+rng(i,44)*12;
    const x=side*(53+rng(i,23)*108),y=9+rng(i,28)*58,z=42-i*31;
    const mat=new THREE.MeshStandardMaterial({
      color:planetColors[i%planetColors.length],metalness:.12,roughness:.94,
      emissive:planetColors[i%planetColors.length],emissiveIntensity:.055
    });
    const body=put(THREE,group,new THREE.SphereGeometry(radius,28,20),mat,x,y,z);
    const atmosphere=put(THREE,group,new THREE.SphereGeometry(radius*1.08,24,16),
      new THREE.MeshBasicMaterial({
        color:0x78b3cd,transparent:true,opacity:.08,
        depthWrite:false,side:THREE.BackSide
      }),x,y,z);
    planets.push({body,atmosphere,i});
    if(i%3===0){
      const rings=put(THREE,group,
        new THREE.RingGeometry(radius*1.27,radius*1.8,96),
        new THREE.MeshStandardMaterial({
          color:ringMat.color,side:THREE.DoubleSide,
          transparent:true,opacity:.56,depthWrite:false
        }),x,y,z);
      rings.rotation.x=1.03;rings.rotation.y=.38;
    }
  }
  updates.push(t=>{for(const p of planets){p.body.rotation.y=t*(.014+p.i*.003);}});
}
export function addCinematicWorldDetails(THREE,group,level,{compact=false,reduced=false}={}){
  const updates=[addAmbientParticles(THREE,group,level,compact,reduced)];
  if(level===0)makeCloudCitadels(THREE,group,compact,updates);
  if(level===1)makeInferno(THREE,group,compact,updates);
  if(level===2)makeShadow(THREE,group,compact,updates);
  if(level===3)makeCosmos(THREE,group,compact,updates);
  return t=>{for(const fn of updates)fn(t);};
}
