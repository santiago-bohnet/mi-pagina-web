# Nave de Kuro: recorrido y teletransportes

## Flujo

1. La introducción revela a Kuro y su nave.
2. Después de «Descubrimiento» y «Núcleo», la etapa «Viaje» muestra la nave desde una **Third-Person Follow Camera real**. Kuro y su nave recorren curvas amplias sin volar de costado.

3. Se visita primero Luz. Cada etapa tiene **7,2 pantallas** de recorrido en escritorio (720 svh) y **6,5 pantallas** en móvil (650 svh), más de tres veces la duración anterior. A la mitad la nave reduce velocidad, se acerca a una plataforma junto al portal y queda estacionada. Kuro baja de la nave y camina hacia el portal.
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
- `assets/realistic-environments.js`: relieve de 700 unidades, nubes/bruma en capas, lava animada, mapas minerales procedurales y materiales PBR fotográficos CC0 de Poly Haven (difusa y normal: hasta 2K en escritorio y 1K en móvil). La carga de fotos es opcional: si la red/CDN falla, continúa la textura local. Modo móvil reduce resolución y sombras.
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

La visita al portal abre una **vista temática** dentro del sitio actual, manteniendo la nave estacionada hasta continuar el scroll; no es una dimensión 3D independiente ni un videojuego terminado. Queda pendiente una verificación visual real de WebGL y, para un objetivo fotográfico total, modelos/escaneos de alta resolución de paisajes, ángeles y naves con texturas PBR y revisión de rendimiento.

## Nubes de Luz y visibilidad de Kuro

- `assets/heavenly-cloudscape.js`: sustituye el terreno rocoso y las nubes geométricas de Luz por un mar de nubes de ruido fractal en shader y 85/155 capas de vapor de contornos orgánicos. Todo generado localmente, sin recursos de pago. No son fotografías volumétricas reales, pero mejoran el detalle visual sin exigir una GPU de alta gama.
- `index.html`: al desembarcar Kuro se separa de la jerarquía de la nave, pasa a coordenadas mundiales y se encuadra delante de ella mediante una cámara lateral adelantada.
- `assets/portal-tour.js`: al estar junto a un portal, la rueda de mouse y los gestos táctiles bajan a un 30 % de su velocidad; el resto del sitio mantiene desplazamiento normal y la accesibilidad de movimiento reducido se conserva.
## Ajuste de aterrizaje y oclusión (captura del 18/11/2026)

- La nave flotaba porque el centro de la nave mantenía una elevación local Y=2 pese a que el disco de aterrizaje tiene superficie en Y=-4.6. Ahora el centro desciende a Y=-1.7: con su tren extendido y escala visual, los patines apoyan sobre la plataforma. La zona de aterrizaje es X=±13 y Z=-105, dentro del radio de la plataforma.
- El portal tapaba a Kuro porque la cámara de la parada estaba ubicada detrás del portal (Z=-135), mientras que el gato quedaba del otro lado. Se cambió el encuadre para poner la cámara en Z=-81, Kuro en Z=-100 y el portal en Z=-112. Kuro ahora está adelante de la superficie del portal en la línea de visión, junto al borde frontal del disco.
- El gato desembarcado se muestra a escala mayor para mejorar la lectura de su silueta. El encuadre permite mantener la nave aparcada a un lado y el portal detrás.
- Se añadieron aserciones automáticas de altura de apoyo, posición en el disco y orden de profundidad (cámara → Kuro → portal).

Estas pruebas revisan coordenadas y lógica. Aún debe comprobarse el resultado visual en WebGL con la misma perspectiva de la captura de referencia.

## Reconstrucción cinematográfica de las cuatro dimensiones (18/11/2026)

La referencia técnica es Abyssal Garden (WebGPU, campos fractales, instancing y medición GPU), sin copiar su motor ni abandonar el Three.js actual. Se implementó un módulo de detalle independiente por mundo, con materiales y geometrías reutilizables, generación determinista y cantidad de objetos limitada en móvil.

