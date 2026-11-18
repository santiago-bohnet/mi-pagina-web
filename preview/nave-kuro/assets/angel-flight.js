// Ángeles de bajo número de draw calls: túnica con pliegues, rostro,
// pelo, alas con plumas curvas y movimiento articulado. Sin texturas externas.
const rnd=n=>{const x=Math.sin(n*79.1)*43758.545;return x-Math.floor(x);};
function makeFeather(THREE){
  const verts=[],uv=[],indices=[];
  const steps=8;
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    const len=t*2.1;
    const width=Math.pow(Math.sin(Math.PI*t),.75)*(.30-t*.10)+.006;
    const bend=t*t*.42;
    verts.push(-width,len,-bend,width,len,-bend);
    uv.push(0,t,1,t);
    if(i<steps){
      const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function featherFan(THREE,root,feather,mat,side,compact){
  const count=compact?19:31;
  const mesh=new THREE.InstancedMesh(feather,mat,count);
  const obj=new THREE.Object3D();
  for(let i=0;i<count;i++){
    const t=i/(count-1);
    const layer=i%3;
    const band=Math.floor(i/3)/Math.ceil(count/3);
    obj.position.set(side*(.1+t*2.6),.35-t*.25,layer*.035-.16);
    obj.rotation.set(-.10,0,-side*(.30+t*.8));
    obj.scale.set((.64+.18*band)*(layer===0?.92:1),.67+Math.sin(Math.PI*t)*.37,.85);
    obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
  mesh.frustumCulled=false;
  root.add(mesh);
}
function createAngel(THREE,feather,materials,compact,i){
  const angel=new THREE.Group();
  angel.name='Ángel celestial '+(i+1);
  const body=new THREE.Group();
  angel.add(body);
  const tunic=new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(.33,-1.85),new THREE.Vector2(.66,-1.65),
    new THREE.Vector2(.74,-1.48),new THREE.Vector2(.61,-1.26),
    new THREE.Vector2(.45,-.65),new THREE.Vector2(.29,.14),
    new THREE.Vector2(.38,.65),new THREE.Vector2(.36,.88)
  ],compact?12:20),materials.robe);
  // LatheGeometry rotates around Y; create a sculpted dress with vertical folds.
  body.add(tunic);
  const folds=new THREE.Mesh(new THREE.CylinderGeometry(.44,.72,2.1,compact?12:24,3),materials.folds);
  folds.position.y=-.68;body.add(folds);
  const put=(geo,mat,x,y,z)=>{
    const m=new THREE.Mesh(geo,mat);
    m.position.set(x,y,z);body.add(m);return m;
  };
  put(new THREE.SphereGeometry(.42,compact?12:20,12),materials.skin,0,1.25,.05)
    .scale.set(1,.92,.87);
  const hair=put(new THREE.SphereGeometry(.45,16,12),materials.hair,0,1.49,-.08);
  hair.scale.set(1,.43,1.05);
  const nose=put(new THREE.ConeGeometry(.065,.15,6),materials.skin,0,1.22,.46);
  nose.rotation.x=Math.PI*.52;
  for(const side of [-1,1]){
    const sleeve=put(new THREE.CylinderGeometry(.15,.29,1.05,9),materials.robe,side*.57,.26,0);
    sleeve.rotation.z=side*.32;
    put(new THREE.SphereGeometry(.12,10,8),materials.skin,side*.78,-.22,.1);
    const eye=put(new THREE.SphereGeometry(.034,8,6),materials.eyes,side*.16,1.29,.40);
    eye.scale.set(1,.7,.35);
  }
  const halo=put(new THREE.TorusGeometry(.57,.049,8,28),materials.halo,0,2.03,-.05);
  halo.rotation.x=Math.PI/2;
  const wings=[];
  for(const side of [-1,1]){
    const wing=new THREE.Group();
    wing.position.set(side*.42,.57,-.34);
    wing.rotation.y=-side*.1;
    featherFan(THREE,wing,feather,materials.feathers,side,compact);
    body.add(wing);wings.push({wing,side});
  }
  angel.userData.body=body;
  angel.userData.wings=wings;
  return angel;
}
export function createAngelFlock(THREE,group,{compact=false,reduced=false}={}){
  const materials={
    robe:new THREE.MeshStandardMaterial({color:0xf4efe0,roughness:.91,metalness:0,side:THREE.DoubleSide}),
    folds:new THREE.MeshStandardMaterial({color:0xe5dac5,roughness:.96,transparent:true,opacity:.95}),
    skin:new THREE.MeshStandardMaterial({color:0xf1cdaa,roughness:.85}),
    hair:new THREE.MeshStandardMaterial({color:0xbaa37f,roughness:.9}),
    eyes:new THREE.MeshStandardMaterial({color:0x665246,roughness:.65}),
    feathers:new THREE.MeshStandardMaterial({
      color:0xf6f4ec,roughness:.88,
      emissive:0xc4d2e2,emissiveIntensity:.075,side:THREE.DoubleSide
    }),
    halo:new THREE.MeshBasicMaterial({color:0xffdd8a})
  };
  const feather=makeFeather(THREE);
  const n=compact?10:19;
  const flock=[];
  for(let i=0;i<n;i++){
    const side=i%2?1:-1;
    const angel=createAngel(THREE,feather,materials,compact,i);
    const x=side*(25+rnd(i+3)*45);
    const y=9+rnd(i+17)*17;
    const z=42-i*(compact?35:19);
    // No invadir plataforma ni ocultar a Kuro frente al portal.
    if(z>-148&&z<-75&&x<0&&x>-60)continue;
    angel.position.set(x,y,z);
    angel.rotation.y=side*-.12;
    const size=.8+rnd(i+29)*.65;
    angel.scale.setScalar(size);
    group.add(angel);
    flock.push({angel,baseY:y,i});
  }
  return time=>{
    if(reduced)return;
    for(const item of flock){
      const {angel,i,baseY}=item;
      angel.position.y=baseY+Math.sin(time*.45+i*.72)*.67;
      angel.userData.wings.forEach(({wing,side})=>{
        wing.rotation.z=side*(.08+Math.sin(time*1.05+i*.55)*.15);
      });
      angel.userData.body.rotation.y=Math.sin(time*.2+i)*.05;
    }
  };
}
