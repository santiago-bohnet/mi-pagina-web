import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {createXRStore,LIBRARY_TYPES,FORGE_TYPES} from '../assets/realm-activities.js';
import {COSMIC_WAYPOINTS,createCosmicPilot} from '../assets/cosmic-pilot.js';
function fakeStorage(){
 const data=new Map();
 return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
}
test('el Santuario guarda reflexiones, filosofía, mitología, libros y personajes',()=>{
 assert.equal(LIBRARY_TYPES.length,5);
 const storage=fakeStorage(),s=createXRStore(storage);
 for(const category of LIBRARY_TYPES){
  const {item,persisted}=s.write('library',{title:'Prueba '+category,body:'Una historia propia',category});
  assert.equal(persisted,true);
  assert.equal(item.category,category);
 }
 const copy=s.exportJSON();
 const reloaded=createXRStore(storage);
 assert.equal(reloaded.list('library').length,6);
 assert.match(copy,/Filosofía y cosmovisiones/);
 assert.equal(reloaded.importJSON(copy),true);
 assert.throws(()=>reloaded.importJSON('{}'),/Respaldo inválido/);
});
test('la forja convierte un proyecto terminado en una reliquia persistente',()=>{
 const s=createXRStore(fakeStorage());
 const {item}=s.write('forge',{title:'Sistema de turnos',body:'Web con reservas',category:FORGE_TYPES[0],done:false});
 assert.equal(s.list('forge').length,1);
 const result=s.write('forge',{title:item.title,body:item.body,category:FORGE_TYPES[1],done:true},item.id);
 assert.equal(result.item.done,true);
 assert.equal(s.list('forge')[0].done,true);
 s.remove('forge',item.id);
 assert.equal(s.list('forge').length,0);
});
test('validar capacidad, tamaños y entradas ajenas',()=>{
 const s=createXRStore(fakeStorage());
 assert.throws(()=>s.write('library',{title:'  '}),/título/);
 const v=s.write('forge',{title:'X'.repeat(300),body:'A'.repeat(15000)});
 assert.equal(v.item.title.length,100);
 assert.equal(v.item.body.length,12000);
 assert.equal(s.importJSON(s.exportJSON()),true);
});
test('el cosmos incorpora pilotaje opcional y puntos de navegación distintos',()=>{
 assert.ok(COSMIC_WAYPOINTS.length>=8);
 assert.equal(new Set(COSMIC_WAYPOINTS.map(x=>x.name)).size,5);
 for(const point of COSMIC_WAYPOINTS){
  assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.z));
  assert.ok(point.description);
 }
});
test('los cuatro reinos contienen los puntos de interés y criaturas solicitados',()=>{
 const code=readFileSync(new URL('../assets/realm-extras.js',import.meta.url),'utf8');
 for(const name of ['palace','gardens','waterfalls','sunshafts','heavenlyCreatures',
  'lightning','infernalFortresses','infernalCreatures','meteors',
  'shadowForest','shadowSecrets','cosmicConstructs','enhanceRealm']){
  assert.ok(code.includes('function '+name+'('),name);
 }
 const landscape=readFileSync(new URL('../assets/dimensional-landscapes.js',import.meta.url),'utf8');
 assert.ok(landscape.includes('enhanceRealm(THREE,group,level'));
});