- **Luz:** océano de nubes con integración óptica de siete capas, contornos fractales orgánicos y hasta 280 bancos de vapor instanciados. Catedrales y piedras blancas flotantes alejadas de la ruta; ángeles con túnicas plegadas, rasgos faciales y alas de plumas por instancias; tonos cálidos y luz ambiente con reducción de sobreexposición. Sin suelo rocoso.
- **Fuego:** cuencas de lava animada, terreno mineral PBR (2K escritorio, 1K móvil), hasta 280 rocas irregulares, agujas de basalto, cuatro volcanes, brasas, ceniza y luces rojizas variables. Zonas de aterrizaje despejadas.
- **Sombras:** antiguas columnas arruinadas, fragmentos caídos, cristales luminosos, campo de relieves oscuros, partículas y bruma violeta. El portal y el camino hacia la plataforma se mantienen libres de obstáculos.
- **Cosmos:** nebulosa 3D fractal en shader propio, campo de asteroides instanciados, planetas de diferentes tamaños y materiales, halos atmosféricos y anillos. Se quitó el suelo plano para que el escenario sea espacio abierto.
- **Rendimiento:** la resolución del render se regula mediante histéresis en ventanas de 110 cuadros: ante FPS sostenidos menores a 38 reduce la escala; tras varios períodos rápidos la recupera. En móvil hay menos objetos, menos resolución y se mantienen desactivadas las sombras dinámicas más costosas.

Para validar: `node --test tests/*.test.mjs` más los `node --check` del flujo CI. Se comprueban geometría procedural, transiciones, aparcamiento, entrada a portales y control de resolución. La revisión visual en un navegador con GPU sigue siendo necesaria; el proyecto representa realismo estilizado de alto detalle, **no** fotorrealismo garantizado a nivel de cine. No se ha convertido a WebGPU ni se ha incorporado un catálogo pesado de modelos 3D externos.

## Nuevas experiencias de las cuatro dimensiones — ampliación

### 1. Reino de la Luz
- Nubes fractales y estratos con viento; aves celestiales que atraviesan el cielo.
- Ángeles en formación en V e individuales, grandes catedrales blancas, escaleras, jardines de flores sobre islas flotantes, cascadas alineadas con las islas y haces solares.
- **Santuario del Conocimiento:** el portal permite entrar en una biblioteca renderizada en Three.js con estantes y libros seleccionables mediante raycasting. Los escritos se clasifican en Reflexiones, Filosofía y cosmovisiones, Mitología e historia, Libros y documentos e Historias de personajes. Es posible crear, leer, editar y borrar libros, e importar archivos .txt/.md.
- La información se guarda en `localStorage` de **ese navegador**, no en Google Drive, GitHub, Supabase ni otros servicios. Hay exportación e importación JSON para respaldos. El contenido por entrada se limita a 12.000 caracteres y el total a 80 por colección. No permite adjuntar PDFs o multimedia de forma nativa.

### 2. Reino del Fuego
- Fortalezas infernales en las montañas, cuatro torres volcánicas, ríos y lagos de lava en movimiento, descargas eléctricas escarlatas, meteoritos, cadenas monumentales, humo, cenizas, dragones y criaturas infernales errantes. El pasillo central y el portal permanecen despejados.
- **Forja de la Creación:** el portal abre una forja tridimensional cuyos artefactos se generan a partir de los proyectos locales. Categorías: Proyectos de software, Proyectos terminados, Ideas, Objetivos y Desafíos. Cada registro tiene título, categoría, descripción y estado. Al marcarlo terminado se convierte en una reliquia luminosa en la escena 3D. La colección puede editarse y respaldarse junto con los libros.
- Los objetos son representaciones procedurales; no hay integración automática con el estado real de proyectos de GitHub.

### 3. Reino de las Sombras
- Bosques oscuros con árboles altos, castillos derruidos, cementerios, ríos negros, bruma, ojos en la oscuridad, luces espectrales, eclipse y una puerta oculta.
- **Misterios:** encuentros que varían en cada visita, textos de Kuro y una puerta secreta interactiva que registra su descubrimiento en el navegador. No requiere usuario. Se puede entrar desde el portal o el botón disponible en la zona de exploración.

### 4. Reino Cósmico
- Nebulosas procedurales, estaciones orbitales, patrullas de naves alienígenas, agujero negro con disco de acreción simulado, gusano espacial, instalaciones de civilizaciones y planetas visitables: Borealis, Umbra y Arca.
- **Pilotaje libre opcional:** al entrar al portal o pulsar Pilotear libremente, cambia el modo de desplazamiento a WASD, flechas, Q/E y controles táctiles. La rueda deja de mover la página mientras se pilota. Se puede seleccionar destinos para navegación asistida por Kuro, o pilotear manualmente y volver al recorrido original. El progreso del scroll permanece intacto.

