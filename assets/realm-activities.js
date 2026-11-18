// Biblioteca y forja 3D con contenido LOCAL. No envían datos a servidores.
export const LIBRARY_TYPES=['Reflexiones','Filosofía y cosmovisiones','Mitología e historia','Libros y documentos','Historias de personajes'];
export const FORGE_TYPES=['Proyecto de software','Proyecto terminado','Idea','Objetivo','Desafío'];
const KEY='universo-xr-vault-v1',LIMIT=80;
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
const str=(x,n=12000)=>String(x??'').slice(0,n);
export function createXRStore(storage=globalThis.localStorage){
 let data={version:1,library:[{id:'intro',title:'Bienvenido al Santuario',category:'Mitología e historia',
  body:'Los recuerdos y escritos de Universo XR. Elegí un libro de los estantes o escribí uno nuevo.',created:'2026-11-18'}],
  forge:[],secrets:[]};
 try{
  const saved=JSON.parse(storage?.getItem(KEY)||'null');
  if(saved?.version===1 && Array.isArray(saved.library)&&Array.isArray(saved.forge)){
   data={version:1,library:saved.library.slice(0,LIMIT),forge:saved.forge.slice(0,LIMIT),
    secrets:Array.isArray(saved.secrets)?saved.secrets.slice(0,40):[]};
  }
 }catch{}
 const persist=()=>{try{storage?.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}};
 const list=kind=>[...(data[kind]||[])];
 const validate=(kind,record)=>{
  const cats=kind==='library'?LIBRARY_TYPES:FORGE_TYPES;
  const title=str(record.title,100).trim();
  if(!title)throw Error('El título es obligatorio');
  return {id:str(record.id||uid(),90),title,
   category:cats.includes(record.category)?record.category:cats[0],body:str(record.body,12000),
   ...(kind==='forge'?{done:record.done===true}:{}),
   created:str(record.created||new Date().toISOString(),32)};
 };
 const write=(kind,record,id=null)=>{
  if(kind!=='library'&&kind!=='forge')throw Error('Colección incorrecta');
  const items=data[kind],index=items.findIndex(x=>x.id===id);
  if(index<0&&items.length>=LIMIT)throw Error('Máximo de '+LIMIT+' entradas');
  const item=validate(kind,{...record,id:id||uid()});
  if(index>=0)items[index]=item;else items.push(item);
  return {item,persisted:persist()};
 };
 const remove=(kind,id)=>{if(!['library','forge'].includes(kind))return false;
  data[kind]=data[kind].filter(x=>x.id!==id);return persist();};
 const discover=x=>{const s=str(x,90);if(!data.secrets.includes(s)){data.secrets.push(s);persist();}};
 const exportJSON=()=>JSON.stringify(data,null,2);
 const importJSON=text=>{
  if(text.length>3000000)throw Error('Archivo de más de 3 MB');
  const raw=JSON.parse(text);
  if(raw.version!==1||!Array.isArray(raw.library)||!Array.isArray(raw.forge))
   throw Error('Respaldo inválido');
  data={version:1,
   library:raw.library.slice(0,LIMIT).map(x=>validate('library',x)),
   forge:raw.forge.slice(0,LIMIT).map(x=>validate('forge',x)),
   secrets:Array.isArray(raw.secrets)?raw.secrets.slice(0,40).map(x=>str(x,90)):[]};
  return persist();
 };
 return {list,write,remove,discover,exportJSON,importJSON};
}
function exhibit3D(T,kind,items){
 const scene=new T.Scene();scene.background=new T.Color(kind==='library'?0x111824:0x190b12);
 const camera=new T.PerspectiveCamera(57,1,.1,180);camera.position.set(0,7,23);camera.lookAt(0,5,0);
 scene.add(new T.HemisphereLight(0xffddba,0x19233b,2.2));
 const lamp=new T.PointLight(kind==='library'?0xffce87:0xff5028,250,90);lamp.position.set(-8,18,8);scene.add(lamp);
 const stone=new T.MeshStandardMaterial({color:kind==='library'?0xd2cbba:0x443037,roughness:.85});
 const gold=new T.MeshStandardMaterial({color:0xc69a58,metalness:.7,roughness:.25});
 const base=new T.Mesh(new T.BoxGeometry(40,1,32),stone);scene.add(base);
 const targets=[];
 const add=(g,mat,x,y,z,parent=scene)=>{
  const mesh=new T.Mesh(g,mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 };
 for(const side of [-1,1]){
  add(new T.CylinderGeometry(.7,.9,14,14),stone,side*14,7,-9);
  add(new T.BoxGeometry(2.5,.8,2.5),gold,side*14,14.5,-9);
 }
 if(kind==='library'){
  const wood=new T.MeshStandardMaterial({color:0x604533,roughness:.9});
  for(let j=0;j<3;j++)add(new T.BoxGeometry(28,.5,3.8),wood,0,2.1+j*4,-11);
  items.slice(0,36).forEach((item,i)=>{
   const spine=new T.MeshStandardMaterial({
    color:new T.Color().setHSL((i*.13+.07)%1,.5,.28+(i%4)*.065),roughness:.7});
   const book=add(new T.BoxGeometry(1.7,2.3+(i%3)*.3,.85),spine,
    -11.1+(i%12)*2.02,3.5+Math.floor(i/12)*4,-10);
   book.userData.id=item.id;targets.push(book);
   add(new T.BoxGeometry(1.38,.08,.86),gold,0,-.4,.01,book);
  });
 }else{
  add(new T.CylinderGeometry(4,4.5,1.8,18),stone,0,1,0);
  items.slice(0,36).forEach((item,i)=>{
   const completed=item.done;
   const metal=new T.MeshStandardMaterial({color:completed?0xffc86e:0x694c73,
    emissive:completed?0xe18a30:0x28153b,emissiveIntensity:completed?.7:.1,
    metalness:completed?.8:.3,roughness:.3});
   const g=new T.Group();g.position.set((i%8-3.5)*3,2.3-Math.floor(i/8)*.1,
    6-Math.floor(i/8)*4);scene.add(g);
   const gem=add(new T.OctahedronGeometry(.95,1),metal,0,0,0,g);
   gem.userData.id=item.id;targets.push(gem);
   if(completed){
    const sword=add(new T.ConeGeometry(.4,3.7,4),metal,0,2.5,0,g);
    sword.rotation.z=Math.PI;add(new T.BoxGeometry(1.9,.19,.5),gold,0,.75,0,g);
   }
  });
 }
 return {scene,camera,targets};
}
export function createRealmActivities(THREE,{storage=globalThis.localStorage}={}){
 const store=createXRStore(storage);
 const root=document.createElement('section');root.id='xr-activity';root.hidden=true;
 root.innerHTML=`<div class="xr-layout" role="dialog" aria-modal="true" aria-labelledby="xr-title">
  <header><p>UNIVERSO XR · EXPLORACIÓN</p><h2 id="xr-title"></h2><button id="xr-close" aria-label="Cerrar">×</button></header>
  <p id="xr-intro"></p><div class="xr-columns">
   <div class="xr-exhibit"><canvas id="xr-canvas" aria-label="Biblioteca o forja tridimensional"></canvas><p>Hacé clic en un libro o artefacto 3D para seleccionarlo.</p></div>
   <div class="xr-editor"><label>Seleccionar<select id="xr-pick"></select></label>
     <label>Título<input maxlength="100" id="xr-name"></label>
     <label>Categoría<select id="xr-cat"></select></label>
     <label>Escrito o descripción<textarea rows="7" maxlength="12000" id="xr-text"></textarea></label>
     <label id="xr-complete-row"><input type="checkbox" id="xr-complete"> Proyecto terminado (crear reliquia)</label>
     <div class="xr-actions"><button id="xr-save">Guardar</button><button id="xr-new">Nuevo</button><button id="xr-delete">Eliminar</button></div>
     <div class="xr-actions"><button id="xr-export">Exportar JSON</button><button id="xr-import-btn">Importar archivos</button></div>
     <input type="file" id="xr-import" accept=".json,.txt,.md,text/plain,application/json" hidden>
     <p role="status" id="xr-feedback"></p><small>Datos guardados únicamente en este navegador. Exportá copias para conservarlos.</small>
   </div></div></div>`;
 document.body.append(root);
 const button=document.createElement('button');button.type='button';button.id='xr-activity-open';
 button.hidden=true;document.body.append(button);
 const el=id=>root.querySelector('#'+id);
 let kind='library',id='',render=null,exhibit=null,ray=null,lastFocus=null;
 const status=(s)=>{el('xr-feedback').textContent=s;};
 function paint(){
  const records=store.list(kind),active=records.find(x=>x.id===id);
  el('xr-pick').replaceChildren(new Option('— Elegí —',''),
   ...records.map(x=>new Option(x.title,x.id)));
  el('xr-pick').value=active?.id||'';
  const categories=kind==='library'?LIBRARY_TYPES:FORGE_TYPES;
  el('xr-cat').replaceChildren(...categories.map(x=>new Option(x,x)));
  el('xr-name').value=active?.title||'';
  el('xr-text').value=active?.body||'';
  el('xr-cat').value=active?.category||categories[0];
  el('xr-complete-row').hidden=kind!=='forge';
  el('xr-complete').checked=active?.done===true;
  el('xr-delete').disabled=!active;
  if(!render)return;
  if(exhibit)exhibit.scene.traverse(o=>{
   o.geometry?.dispose?.();
   if(o.material){const arr=Array.isArray(o.material)?o.material:[o.material];arr.forEach(m=>m.dispose?.());}
  });
  exhibit=exhibit3D(THREE,kind,records);
  const canvas=el('xr-canvas');const w=canvas.clientWidth||550,h=canvas.clientHeight||350;
  exhibit.camera.aspect=w/h;exhibit.camera.updateProjectionMatrix();
  render.setSize(w,h,false);render.render(exhibit.scene,exhibit.camera);
 }
 function open(mode){
  kind=mode==='forge'?'forge':'library';id='';lastFocus=document.activeElement;root.hidden=false;
  el('xr-title').textContent=kind==='library'?'Santuario del Conocimiento':'La Forja de la Creación';
  el('xr-intro').textContent=kind==='library'?
   'Entrá a la biblioteca celestial, seleccioná libros 3D y guardá reflexiones, filosofía, mitología y relatos.':
   'Guardá proyectos, ideas, objetivos y desafíos. Al completar un proyecto se transforma en una reliquia 3D.';
  if(!render){
   try{
    render=new THREE.WebGLRenderer({canvas:el('xr-canvas'),antialias:true});
    render.setPixelRatio(Math.min(devicePixelRatio,1.4));
    render.outputColorSpace=THREE.SRGBColorSpace;ray=new THREE.Raycaster();
   }catch{status('Vista 3D no disponible: usá el selector de elementos.');}
  }
  paint();document.body.classList.add('xr-activity-open');el('xr-close').focus();
 }
 function close(){root.hidden=true;document.body.classList.remove('xr-activity-open');lastFocus?.focus?.();}
 el('xr-close').addEventListener('click',close);
 button.addEventListener('click',()=>open(button.dataset.kind));
 el('xr-pick').addEventListener('change',e=>{id=e.target.value;paint();});
 el('xr-new').addEventListener('click',()=>{id='';paint();});
 el('xr-save').addEventListener('click',()=>{
  try{
   const res=store.write(kind,{title:el('xr-name').value,body:el('xr-text').value,
    category:el('xr-cat').value,done:el('xr-complete').checked},id);
   id=res.item.id;paint();status(res.persisted?'Guardado localmente.':'Almacenamiento bloqueado: exportá JSON.');
  }catch(e){status(e.message);}
 });
 el('xr-delete').addEventListener('click',()=>{
  if(!id||!confirm('¿Eliminar este elemento de este navegador?'))return;
  store.remove(kind,id);id='';paint();status('Eliminado.');
 });
 el('xr-export').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob([store.exportJSON()],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='universo-xr-respaldo.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);status('Respaldo descargado.');
 });
 el('xr-import-btn').addEventListener('click',()=>el('xr-import').click());
 el('xr-import').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   if(file.size>3e6)throw Error('Archivo mayor que 3 MB');
   const txt=await file.text();
   if(file.name.toLowerCase().endsWith('.json')){
    if(!confirm('¿Reemplazar la biblioteca y la forja actuales con el respaldo?'))return;
    const persisted=store.importJSON(txt);id='';paint();status(persisted?'Respaldo importado.':'Importado, pero no se pudo guardar.');
   }else if(kind==='library'){
    const v=store.write('library',{title:file.name.replace(/\.(md|txt)$/i,''),
     category:'Libros y documentos',body:txt.slice(0,12000)});
    id=v.item.id;paint();status('Documento de texto incorporado.');
   }else status('Los documentos .txt/.md se importan desde el Santuario.');
  }catch(err){status('Error al importar: '+err.message);}
  finally{e.target.value='';}
 });
 el('xr-canvas').addEventListener('pointerdown',e=>{
  if(!ray||!exhibit)return;
  const r=e.target.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,
   1-(e.clientY-r.top)/r.height*2),exhibit.camera);
  const hit=ray.intersectObjects(exhibit.targets)[0];
  if(hit?.object.userData.id){id=hit.object.userData.id;paint();status('Seleccionado desde la sala 3D.');}
 });
 root.addEventListener('keydown',e=>{
  if(e.key==='Escape'){close();return;}
  if(e.key!=='Tab')return;
  const focus=[...root.querySelectorAll('button,select,input:not([hidden]),textarea')]
   .filter(x=>!x.disabled&&x.getClientRects().length);
  if(e.shiftKey&&document.activeElement===focus[0]){e.preventDefault();focus.at(-1).focus();}
  else if(!e.shiftKey&&document.activeElement===focus.at(-1)){e.preventDefault();focus[0].focus();}
 });
 function update(t){
  if(root.hidden||!render||!exhibit)return;
  const canvas=el('xr-canvas');const w=canvas.clientWidth||550,h=canvas.clientHeight||350;
  exhibit.camera.aspect=w/h;exhibit.camera.updateProjectionMatrix();render.setSize(w,h,false);
  exhibit.scene.rotation.y=Math.sin(t*.1)*.008;render.render(exhibit.scene,exhibit.camera);
 }
 function showButton(level,sequence,stop,f=0){
  // Evita duplicar el botón principal de la tarjeta de parada de Kuro.
  // El acceso adicional solo aparece después de que la nave despega.
  const near=sequence.zone==='dimensions'&&[0,1].includes(level)&&
    !stop?.visible&&f>.72&&f<.90&&!document.body.classList.contains('is-teleporting');
  button.hidden=!near||!root.hidden;button.dataset.kind=level===0?'library':'forge';
  button.textContent=level===0?'Entrar al Santuario del Conocimiento':'Entrar a la Forja de la Creación';
 }
 return {store,open,close,update,showButton,isOpen:()=>!root.hidden};
}
