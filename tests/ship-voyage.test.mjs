import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyAt, sampleFlightPath, FLIGHT_PATH, PORTAL_STOP } from '../assets/journey-motion.js';
import { createShipVoyage } from '../assets/ship-voyage.js';

const STAGE=7200;
const stages=[0,STAGE,STAGE*2,STAGE*3].map(top=>({top,height:STAGE}));
const position = (scroll, width = 1200) =>
  journeyAt({ scroll, stages, viewportHeight: 1000, viewportWidth: width });

test('las cuatro dimensiones tienen un recorrido largo sin saltos prematuros',()=>{
  assert.deepEqual([0,1900,7400,15000,22500].map(x=>position(x).level),
    [0,0,1,2,3]);
  for(let level=0;level<4;level++){
    const start=position(stages[level].top);
    assert.equal(start.fall,0);
    assert.equal(start.y,-32*level+FLIGHT_PATH.altitude);
    assert.equal(start.z,FLIGHT_PATH.startZ);
    assert.ok(Math.abs(start.x)<.001);
  }
  const early=position(STAGE*.2),approach=position(STAGE*.37);
  const parked=position(STAGE*.5),parkedAgain=position(STAGE*.55);
  const flying=position(STAGE*.80),end=position(STAGE*.96);
  assert.ok(early.z>approach.z);
  assert.equal(parked.stop.phase,'guide');
  assert.equal(parked.stop.out,1);
  assert.ok(Math.abs(parked.z-parkedAgain.z)<.001,'La nave se queda estacionada');
  assert.ok(Math.abs(parked.x-parkedAgain.x)<.001);
  assert.equal(parked.stop.portalX,-PORTAL_STOP.portalX);
  assert.ok(flying.z<parked.z-45,'El vuelo continúa luego de Kuro');
  assert.ok(end.z<FLIGHT_PATH.endZ+10);
  assert.ok(position(STAGE*.43).stop.parked>.999);
  assert.equal(position(STAGE*.53).stop.interactable,true);
  assert.equal(position(STAGE*.60).stop.phase,'reboard');
  assert.equal(position(STAGE*.70).stop.visible,false);
  assert.ok(position(STAGE*.64).stop.out<.001,'Kuro ya volvió a embarcar');
});

test('las curvas son suaves y la nave mira hacia su tangente',()=>{
  const path=sampleFlightPath(.21);
  assert.ok(path.x>3);
  const next=sampleFlightPath(.76);
  assert.ok(next.x< -2);
  for(const p of [.1,.2,.36,.6,.77,.92]){
    const at=sampleFlightPath(p);
    const prev=sampleFlightPath(p-.0005),ahead=sampleFlightPath(p+.0005);
    const unit=Math.hypot(ahead.x-prev.x,ahead.z-prev.z);
    const dot=(Math.sin(at.yaw)*(ahead.x-prev.x)+
      Math.cos(at.yaw)*(ahead.z-prev.z))/unit;
    assert.ok(dot>.995);
    assert.ok(Math.abs(at.bank)<.111);
    assert.ok(Math.abs(at.x)<20);
  }
});

test('teletransporte: fija coordenadas, cambia de sala y vuelve a tercera persona', async () => {
  const ids = ['ship-console', 'ship-current', 'ship-next', 'ship-coordinates',
    'teleport-next', 'teleport-cockpit', 'teleport-destination',
    'teleport-coordinates', 'teleport-phase', 'teleport-progress', 'camera-mode'];
  const createElement = () => ({
    style: {}, dataset: {}, hidden: true, disabled: false, textContent: '',
    handlers: {}, setAttribute() {},
    addEventListener(event, handler) { this.handlers[event] = handler; }
  });
  const elements = Object.fromEntries(ids.map(id => [id, createElement()]));
  let clock = 0, scroll = null, level = 0, warmed = -1;
  const frames = [];
  const globals = {
    document: {
      documentElement: { style: { scrollBehavior: '' } },
      body: { classList: { add() {}, remove() {} } },
      getElementById(id) {
        return id.startsWith('tunel-') ? { offsetTop: Number(id.at(-1)) * STAGE } : elements[id];
      },
      addEventListener() {}
    },
    window: { scrollTo(_x, y) { scroll = y; } },
    performance: { now: () => clock },
    requestAnimationFrame: callback => frames.push(callback),
    cancelAnimationFrame() {}
  };
  const before = Object.fromEntries(Object.keys(globals).map(key => [key, globalThis[key]]));
  Object.assign(globalThis, globals);
  try {
    const voyage = createShipVoyage({
      dimensions: ['Luz', 'Fuego', 'Sombra', 'Cosmos'].map(name => ({ name })),
      currentLevel: () => level,
      prepare: async target => { warmed = target; }
    });
    voyage.update({ zone: 'dimensions' }, { level: 0, f: .20, stop:{visible:false} });
    assert.equal(elements['teleport-next'].disabled,true,'No permite saltarse la visita a Kuro');
    voyage.update({zone:'dimensions'}, {level:0,f:.95,stop:{visible:false}});
    assert.equal(elements['ship-console'].hidden, false);
    assert.equal(elements['ship-next'].textContent, 'Fuego');
    elements['teleport-next'].handlers.click();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(warmed, 1);
    assert.equal(voyage.read().active, true);
    assert.equal(elements['teleport-cockpit'].hidden, false);
    function animate(time) {
      clock = time;
      const callback = frames.shift();
      assert.ok(callback, 'El controlador debe planificar el siguiente cuadro');
      callback(time);
    }
    animate(1100);
    assert.equal(scroll, null);
    animate(2900);
    assert.equal(scroll, STAGE);
    level = 1;
    animate(4200);
    assert.equal(voyage.read().active, false);
    assert.equal(elements['teleport-cockpit'].hidden, true);
    assert.equal(elements['teleport-next'].disabled, false);
    voyage.update({ zone: 'dimensions' }, { level: 1, f: .0, stop:{visible:false} });
    assert.equal(elements['ship-next'].textContent, 'Sombra');
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
