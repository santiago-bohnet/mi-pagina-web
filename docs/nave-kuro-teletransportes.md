# Nave de Kuro: recorrido y teletransportes

## Flujo

1. La introducción revela a Kuro y su nave.
2. Después de «Descubrimiento» y «Núcleo», la etapa «Viaje» muestra la nave desde una cámara exterior (tercera persona).
3. Se visita primero la Dimensión de la luz. Cada dimensión conserva su portal ovalado, que ahora es un punto de observación, **no** un agujero ni un pasaje a otra sala.
4. La consola de navegación permite fijar coordenadas del siguiente destino: Luz → Fuego → Sombras → Cosmos → Luz.
5. Al activar el salto, se muestra una cabina en primera persona: establecimiento de coordenadas → carga del núcleo → salto → estabilización. El desplazamiento a la nueva sala sucede durante la animación.
6. Al terminar, vuelve la vista externa de Kuro y la nave.

## Implementación

- `assets/ship-voyage.js`: máquina de estados temporal, navegación entre etapas, precarga de la siguiente escena.
- `assets/ship-voyage.css`: consola, cabina y efecto de salto; versión de movimiento reducido y responsive.
- `assets/journey-motion.js`: movimiento lateral por dimensión, sin caída vertical.
- `assets/dimension-scenes.js` y `assets/tunnel-openings.js`: salas estancas, sin aberturas en el suelo ni señalización de pozos.
- `assets/kuro-guide.js`: diálogo de Kuro en vuelo y en cada dimensión.

## Comprobación

Ejecutar `node --test tests/ship-voyage.test.mjs` con Node 22 o superior.

En navegador: probar la introducción, el vuelo, la consola, cada salto, el regreso de Cosmos a Luz, abrir/cerrar el visor de un portal, el uso con teclado y el modo `prefers-reduced-motion`. También probar con WebGL deshabilitado: la consola y los teletransportes siguen disponibles.

## Alcance del cambio

Las coordenadas son ficticias y sirven para la narrativa. No se usa geolocalización. No se requieren servicios, API ni base de datos. Los cambios están aislados en una rama: la versión publicada por GitHub Pages permanece intacta hasta integrar los cambios.
