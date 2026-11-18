import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyAt } from '../assets/journey-motion.js';
import { createShipVoyage } from '../assets/ship-voyage.js';

const stages = [0, 2100, 4200, 6300].map(top => ({ top, height: 2100 }));
const position = (scroll, width = 1200) =>
  journeyAt({ scroll, stages, viewportHeight: 1000, viewportWidth: width });

test('la nave navega cada dimensión sin pozos ni descensos', () => {
  assert.deepEqual([0, 1000, 2200, 4300, 7200].map(x => position(x).level),
    [0, 0, 1, 2, 3]);
  for (let level = 0; level < 4; level++) {
    const state = position(stages[level].top);
    assert.equal(state.fall, 0);
    assert.equal(state.y, -32 * level - 1);
    assert.ok(Number.isFinite(state.x));
  }
  assert.ok(Number.isFinite(position(2200, 390).x));
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
        return id.startsWith('tunel-') ? { offsetTop: Number(id.at(-1)) * 2100 } : elements[id];
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
    voyage.update({ zone: 'dimensions' }, { level: 0 });
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
    assert.equal(scroll, 2100);
    level = 1;
    animate(4200);
    assert.equal(voyage.read().active, false);
    assert.equal(elements['teleport-cockpit'].hidden, true);
    assert.equal(elements['teleport-next'].disabled, false);
    voyage.update({ zone: 'dimensions' }, { level: 1 });
    assert.equal(elements['ship-next'].textContent, 'Sombra');
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
