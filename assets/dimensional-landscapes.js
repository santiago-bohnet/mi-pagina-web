// Paisajes abiertos; no se crean paredes, tubos ni túneles.
// Los paisajes acompañan una trayectoria con curvas amplias.
// Texturas y atmósfera generadas localmente para evitar dependencias.
import { createRealisticTerrain, createAtmosphericLayers, createFlowingLava, upgradeTerrainWithPBR } from './realistic-environments.js?v=tour-6';
import { createHeavenlyCloudscape } from './heavenly-cloudscape.js?v=worlds-11';
import { addCinematicWorldDetails } from './world-cinematics.js?v=worlds-11';
import { createAngelFlock } from './angel-flight.js?v=worlds-11';
const THEMES = Object.freeze([
  { skyTop: 0x346b9a, skyHorizon: 0xffedc8, ground: 0x9cbdd4, accent: 0xffe5a2,
    groundAlt: 0xcfe7e0, mist: 0xb8d5e5 },
  { skyTop: 0x140710, skyHorizon: 0x9a210f, ground: 0x211218, accent: 0xff501c,
    groundAlt: 0x4f1813, mist: 0x381018 },
  { skyTop: 0x0a081c, skyHorizon: 0x643d88, ground: 0x24192f, accent: 0xad78ff,
    groundAlt: 0x453152, mist: 0x231b3e },
  { skyTop: 0x060d1b, skyHorizon: 0x205f71, ground: 0x0c202b, accent: 0x70fce4,
    groundAlt: 0x225361, mist: 0x111e37 }
]);
const randomAt = n => {
  const v = Math.sin(n * 127.1 + 39.346) * 43758.5453;
  return v - Math.floor(v);
};

