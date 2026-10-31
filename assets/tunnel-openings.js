// Openings cut into the existing horizontal rooms. No connecting wall or tube.
export const OPENING = Object.freeze({ radius: 4.3, z: 3.2 });
const stretch = 2.5, corridorEnd = .68;
const stageScale = corridorEnd * stretch + (1 - corridorEnd);
export const TUNNEL = Object.freeze({
  stretch,
  length: 52 * stretch,
  portalOffset: 11 * stretch,
  openingOffset: 14 * stretch,
  corridorEnd,
  corridorShare: corridorEnd * stretch / stageScale,
  stageSvh: 230 * stageScale
});

export function openingsForLevel(level) {
  const side = level % 2 ? 1 : -1;
  return {
    floor: level < 3 ? { x: -side * TUNNEL.openingOffset, ...OPENING } : null,
    ceiling: level > 0 ? { x: side * TUNNEL.openingOffset, ...OPENING } : null
  };
}

export function insideOpening(x, z, opening, margin = 0) {
  return !!opening && (x - opening.x) ** 2 + (z - opening.z) ** 2
    < (opening.radius + margin) ** 2;
}

export function tunnelSurfacePositions(level) {
  const openings = openingsForLevel(level);
  const positions = [];
  const around = 96, radius = 11, halfLength = TUNNEL.length / 2;
  // Preserve detail at the openings without over-tessellating the extended walls.
  const cuts = new Set([-halfLength, halfLength]);
  for (let x = -halfLength; x < halfLength; x += 2) cuts.add(x);
  for (const opening of [openings.floor, openings.ceiling]) {
    if (!opening) continue;
    for (let x = opening.x - 6; x <= opening.x + 6; x += .5) cuts.add(x);
  }
  const spans = [...cuts].sort((a, b) => a - b);
  const point = (x, angle) => [x, Math.cos(angle) * radius, Math.sin(angle) * radius];
  function triangle(a, b, c) {
    const x = (a[0] + b[0] + c[0]) / 3;
    const y = (a[1] + b[1] + c[1]) / 3;
    const z = (a[2] + b[2] + c[2]) / 3;
    if (insideOpening(x, z, y < 0 ? openings.floor : openings.ceiling)) return;
    positions.push(...a, ...b, ...c);
  }
  for (let a = 0; a < spans.length - 1; a++) {
    const x0 = spans[a], x1 = spans[a + 1];
    for (let b = 0; b < around; b++) {
      const angle0 = b * Math.PI * 2 / around, angle1 = (b + 1) * Math.PI * 2 / around;
      const p0 = point(x0, angle0), p1 = point(x1, angle0);
      const p2 = point(x0, angle1), p3 = point(x1, angle1);
      triangle(p0, p2, p1);
      triangle(p1, p2, p3);
    }
  }
  return positions;
}

export function createOpenTunnel(THREE, level, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(tunnelSurfacePositions(level), 3));
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

export function addOpeningEdge(THREE, parent, opening, y, color) {
  const points = [];
  for (let i = 0; i < 64; i++) {
    const angle = i * Math.PI * 2 / 64;
    const radius = opening.radius + Math.sin(angle * 7) * 0.10;
    const x = opening.x + Math.cos(angle) * radius;
    const z = opening.z + Math.sin(angle) * radius;
    // Follow the room's curved floor; this lip exists only at the opening.
    const floorY = -Math.sqrt(11 ** 2 - z ** 2);
    points.push(new THREE.Vector3(x, y + floorY + .05, z));
  }
  const path = new THREE.CatmullRomCurve3(points, true);
  const rim = new THREE.Mesh(new THREE.TubeGeometry(path, 96, .13, 5, true),
    new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  parent.add(rim);
}