## Arquitectura de la ampliación
- `assets/realm-extras.js`: detalles decorativos y criaturas de los cuatro biomas, con actualización de animaciones.
- `assets/realm-activities.js`: almacenamiento local versionado, Santuario y Forja, escenas Three.js independientes y selección mediante raycasting.
- `assets/cosmic-pilot.js`: controlador de nave libre, destinos y controles de entrada.
- `assets/shadow-mysteries.js`: eventos variables, puerta secreta y progreso.
- `assets/realm-interactions.css`: UI accesible y responsive.
- `tests/realm-activities.test.mjs`: validación de categorías, persistencia, exportación y navegación.

La prioridad es mantener las experiencias desacopladas del motor de vuelo y preservar el recorrido con Kuro. Sigue pendiente validar visualmente con GPU los cuatro escenarios y ajustar rendimiento/materiales en dispositivos reales. **Los modelos procedurales no sustituyen un pipeline fotorrealista de modelos profesionales con PBR, rigging e iluminación avanzada.**

## Validación de entrega por mundo

- **Luz**: nubes fractales y animación del viento; ángeles volando solos y en grupos de cinco, catedrales de gran escala, cascadas alineadas a islas floridas, haces solares, escalones, fauna ocasional y entrada desde el portal al Santuario tridimensional. Los libros se eligen desde estantes 3D con raycasting, también mediante selector accesible. Escritura/lectura/edición/exportación/importación de texto .txt/.md; sin conexión a servicios externos.
- **Fuego**: volcanes con lago de lava, ríos y mares laterales, rayos, meteoritos, cadenas montañosas, fortalezas, demonios que se desplazan y dragones animados. Entrada desde portal a una forja con proyectos, objetivos, desafíos, ideas y reliquias 3D para proyectos terminados; los estados se modifican manualmente.
- **Sombras**: árboles instanciados, bosques oscuros, cementerio, castillos, lagos, luna eclipsada, luces errantes y misterio cambiante. Una puerta secreta conduce a una sala con geometría 3D y una reliquia; su apertura se anima y queda registrada en navegador.
- **Cosmos**: nebulosas, asteroides, agujero negro estilizado, túnel de gusano, estructuras extraterrestres, patrullas de naves y tres planetas visitables —Borealis, Umbra y Arca— con waypoints y desplazamiento asistido. Modo libre WASD/flechas/QE/controles táctiles, con opción de volver al scroll.

**Privacidad y límites**: el Santuario, la Forja y la exploración de Sombras usan almacenamiento local (`localStorage`) y botón de exportar respaldo JSON. Los escritos no están sincronizados con otros dispositivos ni protegidos por una cuenta. No se adjuntan archivos binarios ni PDFs. La importación JSON reemplaza ambos catálogos después de confirmar. Máximo: 80 entradas por colección y 12.000 caracteres por texto. La calidad visual es una aproximación procedural para navegador y requiere control visual en WebGL para evaluar artefactos; no se afirma fotorrealismo cinematográfico.


## Remodelado de Fuego, Sombras y Cosmos

Fuego incorpora dragones de alas articuladas, cadenas de eslabones ovalados
entrelazados y meteoros con una estela alineada con su trayectoria. Las
calderas y las bases de las plataformas de Fuego y Sombras se ajustan al
relieve. La Forja conserva la colección local de proyectos y añade un taller
de basalto con horno y pedestales. Sombras usa seis variantes de árboles
ramificados mediante instancias. Cosmos incorpora naves de patrulla con
casco biselado, cabina, motores y orientación según el rumbo.

Las mallas de esta revisión son originales y procedurales. Para una siguiente
iteración con escaneos conviene probar [Boulder 01 de Poly Haven](https://polyhaven.com/a/boulder_01)
(Rico Cilliers, modelo CC0 con LOD) y [Tree Bark 03](https://polyhaven.com/a/tree_bark_03)
(material de corteza de Poly Haven). Son referencias evaluadas para esta
revisión y no forman parte de las descargas de la escena.
