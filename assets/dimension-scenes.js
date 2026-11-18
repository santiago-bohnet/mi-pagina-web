import { makeLandscape } from './dimensional-landscapes.js?v=open-worlds-1';

// Escenarios independientes y abiertos: sin paredes laterales ni cilindros.
export function createDimensionScenes(THREE, parent, portalSystem, buttons, dimensions, onError, onReady = () => {}) {
  const rooms = [];
  const pending = [];
  let queue = Promise.resolve();
  const afterPaint = () => new Promise(resolve => requestAnimationFrame(resolve));

  async function build(level) {
    // Construir progresivamente para que la introducción siga siendo fluida.
    await afterPaint();
    const world = makeLandscape(THREE, level, {
      compact: innerWidth < 700,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches
    });
    const room = world.group;
    room.visible = false;
    parent.add(room);
    const side = level % 2 ? -1 : 1;
    const theme = dimensions[level];
    // Los portales siguen existiendo como puntos de interés a un lado del paisaje.
    // Viajar entre dimensiones se hace exclusivamente desde la consola de la nave.
    portalSystem.add({
      color: theme.color,
      x: side * 22, y: 5, z: -83,
      inferno: theme.theme === 'fire',
      light: theme.theme === 'light',
      button: buttons[level],
      parent: room,
      index: level
    });
    rooms[level] = world;
    onReady();
  }

  function prepare(level) {
    if (level < 0 || level >= dimensions.length) return Promise.resolve();
    if (!pending[level]) {
      pending[level] = queue.then(() => build(level));
      queue = pending[level].catch(onError);
    }
    return pending[level];
  }

  function update(state, entry, camera, time = 0, zone = 'dimensions') {
    const visible = entry > .001 && (state.active || zone === 'flight');
    if (!visible) {
      rooms.forEach(room => { if(room) room.group.visible = false; });
      return;
    }
    prepare(state.level).catch(() => {});
    if (state.f > .52) prepare(state.level + 1).catch(() => {});
    rooms.forEach((world, i) => {
      if (!world) return;
      world.group.visible = i === state.level;
      if(world.group.visible) world.update(time);
    });
  }
  return { prepare, update };
}
