// Cámara centrada detrás de la nave: sin movimiento lateral ni "shoulder view".
export function createThirdPersonFollowCamera(THREE) {
  const position = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const desiredLookAt = new THREE.Vector3();
  let initialized = false;
  let lastLevel = -1;
  function update({ship,dt=1/60,level=0,snap=false,reduced=false,compact=false}) {
    // El morro de la nave es +Z local; gira 180º para volar hacia -Z del mundo.
    // La cámara se coloca en su eje central a distancia constante.
    desiredPosition.set(0,compact?5.2:5.8,-(compact?15:16))
      .applyQuaternion(ship.quaternion).add(ship.position);
    desiredLookAt.set(0,2,21)
      .applyQuaternion(ship.quaternion).add(ship.position);
    if(!initialized || snap || lastLevel!==level || reduced) {
      position.copy(desiredPosition);
      lookAt.copy(desiredLookAt);
      initialized=true;
    } else {
      const step=Math.max(0,Math.min(dt,.1));
      position.lerp(desiredPosition,1-Math.exp(-5.5*step));
      lookAt.lerp(desiredLookAt,1-Math.exp(-8.5*step));
    }
    lastLevel=level;
    return {position,lookAt};
  }
  function reset(){initialized=false;lastLevel=-1;}
  return {update,reset};
}
