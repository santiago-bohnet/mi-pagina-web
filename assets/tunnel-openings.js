// Pasillos dimensionales estancos. El traslado entre mundos sucede en la nave,
// sin agujeros, caídas ni conexiones físicas entre habitaciones.
export const TUNNEL = Object.freeze({
  length: 130,
  portalOffset: 27.5,
  travelOffset: 35,
  stageSvh: 210
});

export function createOpenTunnel(THREE, level, material) {
  const geometry = new THREE.CylinderGeometry(11, 11, TUNNEL.length, 56, 2, true);
  // El eje longitudinal del pasillo es X, compatible con los portales existentes.
  geometry.rotateZ(Math.PI / 2);
  return new THREE.Mesh(geometry, material);
}
