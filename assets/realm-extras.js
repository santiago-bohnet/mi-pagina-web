import { chainGeometry, fracturedRock, createMeteorTail, createDragonKit,
  createScoutKit, createTreeGeometry } from './realm-models.js?v=realm-models-1';
import { surfaceHeight } from './realistic-environments.js?v=realms-16';

// Landmarks del universo XR. Geometría procedural reutilizable, comportamiento
// determinista, zonas de vuelo y plataformas protegidas. Escenas con Three.js.
const rand=(n,s=1)=>{const v=Math.sin(n*123.37+s*76.9)*43758.5453;return v-Math.floor(v)};
const m=(T,g,geo,mat,x,y,z)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);g.add(o);return o};
const color=(T,hex,opt={})=>new T.MeshStandardMaterial({color:hex,roughness:.76,...opt});
function palace(T,parent,x,z,scale=1,ruined=false){
  const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
  const stone=color(T,ruined?0x49404f:0xe5dfd0,{metalness:.08});
  const gold=color(T,ruined?0x292334:0xd6ad6b,{metalness:.58,roughness:.33});
  const base=m(T,g,new T.BoxGeometry(34,3,29),stone,0,-5,0);
  const main=m(T,g,new T.BoxGeometry(22,16,19),stone,0,4,0);
  for(let i=0;i<4;i++){
    const xx=-13+i*8.5;
    m(T,g,new T.CylinderGeometry(.9,1,19,10),stone,xx,4,12);
    m(T,g,new T.CylinderGeometry(1.7,1.7,.7,12),gold,xx,13.8,12);
  }
  for(const side of [-1,1]){
    const tower=m(T,g,new T.CylinderGeometry(4.4,5,31,12),stone,side*14,9,-8);
    const roof=m(T,g,new T.ConeGeometry(5.5,13,12),gold,side*14,30,-8);
    if(ruined){roof.rotation.z=side*.32;tower.scale.y=.78;}
  }
  m(T,g,new T.ConeGeometry(13,17,4),gold,0,22,-3).rotation.y=Math.PI/4;
  const stairs=[];for(let i=0;i<9;i++){
    const step=m(T,g,new T.BoxGeometry(12,1.3,3),stone,0,-3.8+i*.85,15+i*2.5);
    stairs.push(step);
  }
  return g;
}
function gardens(T,parent,compact){
  const green=color(T,0x478b6b),bloom=[
    color(T,0xf8adbc),color(T,0xe1cc7f),color(T,0x9fc7eb)
  ];
  const islandStone=color(T,0xbec3bb);
  for(let i=0;i<(compact?5:10);i++){
    const side=i%2?1:-1;
    const x=side*(79+rand(i,4)*40),z=27-i*40;
    const g=new T.Group();g.position.set(x,12+rand(i,5)*8,z);parent.add(g);
    const islandGeo=new T.IcosahedronGeometry(1,3);
    const vertex=islandGeo.getAttribute('position');
    for(let v=0;v<vertex.count;v++){
      const x=vertex.getX(v),y=vertex.getY(v),z=vertex.getZ(v);
      const irregular=.85+.15*Math.sin(x*14+z*9+i)+.1*Math.cos(z*12-y*13+i);
      vertex.setXYZ(v,x*irregular,y*irregular,z*irregular);
    }
    islandGeo.computeVertexNormals();
    const rock=m(T,g,islandGeo,islandStone,0,-5,0);
    rock.scale.set(19,6.5,15);
    const canopy=m(T,g,islandGeo,green,0,.25,0);
    canopy.scale.set(18.4,2.05,14.6);
    for(let j=0;j<(compact?10:23);j++){
      const theta=rand(i*61+j,10)*Math.PI*2,r=3+rand(i*61+j,11)*12;
      const xx=Math.cos(theta)*r,zz=Math.sin(theta)*r;
      m(T,g,new T.CylinderGeometry(.15,.22,1,5),green,xx,1,zz);
      const flower=m(T,g,new T.IcosahedronGeometry(.38+rand(j,3)*.5,1),bloom[j%3],xx,1.8,zz);
    }
  }
}
function waterfalls(T,parent,compact,reduced,updates){
  const white=new T.MeshBasicMaterial({color:0xd4f0ff,transparent:true,opacity:.48,side:T.DoubleSide,depthWrite:false});
  const blue=new T.MeshBasicMaterial({color:0x9ccfff,transparent:true,opacity:.34,side:T.DoubleSide,depthWrite:false});
  const ribbons=[];
  for(let i=0;i<(compact?4:8);i++){
    const side=i%2?-1:1;
    // La cascada nace justo debajo de la isla del jardín correspondiente.
    const x=side*(79+rand(i,4)*40),z=27-i*40;
    for(let j=0;j<3;j++){
      const geo=new T.PlaneGeometry(3.5+j,55,8,23);
      const pos=geo.getAttribute('position');
      for(let k=0;k<pos.count;k++){
        const y=pos.getY(k);
        pos.setZ(k,Math.sin((y+j*6)*.26)*1.2);
      }
      geo.computeVertexNormals();
      const w=m(T,parent,geo,j%2?blue:white,x+j*1.3,-16,z);
      w.userData.phase=i+j;ribbons.push(w);
    }
  }
  updates.push(t=>{if(!reduced)for(const w of ribbons){w.position.z+=Math.sin(t*.9+w.userData.phase)*.003;}});
}
function sunshafts(T,parent,reduced,updates){
  const mat=new T.MeshBasicMaterial({color:0xfff3cd,transparent:true,opacity:.043,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
  const group=new T.Group();parent.add(group);
  for(let i=0;i<16;i++){
    const x=-130+i*17.8,z=-180+rand(i,8)*150;
    const beam=m(T,group,new T.ConeGeometry(7+rand(i,3)*3,110,18,1,true),mat,x,49,z);
    beam.rotation.z=-.27;
  }
  updates.push(t=>{if(!reduced)mat.opacity=.035+.012*Math.sin(t*.3);});
}
function heavenlyCreatures(T,parent,compact,reduced,updates){
  const feather=color(T,0xf2ecde),gold=color(T,0xd7c7a1,{metalness:.4});
  const creatures=[];
  for(let i=0;i<(compact?4:10);i++){
    const g=new T.Group();parent.add(g);g.name='Ave celestial';
    const a=i*.63;
    const body=m(T,g,new T.IcosahedronGeometry(1.1,1),feather,0,0,0);
    body.scale.set(1,.55,2.25);
    const wings=[];
    for(const s of [-1,1]){
      const wing=new T.Group();wing.position.x=s*.8;g.add(wing);
      const shape=m(T,wing,new T.ConeGeometry(.65,5.8,3),feather,s*2.0,0,.1);
      shape.rotation.z=s*Math.PI/2;
      wings.push({wing,s});
    }
    const crest=m(T,g,new T.ConeGeometry(.45,1.3,8),gold,0,.76,.3);
    g.userData={base:70-i*39,phase:i*1.9,wings};
    creatures.push(g);
  }
  updates.push(t=>{
    for(const g of creatures){
      const {base,phase,wings}=g.userData;
      g.position.set((Math.sin(t*.05+phase)*25)+(phase%2?30:-30),
        25+Math.sin(t*.45+phase)*5,base+Math.cos(t*.12+phase)*18);
      if(!reduced)for(const {wing,s} of wings)wing.rotation.z=s*Math.sin(t*2.2+phase)*.27;
    }
  });
}
function lightning(T,parent,reduced,updates){
  const strikes=[];
  const mat=new T.LineBasicMaterial({color:0xff7548,transparent:true,opacity:0,depthWrite:false});
  for(let i=0;i<7;i++){
    const coords=[];let x=(i%2?1:-1)*(45+rand(i,3)*110),z=12-i*44;
    for(let k=0;k<14;k++){x+=(rand(i*31+k,2)-.5)*10;coords.push(new T.Vector3(x,93-k*8,z));}
    const geo=new T.BufferGeometry().setFromPoints(coords);
    const bolt=new T.Line(geo,mat.clone());parent.add(bolt);strikes.push(bolt);
  }
  updates.push(t=>{
    strikes.forEach((bolt,i)=>{
      const event=(Math.floor(t*.9+i*2.31)%31===0);
      bolt.material.opacity=reduced?0:event?(.62+.2*Math.sin(t*43+i)):0;
    });
  });
}
function infernalFortresses(T,parent,compact){
  const iron=color(T,0x26161a,{metalness:.27}),ember=color(T,0x71301b,{emissive:0x47110a,emissiveIntensity:.5});
  for(let i=0;i<(compact?3:6);i++){
    const side=i%2?1:-1;const z=15-i*65,x=side*(105+rand(i,5)*25);
    palace(T,parent,x,z,.83+rand(i,3)*.6,true);
    for(let j=0;j<4;j++){
      const xx=x+(j-1.5)*6;
      const tower=m(T,parent,new T.CylinderGeometry(2,3,25,8),iron,xx,18,z-13);
      m(T,parent,new T.ConeGeometry(3,5,8),ember,xx,33,z-13);
    }
  }
  const metal = color(T, 0x554049, { metalness: .7, roughness: .57 });
  const link = chainGeometry(T);
  const along = new T.Vector3(0,1,0), tangent = new T.Vector3();
  const anchorGeometry = new T.CylinderGeometry(2.45, 3.2, 1, 10);
  const matrix = new T.Object3D();
  const tilt = new T.Quaternion();
  const count = compact ? 2 : 3;
  const links = new T.InstancedMesh(link, metal, count * 59);
  for (let chain = 0; chain < count; chain++) {
    const z = 10 - chain * 118;
    for (const x of [-81,81]) {
      const bottom = surfaceHeight(1,x,z) - 1;
      const anchor = m(T,parent,anchorGeometry,iron,x,(35 + bottom) / 2,z);
      anchor.scale.y = 35 - bottom;
    }
    for (let i = 0; i < 59; i++) {
      const t = i / 58;
      matrix.position.set(-81 + t * 162, 34 - 16 * Math.sin(t * Math.PI), z);
      tangent.set(162,-16 * Math.PI * Math.cos(t * Math.PI),0).normalize();
      tilt.setFromAxisAngle(along,(i % 2 ? Math.PI / 2 : 0) + .08 * Math.sin(i * 13));
      matrix.quaternion.setFromUnitVectors(along,tangent).multiply(tilt);
      matrix.updateMatrix();
      links.setMatrixAt(chain * 59 + i,matrix.matrix);
    }
  }
  links.instanceMatrix.needsUpdate = true;
  links.name = 'Cadenas forjadas entre anclajes de basalto';
  parent.add(links);
}
function infernalCreatures(T,parent,compact,reduced,updates){
  const skin=color(T,0x372028,{metalness:.15}),eye=new T.MeshBasicMaterial({color:0xf43c16});
  const dragons=[];
  const buildDragon = createDragonKit(T,skin,eye);
  for(let i=0;i<(compact?2:5);i++){
    const g=new T.Group();parent.add(g);g.name='Dragón infernal';
    const wings = buildDragon(g);
    g.scale.setScalar(.85 + rand(i,3) * .75);
    dragons.push({ g, wings, phase: i * 1.7 });
  }
  updates.push(t=>{
    const time = reduced ? 0 : t;
    for(const { g, wings, phase } of dragons){
      const orbit = time * .12 + phase;
      g.position.set(Math.sin(orbit)*64, 32+Math.sin(time*.7+phase)*5,
        -48-phase*57+Math.cos(orbit)*36);
      g.rotation.y = Math.atan2(64 * Math.cos(orbit), -36 * Math.sin(orbit));
      g.rotation.z = .12 * Math.sin(orbit);
      for (const { wing, side } of wings) {
        wing.rotation.z = side * (.14 + .5 * Math.sin(time * 2.2 + phase));
        wing.rotation.y = side * .19 * Math.cos(time * 2.2 + phase);
      }
    }
  });
  const demons=[];
  for(let i=0;i<(compact?9:22);i++){
    const g=new T.Group();g.name='Criatura infernal';parent.add(g);
    m(T,g,new T.ConeGeometry(.7,2.6,7),skin,0,1.1,0);
    for(const s of [-1,1])m(T,g,new T.ConeGeometry(.18,.9,6),skin,s*.45,2.65,0);
    m(T,g,new T.SphereGeometry(.15,7,6),eye,-.2,2.0,.66);
    m(T,g,new T.SphereGeometry(.15,7,6),eye,.2,2.0,.66);
    const side=i%2?1:-1;
    g.position.set(side*(33+rand(i,4)*70),-8,25-i*20);
    g.userData={baseX:g.position.x,phase:i};
    demons.push(g);
  }
  updates.push(t=>{
    if(reduced)return;
    for(const creature of demons)creature.position.x=creature.userData.baseX+
      Math.sin(t*.65+creature.userData.phase)*2.3;
  });
}
function meteors(T,parent,compact,reduced,updates){
  const stone = color(T,0x4b3537,{emissive:0x982905,emissiveIntensity:.49,roughness:.88});
  const variants = [fracturedRock(T,1), fracturedRock(T,5), fracturedRock(T,9)];
  const {geometry,material} = createMeteorTail(T);
  const up = new T.Vector3(0,1,0);
  const trailing = new T.Vector3(-260,84,0).normalize();
  const objects=[];
  for(let i=0;i<(compact?5:12);i++){
    const g=new T.Group();parent.add(g);g.name='Meteoro de obsidiana';
    g.quaternion.setFromUnitVectors(up,trailing);
    const rock = m(T,g,variants[i % variants.length],stone,0,0,0);
    rock.scale.setScalar(1.35 + rand(i,4) * 1.1);
    m(T,g,geometry,material,0,0,0);
    m(T,g,geometry,material,0,0,0).rotation.y = Math.PI / 2;
    objects.push({g,rock,i});
  }
  updates.push(t=>{
    const time = reduced ? 0 : t;
    material.uniforms.uTime.value = time;
    for(const {g,rock,i} of objects){
      const p=(time*.03+i*.167)%1;
      g.position.set(-130+p*260,93-p*84,24-i*31);
      g.visible=p>.05&&p<.89;
      const edgeScale = Math.min(1,(p-.05)/.075,(.89-p)/.075);
      g.scale.setScalar(Math.max(.001,edgeScale));
      rock.rotation.set(time * .9 + i,time * .51 + i,.38);
    }
  });
}
function shadowForest(T,parent,compact,reduced,updates){
  const trunk=color(T,0x34303c,{roughness:.95});
  const dead=color(T,0x302e3b);
  const tmp = new T.Object3D();
  const tint = new T.Color();
  const count = compact ? 114 : 228;
  const variants = 6;
  for (let style=0;style<variants;style++) {
    const trees = new T.InstancedMesh(createTreeGeometry(T,style+1,compact),trunk,count / variants);
    for (let j=0;j<count/variants;j++) {
      const i = j * variants + style;
      const side = (j+style)%2 ? 1 : -1;
      const x = side * (36 + rand(i,4) * 153), z = 46 - rand(i,7) * 460;
      const scale = 1.25 + rand(i,8) * 2.75;
      const girth = scale * (.64 + rand(i,6) * .29);
      tmp.position.set(x,surfaceHeight(2,x,z)-.35,z);
      tmp.scale.set(girth,scale,girth);
      tmp.rotation.set(0,rand(i,9)*Math.PI*2,0);
      tmp.updateMatrix();
      trees.setMatrixAt(j,tmp.matrix);
      tint.setScalar(.59 + rand(i,10) * .41);
      trees.setColorAt(j,tint);
    }
    trees.instanceMatrix.needsUpdate = true;
    trees.instanceColor.needsUpdate = true;
    trees.name = 'Bosque de troncos retorcidos';
    parent.add(trees);
  }
  // Ancient cemetery and overgrown abandoned castles.
  for(let i=0;i<(compact?18:36);i++){
    const s=i%2?1:-1,x=s*(26+rand(i,5)*102),z=36-i*13;
    const tomb=m(T,parent,new T.BoxGeometry(1.5,3.2,.65),dead,x,-6,z);
    tomb.rotation.y=rand(i,8)*.8;
    m(T,parent,new T.BoxGeometry(.9,.45,.82),dead,x,-4,z);
  }
  for(let i=0;i<4;i++)palace(T,parent,(i%2?1:-1)*(110+rand(i,8)*45),-20-i*84,1.2,true);
  // Black rivers / pools through the forest.
  const water=new T.MeshPhysicalMaterial({
    color:0x070e1c,metalness:.55,roughness:.23,transparent:true,opacity:.93
  });
  for(const s of [-1,1]){
    const pts=[];
    for(let i=0;i<43;i++)pts.push(new T.Vector3(s*(22+Math.sin(i*.3)*8),-9.1,40-i*9));
    const geo=new T.TubeGeometry(new T.CatmullRomCurve3(pts),150,2.5,6,false);
    m(T,parent,geo,water,0,0,0);
  }
  const moonMat=new T.MeshBasicMaterial({color:0xd6dcf6});
  m(T,parent,new T.SphereGeometry(21,30,20),moonMat,110,82,-270);
  const eclipse=new T.MeshBasicMaterial({color:0x151827});
  m(T,parent,new T.SphereGeometry(17,30,20),eclipse,110,82,-250);
  const ghosts=[];
  const ghostMat=new T.MeshBasicMaterial({color:0x73a2a7,transparent:true,opacity:.26,depthWrite:false});
  for(let i=0;i<12;i++){
    const g=m(T,parent,new T.SphereGeometry(.55,8,8),ghostMat,
      (i%2?1:-1)*(16+rand(i,3)*80),3+rand(i,6)*9,20-i*27);
    ghosts.push(g);
  }
  updates.push(t=>{
    if(reduced)return;
    ghosts.forEach((o,i)=>{o.position.y=3+rand(i,6)*9+Math.sin(t*.8+i)*2;});
  });
}
function shadowSecrets(T,parent,compact,reduced,updates){
  const stone=color(T,0x222433);
  const door=new T.Group();door.name='Puerta oculta de Sombras';parent.add(door);
  door.position.set(36,-5,-204);
  m(T,door,new T.BoxGeometry(8,14,3),stone,0,7,0);
  const iris=new T.MeshStandardMaterial({color:0x442768,emissive:0x3c1761,emissiveIntensity:.7});
  m(T,door,new T.BoxGeometry(5,10,.4),iris,0,6,1.65);
  for(let i=0;i<5;i++){
    const eyeMat=new T.MeshBasicMaterial({color:0xd056d6,transparent:true,opacity:.6});
    const eye=m(T,parent,new T.SphereGeometry(.2,9,7),eyeMat,
      (i%2?1:-1)*(30+i*12),2+i, -48-i*52);
    updates.push(t=>{eye.material.opacity=reduced?.55:.22+.5*Math.sin(t*1.3+i)**2;});
  }
  return door;
}
function cosmicConstructs(T,parent,compact,reduced,updates){
  const metal=color(T,0x40606e,{metalness:.86,roughness:.21});
  const cyan=new T.MeshBasicMaterial({color:0x66ebdb});
  const structures=[];
  for(let i=0;i<(compact?3:7);i++){
    const side=i%2?1:-1,x=side*(48+rand(i,3)*80),y=18+rand(i,5)*45,z=24-i*53;
    const g=new T.Group();g.position.set(x,y,z);parent.add(g);
    m(T,g,new T.CylinderGeometry(3,3,15,12),metal,0,0,0).rotation.x=Math.PI/2;
    for(let j=0;j<3;j++){
      const ring=m(T,g,new T.TorusGeometry(12+j*3,.8,8,48),metal,0,0,0);
      ring.rotation.x=.33+j*.28;ring.rotation.y=j*.4;
    }
    for(const s of [-1,1])m(T,g,new T.BoxGeometry(19,1.2,4),metal,s*12,0,0);
    const window=m(T,g,new T.SphereGeometry(3.8,16,12),cyan,0,0,0);
    g.userData.phase=i;structures.push(g);
  }
  updates.push(t=>{if(!reduced)structures.forEach(g=>g.rotation.y=Math.sin(t*.05+g.userData.phase)*.045);});
  // Black hole: dark core + distorted gravitational accretion ring shader.
  const hole=new T.Group();hole.position.set(-110,46,-260);parent.add(hole);
  m(T,hole,new T.SphereGeometry(17,40,28),new T.MeshBasicMaterial({color:0x01010a}),0,0,0);
  const disk=new T.ShaderMaterial({
    side:T.DoubleSide,transparent:true,depthWrite:false,
    uniforms:{uTime:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime;void main(){
      vec2 p=vUv*2.-1.;float a=atan(p.y,p.x)+uTime*.08;float r=length(p);
      float swirl=sin(a*28.-r*40.)*.18+.82;
      float g=smoothstep(.15,.28,r)*(1.-smoothstep(.63,1.,r));
      vec3 hue=mix(vec3(1.,.25,.07),vec3(.7,.69,1.),smoothstep(.34,.83,r));
      gl_FragColor=vec4(hue*swirl,g*.84);
    }`
  });
  const diskMesh=m(T,hole,new T.PlaneGeometry(80,80),disk,0,0,0);diskMesh.rotation.x=.75;
  updates.push(t=>{disk.uniforms.uTime.value=reduced?0:t;});
  // Wormhole as ring tunnel, with layered emissive toruses.
  const worm=new T.Group();worm.position.set(100,24,-178);parent.add(worm);
  for(let i=0;i<18;i++){
    const ring=m(T,worm,new T.TorusGeometry(9+i*.35,.19,7,40),i%2?metal:cyan,0,0,-i*2.3);
    ring.rotation.z=i*.22;
  }
  updates.push(t=>{if(!reduced)worm.rotation.z=Math.sin(t*.13)*.1;});
  // Planetas visitables: exactamente las coordenadas de los puntos del mapa.
  const planetary=[
    {name:'Borealis',x:80,y:35,z:-68,r:15,hex:0x517fa5},
    {name:'Umbra',x:-90,y:20,z:-205,r:19,hex:0x544675},
    {name:'Arca',x:128,y:45,z:-323,r:13,hex:0x659d8e}
  ];
  planetary.forEach((p,i)=>{
    const surface=color(T,p.hex,{metalness:.08,roughness:.9});
    const sphere=m(T,parent,new T.SphereGeometry(p.r,36,28),surface,p.x,p.y,p.z);
    sphere.name='Planeta '+p.name;
    const atm=new T.MeshBasicMaterial({color:p.hex,transparent:true,
      opacity:.14,depthWrite:false,side:T.BackSide});
    m(T,parent,new T.SphereGeometry(p.r*1.12,30,22),atm,p.x,p.y,p.z);
    const ring=m(T,parent,new T.RingGeometry(p.r*1.5,p.r*2.1,64),
      new T.MeshStandardMaterial({color:0x8bbab8,side:T.DoubleSide,
      transparent:true,opacity:.42,depthWrite:false}),p.x,p.y,p.z);
    ring.rotation.x=.8+i*.1;
    updates.push(t=>{if(!reduced)sphere.rotation.y=t*.013;});
  });
  // Naves desconocidas: patrullan en trayectorias propias.
  const scouts=[];
  const buildScout = createScoutKit(T,metal,cyan);
  for(let i=0;i<(compact?4:9);i++){
    const g=new T.Group();g.name='Nave exploradora desconocida';parent.add(g);
    buildScout(g);
    g.scale.setScalar(.78 + rand(i,3) * .46);
    scouts.push({g,i});
  }
  updates.push(t=>scouts.forEach(({g,i})=>{
    const p=(reduced ? 0 : t)*.12+i*.8;
    const range = 65 + i * 5;
    g.position.set(Math.sin(p)*range,12+Math.sin(p*.8)*10,-80-i*32+Math.cos(p)*24);
    g.rotation.set(.08 * Math.cos(p*.8), Math.atan2(-Math.cos(p)*range, Math.sin(p)*24), .2 * Math.sin(p), 'YXZ');
  }));
  const alien=color(T,0x2c675f,{emissive:0x103b3e,emissiveIntensity:.4});
  for(let i=0;i<4;i++){
    const side=i%2?1:-1,x=side*(135+rand(i,4)*23),z=-35-i*85;
    const dome=m(T,parent,new T.SphereGeometry(18,16,12),alien,x,-13,z);
    dome.scale.y=.22;
    for(let j=0;j<5;j++){
      const spire=m(T,parent,new T.ConeGeometry(2.3,25,7),metal,x+Math.cos(j*1.26)*12,6,z+Math.sin(j*1.26)*12);
    }
  }
}
export function enhanceRealm(THREE,parent,level,{compact=false,reduced=false}={}){
  const decor=new THREE.Group();decor.name='Detalles del reino '+level;parent.add(decor);
  const updates=[];
  if(level===0){gardens(THREE,decor,compact);waterfalls(THREE,decor,compact,reduced,updates);
    sunshafts(THREE,decor,reduced,updates);heavenlyCreatures(THREE,decor,compact,reduced,updates);
    palace(THREE,decor,-112,-218,2.15);
    palace(THREE,decor,124,-62,1.35);
  }
  if(level===1){infernalFortresses(THREE,decor,compact);infernalCreatures(THREE,decor,compact,reduced,updates);
    lightning(THREE,decor,reduced,updates);meteors(THREE,decor,compact,reduced,updates);
  }
  if(level===2){shadowForest(THREE,decor,compact,reduced,updates);shadowSecrets(THREE,decor,compact,reduced,updates);}
  if(level===3){cosmicConstructs(THREE,decor,compact,reduced,updates);}
  return t=>updates.forEach(fn=>fn(t));
}