export function makeLandscape(THREE, level, { compact = false, reduced = false } = {}) {
  const theme = THEMES[level];
  const group = new THREE.Group();
  group.name = ['Cielo angelical','Infierno volcánico','Valle de sombras','Cosmos abierto'][level];
  group.position.y = -level * 32;
  // Detalle cinematográfico por mundo: arquitectura, relieves, atmósfera y vida.
  const cinematic=addCinematicWorldDetails(THREE,group,level,{compact,reduced});
  // En Luz no se utiliza la nube radial ni terreno de roca: se sustituye por
  // un océano continuo de nubes de ruido fractal y capas atmosféricas.
  const animated = level===0
    ? [createHeavenlyCloudscape(THREE,group,{compact,reduced}),cinematic]
    : [createAtmosphericLayers(THREE,group,level,compact,reduced),cinematic];
  const shared = {
    orb: new THREE.SphereGeometry(1, 12, 10),
    cloud: new THREE.IcosahedronGeometry(1, 1),
    pillar: new THREE.CylinderGeometry(1, 1.15, 1, 9),
    shard: new THREE.ConeGeometry(1, 1, 7),
    box: new THREE.BoxGeometry(1, 1, 1)
  };
  const material = (color, extras = {}) => new THREE.MeshStandardMaterial({
    color, roughness: .77, ...extras
  });
  const glowMaterial = color => new THREE.MeshBasicMaterial({ color, fog: false });
  const put = (geometry, mat, position, scale, parent = group) => {
    const obj = new THREE.Mesh(geometry, mat);
    obj.position.set(...position);
    if(scale) obj.scale.set(...scale);
    parent.add(obj);
    return obj;
  };

  function addInstances(geometry, mat, placements) {
    const mesh = new THREE.InstancedMesh(geometry, mat, placements.length);
    const transform = new THREE.Object3D();
    placements.forEach((item, i) => {
      transform.position.set(item.x,item.y,item.z);
      transform.scale.set(item.sx || 1,item.sy || 1,item.sz || 1);
      transform.rotation.y=item.ry || 0;
      transform.updateMatrix();
      mesh.setMatrixAt(i,transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    mesh.frustumCulled=false;
    group.add(mesh);
    return mesh;
  }

  // Horizonte con dispersión solar y halo suave; no hay cielos planos.
  const sunDir=new THREE.Vector3(level===0?-.32:.38,.28,-.9).normalize();
  const sky=new THREE.Mesh(new THREE.SphereGeometry(390,40,26),
    new THREE.ShaderMaterial({
      uniforms:{
        uZenith:{value:new THREE.Color(theme.skyTop)},
        uHorizon:{value:new THREE.Color(theme.skyHorizon)},
        uSun:{value:sunDir},
        uSunColor:{value:new THREE.Color(level===0?0xfff0d8:0xff6e32)}
      },
      vertexShader:`varying vec3 vDir; void main(){
        vDir=position;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }`,
      fragmentShader:`uniform vec3 uZenith; uniform vec3 uHorizon;
        uniform vec3 uSun; uniform vec3 uSunColor; varying vec3 vDir;
        void main(){
          vec3 d=normalize(vDir);
          float h=clamp(d.y*.8+.25,0.,1.);
          vec3 sky=mix(uHorizon,uZenith,smoothstep(.04,.93,h));
          float a=max(dot(d,normalize(uSun)),0.);
          float halo=pow(a,19.)*.18+pow(a,130.)*.34;
          float disk=smoothstep(.99942,.99982,a);
          gl_FragColor=vec4(sky+uSunColor*(halo+disk*.47),1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      side:THREE.BackSide,depthWrite:false,fog:false
    }));
  sky.position.set(0,0,-82);
  // El cosmos utiliza su propia nebulosa fractal, no un cielo diurno encima.
  if(level!==3)group.add(sky);
  // Luz: océano de nubes. Cosmos: vacío espacial, sin suelo plano.
  // Sólo Fuego y Sombras tienen relieve mineral.
  if(level===1||level===2){
    const landform=createRealisticTerrain(THREE,level,theme,compact);
    group.add(landform);
    upgradeTerrainWithPBR(THREE,landform,level,compact);
  }
  // Sol integrado en el gradiente atmosférico: las esferas luminosas
  // opacas producían discos artificiales sobre el cielo y la nebulosa.
  // El sol ahora forma parte del shader de dispersión anterior.
  // Franjas de cielo y pequeños halos para evitar un entorno vacío.
  if(level===0){
    // Las nubes voxel/icosaedro fueron retiradas. La atmósfera ahora se
    // compone de un suelo de nubes y masas con bordes orgánicos.
    // La arquitectura original de cajas y columnas flotantes se eliminó.
    // Los templos escalonados y pedestales reales se construyen y comparten
    // geometría en el módulo de detalle cinematográfico de Luz.
    // Alas con plumas instanciadas y silueta humana esculpida: reemplaza
    // las antiguas esferas geométricas que se veían como figuras de juguete.
    animated.push(createAngelFlock(THREE,group,{compact,reduced}));
    const heavenlyLight=new THREE.HemisphereLight(0xfff7d9,0x527fba,2.5);
    group.add(heavenlyLight);
    const sunlight=new THREE.DirectionalLight(0xffecd6,2.45);
    sunlight.position.set(-40,80,-100);
    sunlight.castShadow=!compact;
    if(sunlight.castShadow){
      sunlight.shadow.mapSize.set(1024,1024);
      sunlight.shadow.camera.left=-75;
      sunlight.shadow.camera.right=75;
      sunlight.shadow.camera.top=75;
      sunlight.shadow.camera.bottom=-75;
      sunlight.shadow.camera.far=270;
      sunlight.shadow.bias=-.00035;
    }
    group.add(sunlight);
  }

  if(level===1){
    // Montañas de obsidiana, cráteres, lava y brasas flotantes.
    const rock=material(0x1b111c,{metalness:.16,emissive:0x23080c,emissiveIntensity:.3});
    const coal=material(0x392026,{emissive:0x510b03,emissiveIntensity:.3,roughness:.86});
    const spikes=[],boulders=[];
    for(let i=0;i<(compact?95:176);i++){
      const side=i%2?1:-1;
      const x=side*(17+randomAt(i+41)*146);
      const z=30-randomAt(i+56)*345;
      if(z>-150&&z<-74&&x>0&&x<60)continue;
      spikes.push({x,y:-6+randomAt(i+7)*3,z,
        sx:2+randomAt(i+17)*4,sy:8+randomAt(i+71)*42,sz:2+randomAt(i+22)*4,ry:randomAt(i+80)*6});
      if(i%3===0)boulders.push({x:x+6,y:-8,z:z-2,sx:3+randomAt(i+14)*7,sy:2+randomAt(i+91)*6,sz:4+randomAt(i+67)*9});
    }
    addInstances(shared.shard,rock,spikes);
    addInstances(shared.cloud,coal,boulders);
    const volcano=new THREE.Group();
    volcano.position.set(-92,-1,-176);
    group.add(volcano);
    const mountainGeometry=new THREE.ConeGeometry(39,76,32,12);
    const vertices=mountainGeometry.getAttribute('position');
    for(let i=0;i<vertices.count;i++){
      const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);
      const theta=Math.atan2(z,x);
      const jagged=1+.13*Math.sin(theta*7+y*.03)+.085*Math.cos(theta*11+y*.13);
      vertices.setXYZ(i,x*jagged,y,z*jagged);
    }
    mountainGeometry.computeVertexNormals();
    const mountain=put(mountainGeometry,rock,[0,0,0],null,volcano);
    mountain.castShadow=!compact;
    const rim=put(new THREE.TorusGeometry(11,2,10,38),coal,[0,35,0],null,volcano);
    rim.rotation.x=Math.PI/2;
    put(new THREE.CylinderGeometry(9.6,9.6,1,32),glowMaterial(0xff5314),
      [0,34.7,0],null,volcano);
    animated.push(createFlowingLava(THREE,group,compact,reduced));
    // Plumas de ceniza sobre el cráter: cambian lentamente de altura.
    const smokeMaterial=new THREE.MeshStandardMaterial({
      color:0x251c21,transparent:true,opacity:.42,depthWrite:false,roughness:1
    });
    const smoke=[];
    for(let i=0;i<(compact?7:13);i++){
      smoke.push(put(shared.cloud,smokeMaterial,[-92+Math.sin(i*1.6)*4,35+i*6,
        -176+Math.cos(i*1.9)*4],[4+i*.8,3.5+i*.7,4+i*.8]));
    }
    animated.push(time=>{
      if(reduced)return;
      smoke.forEach((obj,i)=>{
        obj.position.y=35+i*6+((time*.65+i*2)%6);
        obj.position.x=-92+Math.sin(time*.2+i*.9)*5;
      });
    });
    const points=new Float32Array((compact?100:200)*3);
    for(let i=0;i<points.length/3;i++){
      const side=i%2?1:-1;
      points[i*3]=side*(14+randomAt(i+93)*90);
      points[i*3+1]=-2+randomAt(i+45)*46;
      points[i*3+2]=20-randomAt(i+8)*342;
    }
    const emberGeo=new THREE.BufferGeometry();
    emberGeo.setAttribute('position',new THREE.BufferAttribute(points,3));
    const embers=new THREE.Points(emberGeo,new THREE.PointsMaterial({
      color:0xff9a39,size:.9,transparent:true,opacity:.88,
      depthWrite:false,blending:THREE.AdditiveBlending
    }));
    group.add(embers);
    animated.push(time=>{embers.position.y=reduced?0:(time*1.4%8);});
    const fireLight=new THREE.HemisphereLight(0xff5f28,0x1e0612,1.35);
    group.add(fireLight);
    const volcanicLight=new THREE.PointLight(0xff2e08,550,150);
    volcanicLight.position.set(0,8,-96);
    group.add(volcanicLight);
    if(!reduced)animated.push(time=>{volcanicLight.intensity=480+Math.sin(time*2.3)*95;});
  }

  if(level===2){
    const crystal=material(0x251738,{metalness:.55,roughness:.26,emissive:0x5c297a,emissiveIntensity:.55});
    const tips=material(0x9964dc,{emissive:0x6727bd,emissiveIntensity:.65,metalness:.35});
    const placements=[],highlights=[];
    for(let i=0;i<(compact?100:185);i++){
      const side=i%2?1:-1;
      const x=side*(17+randomAt(i+31)*140),z=30-randomAt(i+44)*345;
      if(z>-150&&z<-74&&x<0&&x>-60)continue;
      const h=9+randomAt(i+66)*49;
      placements.push({x,y:-6,z,sx:1+randomAt(i)*3,sy:h,sz:1+randomAt(i+3)*3});
      if(i%4===0)highlights.push({x,y:-3+h*.45,z,sx:.3,sy:h*.21,sz:.3});
    }
    addInstances(shared.shard,crystal,placements);
    addInstances(shared.shard,tips,highlights);
    group.add(new THREE.HemisphereLight(0xa172ea,0x0b071c,1.6));
  }

  if(level===3){
    const stars=new THREE.BufferGeometry();
    const n=compact?500:900;
    const positions=new Float32Array(n*3);
    for(let i=0;i<n;i++){
      positions[3*i]=(randomAt(i+13)-.5)*360;
      positions[3*i+1]=randomAt(i+91)*150-12;
      positions[3*i+2]=30-randomAt(i+188)*280;
    }
    stars.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const swarm=new THREE.Points(stars,new THREE.PointsMaterial({
      color:0xc7ffe9,size:.75,transparent:true,opacity:.82,depthWrite:false
    }));
    group.add(swarm);
    const orbsMat=material(0x286a79,{metalness:.65,roughness:.3,emissive:0x0c6670,emissiveIntensity:.8});
    const ringsMat=glowMaterial(0x58dfbd);
    for(let i=0;i<13;i++){
      const side=i%2?1:-1;
      const x=side*(25+randomAt(i+7)*100);
      const y=8+randomAt(i+66)*43;
      const z=18-i*28;
      const size=2+randomAt(i+18)*9;
      put(shared.orb,orbsMat,[x,y,z],[size,size,size]);
      const ring=put(new THREE.TorusGeometry(size*1.55,.12,6,32),ringsMat,[x,y,z]);
      ring.rotation.x=.4;ring.rotation.y=i*.55;
      animated.push(time=>{if(!reduced)ring.rotation.z=time*.09;});
    }
    group.add(new THREE.HemisphereLight(0x64e5d6,0x07151d,1.7));
  }

  function update(time) {
    for(const tick of animated)tick(time);
  }
  return { group, update, theme };
}
