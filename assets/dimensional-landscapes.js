// Paisajes abiertos; no se crean paredes, tubos ni túneles.
// Todos los mundos usan una ruta recta sobre el eje Z y comparten geometrías.
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
  const animated = [];
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

  // Gradiente esférico independiente del fog: cielo abierto hasta el horizonte.
  const sky = new THREE.Mesh(new THREE.SphereGeometry(390,32,20),
    new THREE.ShaderMaterial({
      uniforms: {
        uZenith: { value: new THREE.Color(theme.skyTop) },
        uHorizon: { value: new THREE.Color(theme.skyHorizon) }
      },
      vertexShader: `varying vec3 vDir;
        void main() { vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uZenith; uniform vec3 uHorizon; varying vec3 vDir;
        void main() {
          float height=clamp(normalize(vDir).y*.95+.17,0.0,1.0);
          gl_FragColor=vec4(mix(uHorizon,uZenith,smoothstep(.05,.92,height)),1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      side: THREE.BackSide, depthWrite: false, fog: false
    }));
  sky.position.set(0,0,-80);
  group.add(sky);

  const terrain = new THREE.PlaneGeometry(370,430,42,52);
  terrain.rotateX(-Math.PI/2);
  terrain.translate(0,-10,-85);
  const attr=terrain.getAttribute('position');
  const colors=[];
  const low=new THREE.Color(theme.ground),high=new THREE.Color(theme.groundAlt);
  const color=new THREE.Color();
  for(let i=0;i<attr.count;i++){
    const x=attr.getX(i),z=attr.getZ(i);
    const wave=Math.sin(x*.064+level)*Math.cos(z*.078)+
      Math.sin(x*.18+z*.11)*.35;
    const side=Math.min(1,Math.max(0,(Math.abs(x)-12)/85));
    const highland=level===0?side*3.4:side*12;
    const variation=level===1?2.5:1.25;
    const y=-10+wave*variation+highland;
    attr.setY(i,y);
    color.copy(low).lerp(high,Math.max(0,Math.min(1,.35+wave*.27+side*.17)));
    colors.push(color.r,color.g,color.b);
  }
  terrain.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  terrain.computeVertexNormals();
  put(terrain,new THREE.MeshStandardMaterial({
    vertexColors:true,roughness:1,side:THREE.DoubleSide
  }),[0,0,0]);
  // Neblina/capas de horizonte: las formas lejanas desaparecen en el paisaje.
  const moonMat=glowMaterial(level===0?0xfff8cd:level===1?0xfa3c12:theme.accent);
  const sun=put(new THREE.SphereGeometry(level===0?24:16,20,16),
    moonMat,[level===0?-72:65,level===0?73:62,-242]);
  sun.material.depthWrite=false;

  // Franjas de cielo y pequeños halos para evitar un entorno vacío.
  if(level===0){
    const cloudMat=material(0xf1f1e4,{transparent:true,opacity:.82,depthWrite:false,emissive:0xb2bdcf,emissiveIntensity:.22});
    const clouds=[];
    for(let i=0;i<(compact?38:67);i++){
      const side=i%2?1:-1;
      clouds.push({
        x:side*(15+randomAt(i+11)*120),
        y:-2+randomAt(i+47)*22,
        z:35-randomAt(i+86)*245,
        sx:5+randomAt(i+26)*14,sy:1.1+randomAt(i+38)*2.9,
        sz:4+randomAt(i+29)*9
      });
    }
    addInstances(shared.cloud,cloudMat,clouds);
    // Columnas blancas y doradas sobre islas flotantes a ambos lados del vuelo.
    const marble=material(0xe9e4d5,{metalness:.1,emissive:0xc9b579,emissiveIntensity:.12});
    const gold=material(0xffd386,{metalness:.45,roughness:.35,emissive:0xcc9e58,emissiveIntensity:.34});
    const columns=[],capitals=[];
    for(let i=0;i<22;i++){
      const side=i%2?-1:1,z=-17-i*8;
      const x=side*(25+(i%4)*12);
      columns.push({x,y:1+(i%3)*1.3,z,sx:1.15,sy:21+(i%4)*4,sz:1.15});
      capitals.push({x,y:12+(i%3)*1.3+(i%4)*2,z,sx:3.4,sy:.85,sz:3.4});
    }
    addInstances(shared.pillar,marble,columns);
    addInstances(shared.box,gold,capitals);

    // Ángeles modelados con túnicas, cabezas, aureolas y alas emplumadas.
    // No se usan imágenes planas: son figuras tridimensionales ligeras.
    const robe=material(0xf6f2e4,{emissive:0xe6dbaa,emissiveIntensity:.34});
    const face=material(0xffe4b9,{emissive:0xf7c582,emissiveIntensity:.2});
    const feather=material(0xfff6e0,{side:THREE.DoubleSide,emissive:0xdce2ff,emissiveIntensity:.30});
    const halo=glowMaterial(0xffe19a);
    const wingshape=new THREE.SphereGeometry(1,8,6);
    const angelCount=compact?6:12;
    for(let i=0;i<angelCount;i++){
      const angel=new THREE.Group();
      const side=i%2?1:-1;
      angel.position.set(side*(17+randomAt(i+128)*29),6+randomAt(i+221)*10,-24-i*(compact?29:16));
      const size=.88+randomAt(i+42)*.55;
      angel.scale.setScalar(size);
      const robeObj=put(new THREE.ConeGeometry(.95,3,9),robe,[0,0,0],null,angel);
      robeObj.rotation.z=Math.PI; // Falda en forma de campana.
      put(shared.orb,face,[0,2.0,0],[.51,.55,.48],angel);
      put(new THREE.TorusGeometry(.75,.08,6,24),halo,[0,2.84,0],null,angel).rotation.x=Math.PI/2;
      const wingGroups=[];
      for(const dir of [-1,1]){
        const wing=new THREE.Group();
        wing.position.set(dir*.52,1.15,-.2);
        for(let k=0;k<7;k++){
          const featherObj=put(wingshape,feather,
            [dir*(.32+k*.36),.46-k*.12,-.06],
            [.23+(.04*k),1.05-k*.085,.16],wing);
          featherObj.rotation.z=dir*(.55+k*.11);
        }
        angel.add(wing);
        wingGroups.push({wing,dir});
      }
      group.add(angel);
      animated.push(time=>{
        if(reduced)return;
        angel.position.y=angel.userData.baseY+Math.sin(time*.62+i)*.35;
        wingGroups.forEach(({wing,dir})=>{
          wing.rotation.z=dir*(.12+Math.sin(time*1.4+i*.65)*.17);
        });
      });
      angel.userData.baseY=angel.position.y;
    }
    const heavenlyLight=new THREE.HemisphereLight(0xfff7d9,0x527fba,2.5);
    group.add(heavenlyLight);
    const sunlight=new THREE.DirectionalLight(0xfff3cf,2.1);
    sunlight.position.set(-40,80,-100);
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
      const z=30-randomAt(i+56)*260;
      spikes.push({x,y:-6+randomAt(i+7)*3,z,
        sx:2+randomAt(i+17)*4,sy:8+randomAt(i+71)*42,sz:2+randomAt(i+22)*4,ry:randomAt(i+80)*6});
      if(i%3===0)boulders.push({x:x+6,y:-8,z:z-2,sx:3+randomAt(i+14)*7,sy:2+randomAt(i+91)*6,sz:4+randomAt(i+67)*9});
    }
    addInstances(shared.shard,rock,spikes);
    addInstances(shared.cloud,coal,boulders);
    const volcano=new THREE.Group();
    volcano.position.set(-92,-1,-176);
    group.add(volcano);
    const cone=put(new THREE.ConeGeometry(37,67,15,3),rock,[0,0,0],null,volcano);
    cone.rotation.y=.2;
    // Núcleo del volcán: aro de lava en el cráter.
    const magma=glowMaterial(0xff3f0d);
    put(new THREE.CylinderGeometry(10,10,1.1,32),magma,[0,30,0],null,volcano);
    const lava=glowMaterial(0xff4b13);
    const hot=glowMaterial(0xffba3b);
    for(const side of [-1,1]){
      const pts=[];
      for(let j=0;j<25;j++){
        const z=30-j*10;
        const x=side*(22+Math.sin(j*.68+side)*6);
        pts.push(new THREE.Vector3(x,-7.0,z));
      }
      const path=new THREE.CatmullRomCurve3(pts);
      const ribbon=put(new THREE.TubeGeometry(path,96,1.65,6),lava,[0,0,0]);
      ribbon.frustumCulled=false;
      const inner=pts.map(v=>v.clone().add(new THREE.Vector3(side*.1,.3,.1)));
      put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(inner),96,.4,5),hot,[0,0,0]);
    }
    const points=new Float32Array((compact?100:200)*3);
    for(let i=0;i<points.length/3;i++){
      const side=i%2?1:-1;
      points[i*3]=side*(14+randomAt(i+93)*90);
      points[i*3+1]=-2+randomAt(i+45)*46;
      points[i*3+2]=20-randomAt(i+8)*245;
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
      const x=side*(17+randomAt(i+31)*140),z=30-randomAt(i+44)*260;
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
      const z=15-i*19;
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
