# Nave de Kuro: recorrido y teletransportes

## Flujo

1. La introducción revela a Kuro y su nave.
2. Después de «Descubrimiento» y «Núcleo», la etapa «Viaje» muestra la nave desde una **Third-Person Follow Camera real**. Kuro es un objeto independiente en el mundo 3D. La cámara lo sigue centrada por detrás con amortiguación, siempre mirando hacia el horizonte. La nave no gira ni avanza de lado. No está anclado al encuadre.

3. Se visita primero la Dimensión de la luz. Cada dimensión conserva su portal ovalado, que ahora es un punto de observación, **no** un agujero ni un pasaje a otra sala.
4. La consola de navegación permite fijar coordenadas del siguiente destino: Luz → Fuego → Sombras → Cosmos → Luz.
5. Al activar el salto, se muestra una cabina en primera persona: establecimiento de coordenadas → carga del núcleo → salto → estabilización. El desplazamiento a la nueva sala sucede durante la animación.
6. Al terminar, vuelve la vista externa de Kuro y la nave.

## Implementación

- `assets/third-person-follow-camera.js`: cámara perseguidora real con suavizado independiente, orientación de la nave, mirada hacia delante y reposicionamiento instantáneo entre mundos.
- `assets/ship-voyage.js`: máquina de estados temporal, navegación entre etapas, precarga de la siguiente escena.
- `assets/ship-voyage.css`: consola, cabina y efecto de salto; versión de movimiento reducido y responsive.
- `assets/journey-motion.js`: ruta con curvas en S muy suaves (entrada/salida centradas), tangente de vuelo y ligero alabeo. La nave nunca se desplaza de costado.
- `assets/dimension-scenes.js`: gestiona paisajes abiertos y sus portales escénicos, sin tubos ni paredes.
- `assets/dimensional-landscapes.js`: cielo con dispersión solar y halo, ángeles con brazos, rostro, alas y plumas más detalladas; volumetría de ceniza en el volcán.
- `assets/realistic-environments.js`: terreno con ruido fractal y normales suaves, mapas minerales procedurales, nubes/bruma en capas y lava animada con flujo; calidad adaptativa para móviles.
- `index.html`: tono cinematográfico ACES, salida sRGB, y sombras suaves en pantallas con mayor capacidad.
- `assets/kuro-guide.js`: diálogo de Kuro en vuelo y en cada dimensión.

## Comprobación

Ejecutar `node --test tests/*.test.mjs` con Node 22 o superior.

En navegador: comprobar que la nave se mueve por coordenadas 3D reales y que la cámara la persigue desde atrás con cierto retraso. Probar la introducción, el vuelo, la consola, cada salto, el regreso de Cosmos a Luz, abrir/cerrar el visor de un portal, el uso con teclado y el modo `prefers-reduced-motion`. También probar con WebGL deshabilitado: la consola y los teletransportes siguen disponibles.

## Alcance del cambio

Las coordenadas son ficticias y sirven para la narrativa. No se usa geolocalización. No se requieren servicios, API ni base de datos. Los cambios están aislados en una rama y en una vista previa separada de GitHub Pages; la página principal permanece intacta.

## Realismo y límites

Se mejoraron materiales, geometría, profundidad atmosférica e iluminación, pero sigue siendo un entorno **3D procedural para navegador**. No equivale al fotorrealismo de escaneos 3D, personajes profesionales con rigging, texturas PBR 4K, HDRI y postprocesado de un videojuego AAA. La prueba automatizada verifica la lógica y la sintaxis, no la calidad final de renderizado con WebGL; esa revisión visual sigue siendo necesaria en dispositivos reales.
