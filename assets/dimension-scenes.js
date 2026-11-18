import { makeLandscape } from './dimensional-landscapes.js?v=clouds-8';

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
    const side = level % 2 ? 1 : -1;
    const theme = dimensions[level];
    // Plataforma de aterrizaje al lado del portal, con rampa y luces de
    // señalización. Kuro baja aquí y camina hasta el marco.
    const station=new THREE.Group();
    room.add(station);
    station.name='Estación y plataforma del portal';
    const stone=new THREE.MeshStandardMaterial({
      color:level===0?0xd7cfbc:level===1?0x221720:level===2?0x252038:0x152e37,
      roughness:level===0?.82:.95,metalness:.08
    });
    const metal=new THREE.MeshStandardMaterial({
      color:level===0?0xffdb9b:theme.color,
      emissive:theme.color,emissiveIntensity:.5,
      metalness:.48,roughness:.34
    });
    const platform=new THREE.Mesh(new THREE.CylinderGeometry(15,16,2,40),stone);
    platform.position.set(side*17,-5.6,-112);
    platform.receiveShadow=true;
    station.add(platform);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(12.5,.13,8,64),metal);
    ring.rotation.x=-Math.PI/2;
    ring.position.set(side*17,-4.53,-112);
    station.add(ring);
    const path=new THREE.Mesh(new THREE.BoxGeometry(5,.36,19),stone);
    path.position.set(side*13,-5.45,-104);
    station.add(path);
    for(let i=0;i<6;i++){
      const x=side*(9+i%2*8),z=-98-(i/2|0)*6;
      const light=new THREE.Mesh(new THREE.SphereGeometry(.23,10,8),metal);
      light.position.set(x,-4.75,z);
      station.add(light);
    }
    // Los portales siguen existiendo como puntos de interés a un lado del paisaje.
    // Viajar entre dimensiones se hace exclusivamente desde la consola de la nave.
    portalSystem.add({
      color: theme.color,
      x: side * 21, y: 3.5, z: -112,
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
