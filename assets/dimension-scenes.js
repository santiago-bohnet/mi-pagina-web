import { OPENING, TUNNEL, openingsForLevel, insideOpening, createOpenTunnel, addOpeningEdge } from './tunnel-openings.js?v=signs-origin';

export function createDimensionScenes(THREE, parent, portalSystem, buttons, dimensions, onError, onReady = () => {}) {
  const rooms = [], pending = [], signs = [];
  let queue = Promise.resolve();
  const afterPaint = () => new Promise(resolve => requestAnimationFrame(resolve));
  const geometries = {
    arch: new THREE.TorusGeometry(10.7, .13, 6, 40),
    marble: new THREE.CylinderGeometry(.35, .55, 14, 12),
    stone: new THREE.CylinderGeometry(.35, .55, 14, 5),
    lava: new THREE.BoxGeometry(2, .045, .25),
    crystal: new THREE.OctahedronGeometry(.6, 0),
    sign: new THREE.PlaneGeometry(2.7, 2.7 * 190 / 140)
  };
  const transform = new THREE.Object3D();
  function instances(room, geometry, material, entries) {
    if (!entries.length) return;
    const mesh = new THREE.InstancedMesh(geometry, material, entries.length);
    entries.forEach((item, i) => {
      transform.position.set(item.x, item.y, item.z);
      transform.rotation.set(0, item.ry || 0, 0);
      transform.scale.set(1, item.sy || 1, 1); transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    room.add(mesh);
  }
  async function build(level) {
    // Give the first Kuro frame a chance to appear before allocating room meshes.
    await afterPaint();
    const room = new THREE.Group(); room.visible = false; parent.add(room);
    const y = -level * 32, side = level % 2 ? 1 : -1, theme = dimensions[level];
    const openings = openingsForLevel(level);
    const rock = new THREE.MeshStandardMaterial({ color: level === 0 ? 0x807b70 : 0x191521,
      roughness: .92, side: THREE.BackSide });
    const hall = createOpenTunnel(THREE, level, rock); hall.position.y = y; room.add(hall);
    await afterPaint();
    const edge = new THREE.MeshStandardMaterial({ color: theme.color, emissive: theme.color,
      emissiveIntensity: .6, metalness: .45, roughness: .4 });
    const arches = [], pillars = [], lava = [], crystals = [];
    for (let x = -TUNNEL.length / 2 + 5; x <= TUNNEL.length / 2 - 5; x += 6) {
      if (![openings.floor, openings.ceiling].some(h => h && Math.abs(x - h.x) < h.radius + .3))
        arches.push({ x, y, z: 0, ry: Math.PI / 2 });
    }
    for (let a = 0; a < Math.ceil((TUNNEL.length - 4) / 3.7); a++) {
      const x = -TUNNEL.length / 2 + 2 + a * 3.7;
      pillars.push({ x, y, z: -8 });
      if (level === 1 && !insideOpening(x, 1 + Math.sin(a) * 3, openings.floor, 1.2))
        lava.push({ x, y: y - 8, z: 1 + Math.sin(a) * 3, ry: a });
      if (level >= 2) crystals.push({ x, y: y - 5 + Math.sin(a) * 3, z: -5, sy: 2 });
    }
    instances(room, geometries.arch, edge, arches);
    instances(room, level === 0 ? geometries.marble : geometries.stone,
      new THREE.MeshStandardMaterial({ color: level === 0 ? 0xb9b4a6 : 0x33283d, roughness: .8 }), pillars);
    instances(room, geometries.lava, edge, lava);
    instances(room, geometries.crystal, edge, crystals);
    await afterPaint();
    if (openings.floor) {
      addOpeningEdge(THREE, room, openings.floor, y, level === 0 ? 0x8b8273 : 0x332a30);
      const link = document.querySelector('#tunel-' + level + ' .dimension-arrow');
      const texture = new THREE.TextureLoader().load(link.querySelector('img').src, onReady);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(geometries.sign, new THREE.MeshBasicMaterial({ map: texture,
        transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      sign.position.set(openings.floor.x, y - 4.5, -2); room.add(sign);
      signs[level] = { sign, link };
    }
    portalSystem.add({ color: theme.color, x: side * TUNNEL.portalOffset, y: y - 2.4, z: -5.8,
      inferno: theme.theme === 'fire', button: buttons[level], parent: room, index: level });
    rooms[level] = room;
  }
  function prepare(level) {
    if (level < 0 || level >= dimensions.length) return Promise.resolve();
    if (!pending[level]) {
      pending[level] = queue.then(() => build(level));
      queue = pending[level].catch(onError);
    }
    return pending[level];
  }
  const projected = new THREE.Vector3(), corner = new THREE.Vector3();
  const halfSign = new THREE.Vector3(1.35, 1.35 * 190 / 140, 0);
  function update(state, entry, camera) {
    prepare(state.level).catch(() => {});
    if (state.f > .30) prepare(state.level + 1).catch(() => {});
    rooms.forEach((room, i) => {
      room.visible = entry > .001 && (i === state.level || (state.fall > 0 && i === state.level + 1));
    });
    signs.forEach(({ sign, link }, level) => {
      projected.copy(sign.position).project(camera);
      corner.copy(sign.position).add(halfSign).project(camera);
      const visible = entry > .001 && level === state.level && state.fall < .5
        && projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 1.25 && Math.abs(projected.y) < 1.25;
      sign.visible = visible; link.style.visibility = visible ? 'visible' : 'hidden'; link.inert = !visible;
      if (!visible) return;
      const width = Math.abs(corner.x - projected.x) * innerWidth;
      const height = Math.abs(corner.y - projected.y) * innerHeight;
      link.style.width = width + 'px'; link.style.height = height + 'px';
      link.style.left = ((projected.x * .5 + .5) * innerWidth - width / 2) + 'px';
      link.style.top = ((.5 - projected.y * .5) * innerHeight - height / 2) + 'px';
    });
  }
  return { prepare, update };
}
