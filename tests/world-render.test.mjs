import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderQualityController } from '../assets/quality-controller.js';

test('reduce resolución con caída sostenida a 30 fps',()=>{
  const calls=[];
  const renderer={setPixelRatio(r){calls.push(r)},setSize(){}};
  const quality=createRenderQualityController(renderer,{
    width:()=>1280,height:()=>720,pixelRatio:()=>2,mobile:()=>false
  });
  const before=quality.state().ratio;
  for(let i=0;i<330;i++)quality.update(1/30,i/30);
  assert.ok(quality.state().ratio<before);
  assert.ok(calls.length>=2);
});

test('respetar movimiento reducido y límite móvil',()=>{
  const renderer={setPixelRatio(){},setSize(){}};
  const quality=createRenderQualityController(renderer,{
    width:()=>390,height:()=>800,pixelRatio:()=>2,mobile:()=>true,reduced:true
  });
  const before=quality.state().ratio;
  for(let i=0;i<660;i++)quality.update(1/12,i/12);
  assert.equal(quality.state().ratio,before);
  assert.ok(before<=1.12);
});

test('todos los mundos tienen su detalle, plataforma despejada y geometría instanciada',()=>{
  const details=readFileSync(new URL('../assets/world-cinematics.js',import.meta.url),'utf8');
  for(const name of ['makeCloudCitadels','makeInferno','makeShadow','makeCosmos',
    'addAmbientParticles','portalExclusion']){
    assert.ok(details.includes('function '+name+'('),name);
  }
  assert.ok(details.includes('InstancedMesh'));
  assert.ok(details.includes('ShaderMaterial'));
  const landscapes=readFileSync(new URL('../assets/dimensional-landscapes.js',import.meta.url),'utf8');
  assert.ok(landscapes.includes('addCinematicWorldDetails(THREE,group,level'));
  assert.ok(landscapes.includes('createAngelFlock(THREE,group'));
  assert.ok(landscapes.includes('if(level===1||level===2)'), 
    'Ni Luz ni Cosmos deben mostrar piso rocoso');
});

test('Luz genera un mar de nubes multicapa y no círculos tipo sprite',()=>{
  const sky=readFileSync(new URL('../assets/heavenly-cloudscape.js',import.meta.url),'utf8');
  assert.ok(sky.includes('for(int k=0;k<7;k++)'));
  assert.ok(sky.includes('InstancedMesh'));
  assert.ok(!sky.includes('new THREE.Sprite('));
});

test('la documentación explica visuales, funcionamiento y límites',()=>{
  const doc=readFileSync(new URL('../docs/nave-kuro-teletransportes.md',import.meta.url),'utf8');
  for(const token of ['Luz','Fuego','Sombras','Cosmos','WebGL'])
    assert.ok(doc.includes(token));
});
