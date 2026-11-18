import { TUNNEL, createOpenTunnel } from './tunnel-openings.js?v=ship-voyage-1';

// Una sala por dimensión. La nave salta a la sala siguiente mediante coordenadas.
export function createDimensionScenes(THREE, parent, portalSystem, buttons, dimensions, onError, onReady = () => {}) {
  const rooms = [], pending = [];
  let queue = Promise.resolve();
  const afterPaint = () => new Promise(resolve => requestAnimationFrame(resolve));
  const geometries = {
    arch: new THREE.TorusGeometry(10.7, .13, 6, 40),
    marble: new THREE.CylinderGeometry(.35, .55, 14, 12),
    stone: new THREE.CylinderGeometry(.35, .55, 14, 5),
    lava: new THREE.BoxGeometry(2, .045, .25),
    crystal: new THREE.OctahedronGeometry(.6, 0)
  };
  const transform = new THREE.Object3D();

  function instances(room, geometry, material, entries) {
    if (!entries.length) return;
    const item = new THREE.InstancedMesh(geometry, material, entries.length);
    entries.forEach((position, i) => {
      transform.position.set(position.x, position.y, position.z);
      transform.rotation.set(0, position.ry || 0, 0);
      transform.scale.set(1, position.sy || 1, 1);
      transform.updateMatrix();
      item.setMatrixAt(i, transform.matrix);
    });
    item.instanceMatrix.needsUpdate = true;
    room.add(item);
  }

  async function build(level) {
    // Conserva la carga progresiva para evitar congelar la introducción.
    await afterPaint();
    const room = new THREE.Group();
    room.visible = false;
    parent.add(room);
    const y = -level * 32;
    const side = level % 2 ? 1 : -1;
    const theme = dimensions[level];
    const rock = new THREE.MeshStandardMaterial({
      color: level === 0 ? 0x807b70 : 0x191521,
      roughness: .92, side: THREE.BackSide
    });
    const hall = createOpenTunnel(THREE, level, rock);
    hall.position.y = y;
    room.add(hall);
    await afterPaint();
    const energy = new THREE.MeshStandardMaterial({
      color: theme.color, emissive: theme.color, emissiveIntensity: .6,
      metalness: .45, roughness: .4
    });
    const arches = [], pillars = [], lava = [], crystals = [];
    for (let x = -TUNNEL.length / 2 + 5; x <= TUNNEL.length / 2 - 5; x += 6)
      arches.push({ x, y, z: 0, ry: Math.PI / 2 });
    for (let a = 0; a < Math.ceil((TUNNEL.length - 4) / 3.7); a++) {
      const x = -TUNNEL.length / 2 + 2 + a * 3.7;
      pillars.push({ x, y, z: -8 });
      if (level === 1) lava.push({ x, y: y - 8, z: 1 + Math.sin(a) * 3, ry: a });
      if (level >= 2) crystals.push({ x, y: y - 5 + Math.sin(a) * 3, z: -5, sy: 2 });
    }
    instances(room, geometries.arch, energy, arches);
    instances(room, level === 0 ? geometries.marble : geometries.stone,
      new THREE.MeshStandardMaterial({
        color: level === 0 ? 0xb9b4a6 : 0x33283d, roughness: .8
      }), pillars);
    instances(room, geometries.lava, energy, lava);
    instances(room, geometries.crystal, energy, crystals);
    portalSystem.add({
      color: theme.color, x: side * TUNNEL.portalOffset, y: y - 2.4, z: -5.8,
      inferno: theme.theme === 'fire', light: theme.theme === 'light',
      button: buttons[level], parent: room, index: level
    });
    rooms[level] = room;
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

  function update(state, entry) {
    if (!state.active) return;
    prepare(state.level).catch(() => {});
    if (state.f > .50) prepare(state.level + 1).catch(() => {});
    rooms.forEach((room, i) => {
      if (room) room.visible = entry > .001 && i === state.level;
    });
  }
  return { prepare, update };
}
