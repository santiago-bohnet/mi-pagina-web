import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalTour } from '../assets/portal-tour.js';
import { journeyAt } from '../assets/journey-motion.js';

test('Kuro aparca, presenta el portal, permite entrar o seguir y vuelve a embarcar',()=>{
  const events={};
  const classNames=new Set();
  const createNode=()=>({
    hidden:true,textContent:'',dataset:{},style:{},handlers:{},
    addEventListener(name,handler){this.handlers[name]=handler},
    click(){this.clicked=(this.clicked||0)+1},
    getBoundingClientRect(){return {top:0}}
  });
  const names=['portal-stop','portal-stop-title','portal-stop-text',
    'portal-stop-hint','portal-stop-enter','portal-stop-continue'];
  const elements=Object.fromEntries(names.map(name=>[name,createNode()]));
  let jumped=null;
  const stages=Array.from({length:4},(_,level)=>({
    getBoundingClientRect(){return {top:level*7200}},
    offsetHeight:7200
  }));
  const portal=createNode();
  const original={document:globalThis.document,window:globalThis.window,
    scrollY:globalThis.scrollY,matchMedia:globalThis.matchMedia};
  globalThis.document={
    body:{classList:{
      toggle(name,enable){if(enable)classNames.add(name);else classNames.delete(name)},
      remove(name){classNames.delete(name)}
    }},
    querySelector(selector){return selector==='[data-dimension="0"]'?portal:null},
    getElementById(id){
      if(id.startsWith('tunel-'))return stages[Number(id.at(-1))];
      return elements[id];
    }
  };
  globalThis.scrollY=0;
  globalThis.matchMedia=()=>({matches:true});
  globalThis.window={scrollTo(arg){jumped=arg}};
  try{
    const tour=createPortalTour();
    const world=Array.from({length:4},(_,i)=>({top:i*7200,height:7200}));
    const state=f=>journeyAt({scroll:7200*f,stages:world,viewportHeight:1000});
    tour.update(state(.2),'dimensions');
    assert.equal(elements['portal-stop'].hidden,true);
    tour.update(state(.4),'dimensions');
    assert.equal(elements['portal-stop'].hidden,false);
    assert.match(elements['portal-stop-hint'].textContent,/aterriz/);
    tour.update(state(.51),'dimensions');
    assert.equal(elements['portal-stop'].hidden,false);
    assert.match(elements['portal-stop-title'].textContent,/Portal de la Luz/);
    assert.equal(elements['portal-stop-enter'].hidden,false);
    assert.equal(elements['portal-stop-continue'].hidden,false);
    assert.equal(classNames.has('at-portal-stop'),true);
    elements['portal-stop-enter'].handlers.click();
    assert.equal(portal.clicked,1,'Entrar al portal debe abrir la escena existente');
    elements['portal-stop-continue'].handlers.click();
    assert.ok(jumped.top>7200*.64 && jumped.top<7200*.70);
    tour.update(state(.60),'dimensions');
    assert.match(elements['portal-stop-hint'].textContent,/vuelve/);
    assert.equal(elements['portal-stop-enter'].hidden,true);
    tour.update(state(.80),'dimensions');
    assert.equal(elements['portal-stop'].hidden,true);
    assert.equal(classNames.has('at-portal-stop'),false);
    tour.update(state(.52),'dimensions',true);
    assert.equal(elements['portal-stop'].hidden,true,'La entrada en cabina oculta el guía');
  } finally{
    for(const [k,v] of Object.entries(original)){
      if(v===undefined)delete globalThis[k];else globalThis[k]=v;
    }
  }
});
