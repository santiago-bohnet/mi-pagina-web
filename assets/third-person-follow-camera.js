// Third-Person Follow Camera: sigue a la NAVE en coordenadas del mundo 3D.
// No pega la nave al viewport. La cámara persigue su posición y su orientación.
export function createThirdPersonFollowCamera(THREE) {
  const position = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const desiredLookAt = new THREE.Vector3();
  let initialized = false;
  let lastLevel = -1;

  function update({
    ship, dt = 1 / 60, level = 0,
    pointerX = 0, pointerY = 0, compact = false,
    snap = false, reduced = false
  }) {
    // Coordenadas locales: -Z detrás de la nave, +Z hacia su morro.
    // El desplazamiento de hombro permite ver a Kuro y el destino a la vez.
    const shoulder = (compact ? 0.9 : 2.5) + pointerX * (compact ? .55 : 1.1);
    const height = (compact ? 3.1 : 3.7) - pointerY * .7;
    const distance = compact ? 13.2 : 15;
    desiredPosition.set(shoulder, height, -distance)
      .applyQuaternion(ship.quaternion).add(ship.position);
    desiredLookAt.set(0, 1.0, 3.8)
      .applyQuaternion(ship.quaternion).add(ship.position);

    // Salto entre dimensiones: no atravesamos paredes con la cámara persiguiendo
    // lentamente una posición de la dimensión anterior.
    if (!initialized || snap || lastLevel !== level || reduced) {
      position.copy(desiredPosition);
      lookAt.copy(desiredLookAt);
      initialized = true;
    } else {
      const step = Math.max(0, Math.min(dt, .1));
      const follow = 1 - Math.exp(-4.7 * step);
      const focus = 1 - Math.exp(-8.2 * step);
      position.lerp(desiredPosition, follow);
      lookAt.lerp(desiredLookAt, focus);
    }
    lastLevel = level;
    return { position, lookAt };
  }

  function reset() {
    initialized = false;
    lastLevel = -1;
  }

  return { update, reset };
}
