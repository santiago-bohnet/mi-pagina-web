// Detalle visual sin descargas ni texturas de terceros: terreno con ruido
// coherente, mapas minerales, bruma volumétrica simulada y lava animada.
// Calidad adaptativa para celulares; mantiene el universo modular.
const frac=n=>n-Math.floor(n);
function hash(x,y,seed=0) {
  return frac(Math.sin(x*127.1+y*311.7+seed*79.3)*43758.5453);
}
const fade=t=>t*t*(3-2*t);
function noise(x,y,seed=0){
  const i=Math.floor(x),j=Math.floor(y),fx=fade(x-i),fy=fade(y-j);
  const a=hash(i,j,seed),b=hash(i+1,j,seed);
  const c=hash(i,j+1,seed),d=hash(i+1,j+1,seed);
  return (a+(b-a)*fx)+(c+(d-c)*fx-a-(b-a)*fx)*fy;
}
export function fbm(x,y,seed=0){
  let f=1,value=0,sum=0;
  for(let i=0;i<5;i++){
    value+=noise(x*f,y*f,seed+i*7)/f;
    sum+=1/f;f*=2.09;
  }
  return value/sum;
}

function makeMineralTexture(THREE,level,compact){
  const n=compact?128:256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=n;
  const ctx=canvas.getContext('2d');
  const im=ctx.createImageData(n,n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const s=fbm(x/34,y/34,level+3);
    const cracks=Math.pow(Math.max(0,1-Math.abs(fbm(x/12,y/12,level+8)-.5)*18),4);
    const mineral=level===1?Math.max(0,s-.31)*185:Math.max(0,s-.30)*220;
    const shade=Math.max(90,Math.min(255,112+mineral+(level===1?-37:8)*cracks));
    const a=(y*n+x)*4;
    im.data[a]=shade;
    im.data[a+1]=shade;
    im.data[a+2]=shade;
    im.data[a+3]=255;
  }
  ctx.putImageData(im,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(5,6);
  texture.anisotropy=2;
  return texture;
}

export function createRealisticTerrain(THREE,level,theme,compact=false){
  const segments=compact?76:138;
  const geometry=new THREE.PlaneGeometry(420,700,segments,compact?112:196);
  geometry.rotateX(-Math.PI/2);
  geometry.translate(0,0,-130);
  const attr=geometry.attributes.position;
  const c1=new THREE.Color(theme.ground);
  const c2=new THREE.Color(theme.groundAlt);
  const dark=new THREE.Color(level===1?0x110b11:level===0?0x6d94a9:0x16152a);
  const color=new THREE.Color();
  const colors=new Float32Array(attr.count*3);
  for(let i=0;i<attr.count;i++){
    const x=attr.getX(i),z=attr.getZ(i);
    const rough=fbm(x*.068,z*.063,level*12+3);
    const detail=fbm(x*.20,z*.24,level*12+15);
    const ridge=1-Math.abs(fbm(x*.026,z*.029,level*12+22)*2-1);
    // Zona amplia y despejada por donde puede pasar la nave en curva.
    const side=Math.max(0,Math.min(1,(Math.abs(x)-19)/95));
    const mountains=side*side*(level===1?38:level===0?12:25);
    const roughness=side*(rough-.46)*(level===1?17:9)+(detail-.5)*2.8;
    const height=-12+mountains+roughness+(level===1?ridge*side*8:0);
    attr.setY(i,height);
    const shade=Math.max(0,Math.min(1,(rough-.27)*1.65+side*.2));
    color.copy(c1).lerp(c2,shade);
    if(level===1)color.lerp(dark,(1-ridge)*side*.34);
    colors[i*3]=color.r;colors[i*3+1]=color.g;colors[i*3+2]=color.b;
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({
    map:makeMineralTexture(THREE,level,compact),
    vertexColors:true,roughness:level===0?.93:.98,metalness:level===1?.1:0,
    side:THREE.DoubleSide
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name=level===1?'Terreno de ceniza y obsidiana':'Relieve natural';
  mesh.receiveShadow=true;
  return mesh;
}

function cloudTexture(THREE){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');
  const grad=ctx.createRadialGradient(64,64,2,64,64,64);
  grad.addColorStop(0,'rgba(255,255,255,.96)');
  grad.addColorStop(.23,'rgba(255,255,255,.79)');
  grad.addColorStop(.58,'rgba(255,255,255,.33)');
  grad.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(canvas);
}

export function createAtmosphericLayers(THREE,group,level,compact=false,reduced=false){
  const texture=cloudTexture(THREE);
  const collection=[];
  const isHeaven=level===0,isFire=level===1;
  if(!isHeaven&&!isFire)return()=>{};
  const clouds=compact?(isHeaven?19:17):(isHeaven?38:32);
  const color=isHeaven?0xf7f4e8:0x21171b;
  for(let i=0;i<clouds;i++){
    const side=i%2?-1:1;
    const groupCloud=new THREE.Group();
    groupCloud.position.set(
      side*(22+hash(i,1,level)*105),
      (isHeaven?9:-1)+hash(i,2,level)*(isHeaven?34:55),
      34-hash(i,3,level)*340
    );
    for(let j=0;j<4;j++){
      const mat=new THREE.SpriteMaterial({
        map:texture,color,transparent:true,depthWrite:false,
        opacity:(isHeaven?.15:.22)*(1-hash(i,j+7)*.25),
        fog:true
      });
      const sprite=new THREE.Sprite(mat);
      sprite.position.set((j-1.5)*6,Math.sin(j*2)*2,j%2?2:-2);
      const width=(isHeaven?23:16)*(1+hash(j,i,level));
      sprite.scale.set(width,width*.48,1);
      groupCloud.add(sprite);
    }
    group.add(groupCloud);
    collection.push({obj:groupCloud,y:groupCloud.position.y,seed:i});
  }
  return time=>{
    if(reduced)return;
    for(const cloud of collection){
      cloud.obj.position.y=cloud.y+Math.sin(time*.11+cloud.seed)*.65;
      cloud.obj.position.x+=Math.sin(time*.02+cloud.seed)*.0008;
    }
  };
}

function lavaTexture(THREE) {
  const size=256;
  const c=document.createElement('canvas');
  c.width=c.height=size;
  const ctx=c.getContext('2d');
  const im=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const warp=fbm(x/28,y/18,21);
    const current=fbm(x/12+warp*5,y/27+warp*5,33);
    const stripe=Math.pow(Math.abs(Math.sin(y*.064+warp*13)),3);
    const heat=Math.max(0,Math.min(1,current*.7+stripe*.55));
    const crust=heat<.42;
    const k=(y*size+x)*4;
    im.data[k]=crust?44:Math.round(149+heat*106);
    im.data[k+1]=crust?12:Math.round(24+heat*114);
    im.data[k+2]=crust?10:Math.round(2+heat*22);
    im.data[k+3]=255;
  }
  ctx.putImageData(im,0,0);
  const texture=new THREE.CanvasTexture(c);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(8,1);
  return texture;
}
export function createFlowingLava(THREE,group,compact=false,reduced=false){
  const map=lavaTexture(THREE);
  const material=new THREE.MeshStandardMaterial({
    map,emissiveMap:map,emissive:0xff3c12,emissiveIntensity:2.4,
    metalness:.12,roughness:.31
  });
  const edgeMat=new THREE.MeshBasicMaterial({color:0xff2e09,transparent:true,opacity:.38});
  const riverCount=compact?2:3;
  for(let r=0;r<riverCount;r++){
    const side=r%2?-1:1;
    const coords=[];
    for(let j=0;j<55;j++){
      const z=44-j*7.7;
      const x=side*(29+r*8+Math.sin(j*.37+r)*9)+
        Math.sin(j*.7+r*.9)*3;
      coords.push(new THREE.Vector3(x,-8.9,z));
    }
    const spline=new THREE.CatmullRomCurve3(coords);
    const glow=new THREE.Mesh(new THREE.TubeGeometry(spline,170,compact?2.15:2.8,9,false),edgeMat);
    glow.frustumCulled=false;group.add(glow);
    const surface=new THREE.Mesh(new THREE.TubeGeometry(spline,170,compact?1.75:2.35,9,false),material);
    surface.frustumCulled=false;group.add(surface);
  }
  return time=>{
    map.offset.x=reduced?0:(time*.045)%1;
    map.offset.y=reduced?0:(time*.027)%1;
  };
}

// Materiales PBR fotográficos CC0 (Poly Haven). Se cargan en segundo plano.
// Si el CDN falla, se conserva la textura mineral procedural incorporada.
const PBR_ASSETS = {
  0:'rock_path',
  1:'rocky_gravel',
  2:'rock_ground_02'
};
export function upgradeTerrainWithPBR(THREE,mesh,level,compact=false){
  const id=PBR_ASSETS[level];
  if(!id)return;
  const loader=new THREE.TextureLoader();
  // 2K en escritorio para conservar vetas y volumen de la roca; 1K en móvil.
  const resolution=compact?'1k':'2k';
  const base='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/'+resolution+'/'+id+'/'+id;
  const setup=texture=>{
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(8,12);
    texture.anisotropy=compact?2:4;
    return texture;
  };
  loader.load(base+'_diff_'+resolution+'.jpg',map=>{
    map.colorSpace=THREE.SRGBColorSpace;
    mesh.material.map=setup(map);
    mesh.material.needsUpdate=true;
  },undefined,()=>{
    // El material procedural original es siempre usable sin conexión.
  });
  if(!compact){
    loader.load(base+'_nor_gl_'+resolution+'.jpg',normal=>{
      mesh.material.normalMap=setup(normal);
      mesh.material.normalScale.set(.33,.33);
      mesh.material.needsUpdate=true;
    },undefined,()=>{});
  }
}
