# Nave de Kuro: recorrido y teletransportes

## Flujo

1. La introducción revela a Kuro y su nave.
2. Después de «Descubrimiento» y «Núcleo», la etapa «Viaje» muestra la nave desde una **Third-Person Follow Camera real**. Kuro y su nave recorren curvas amplias sin volar de costado.

3. Se visita primero Luz. Cada etapa tiene **720 alturas de ventana por 100** (720 svh) en escritorio y 650 svh en móvil, más de tres veces la duración anterior. A la mitad la nave reduce velocidad, se acerca a una plataforma junto al portal y queda estacionada. Kuro baja de la nave y camina hacia el portal.
4. Mientras Kuro presenta el portal, el desplazamiento está dedicado a una pausa: el usuario puede **entrar al portal** para abrir una vista de exploración o **seguir avanzando**. En el segundo caso, Kuro se da vuelta, vuelve a subir y la nave despega con suavidad. El scroll controla las fases sin esperas forzadas ni cambio automático de dimensión.
5. El salto de una dimensión a otra se habilita al completar al menos el 90 % del recorrido, con la consola de navegación: Luz → Fuego → Sombras → Cosmos → Luz.
6. El teletransporte activa la cabina en primera persona: establecimiento de coordenadas → carga del núcleo → salto → estabilización. Después reaparece la nave en tercera persona.

## Implementación

- `assets/third-person-follow-camera.js`: cámara perseguidora real con suavizado independiente, orientación de la nave, mirada hacia delante y reposicionamiento instantáneo entre mundos.
- `assets/ship-voyage.js`: navegación, precarga y bloqueo del salto hasta finalizar el 90 % de la visita.
- `assets/portal-tour.js` y `assets/portal-tour.css`: presentación y controles de la parada; acceso al portal o continuación del vuelo; también disponible en modo sin WebGL.
- `assets/ship-voyage.css`: consola, cabina y efecto de salto; versión de movimiento reducido y responsive.
- `assets/journey-motion.js`: ruta con curvas en S suaves y altitud, frenado progresivo, estacionamiento junto a cada portal, movimiento en plataforma, embarque y despegue al reanudar el scroll. Las fases `landing → disembark → guide → reboard → takeoff` están fijadas por el progreso.
- `assets/dimension-scenes.js`: paisajes extensos con estaciones de aterrizaje, rampa, anillos y luces junto a cada portal.
- `assets/dimensional-landscapes.js`: cielo con dispersión solar y halo, ángeles con brazos, rostro, alas y plumas más detalladas; volumetría de ceniza en el volcán.
- `assets/realistic-environments.js`: relieve de 700 unidades, nubes/bruma en capas, lava animada, mapas minerales procedurales y materiales PBR fotográficos CC0 de Poly Haven (difusa y normal). La carga de fotos es opcional: si la red/CDN falla, continúa la textura local. Modo móvil reduce resolución y sombras.
- `index.html`: tono cinematográfico ACES, salida sRGB, y sombras suaves en pantallas con mayor capacidad.
- `assets/kuro-guide.js`: diálogo de Kuro en vuelo y en cada dimensión.

## Comprobación

Ejecutar `node --test tests/*.test.mjs` con Node 22 o superior.

En navegador: comprobar que la nave se mueve por coordenadas 3D reales y que la cámara la persigue desde atrás con cierto retraso. Probar la introducción, el vuelo, la consola, cada salto, el regreso de Cosmos a Luz, abrir/cerrar el visor de un portal, el uso con teclado y el modo `prefers-reduced-motion`. También probar con WebGL deshabilitado: la consola y los teletransportes siguen disponibles.

## Alcance del cambio

Las coordenadas son ficticias y sirven para la narrativa. No se usa geolocalización. No se requieren servicios, API ni base de datos. Los cambios están aislados en una rama y en una vista previa separada de GitHub Pages; la página principal permanece intacta.

## Realismo y límites

Se mejoraron materiales, geometría, profundidad atmosférica e iluminación, pero sigue siendo un entorno **3D procedural para navegador**. No equivale al fotorrealismo de escaneos 3D, personajes profesionales con rigging, texturas PBR 4K, HDRI y postprocesado de un videojuego AAA. La prueba automatizada verifica la lógica y la sintaxis, no la calidad final de renderizado con WebGL; esa revisión visual sigue siendo necesaria en dispositivos reales.

## Texturas de terceros y rendimiento

Los materiales de roca `rock_path`, `rocky_gravel` y `rock_ground_02` se cargan desde https://dl.polyhaven.org bajo licencia CC0 (https://polyhaven.com/). El proyecto no reexporta las fotografías ni necesita pagos/API. Se comprueban las descargas en el navegador; si no están disponibles, quedan las texturas procedurales. El uso de CDN supone conectividad en la primera visita y la carga aumenta el consumo de memoria de GPU.

La visita al portal abre una **vista temática** dentro del sitio actual; no es una dimensión 3D independiente ni un videojuego terminado. Queda pendiente una verificación visual real de WebGL y, para un objetivo fotográfico total, modelos/escaneos de alta resolución de paisajes, ángeles y naves con texturas PBR y revisión de rendimiento.
