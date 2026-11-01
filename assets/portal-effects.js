// Upright energy vortices. Rotation happens in UV space: the doorway stays vertical.
// The Inferno samples the approved artwork; the other worlds share the same effect.
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uInferno;
  uniform float uLight;
  uniform float uArtworkReady;
  uniform float uHover;
  uniform vec3 uColor;
  uniform sampler2D uArtwork;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 cell = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
               mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float n = 0.0, weight = 0.5;
    for (int i = 0; i < 4; i++) {
      n += weight * noise(p);
      p = p * 2.03 + vec2(5.2, 1.3);
      weight *= 0.5;
    }
    return n;
  }
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float angle = atan(p.y, p.x);
    float clock = uTime * 0.24;
    // Cartesian noise around a rotating polar coordinate avoids an atan seam.
    vec2 swirl = vec2(cos(angle + r * 5.5 - clock), sin(angle + r * 5.5 - clock));
    float turbulence = fbm(swirl * 4.5 + vec2(r * 4.0, -clock));
    float curl = sin(angle * 7.0 + r * 23.0 - clock * 4.0 + turbulence * 7.0);
    float edgeRadius = 0.73 + (turbulence - 0.5) * 0.15;
    float rim = exp(-pow((r - edgeRadius) * 18.0, 2.0));
    float halo = exp(-pow((r - 0.75) * 5.5, 2.0)) * 0.24;
    float strands = pow(max(0.0, curl), 5.0) * smoothstep(0.2, 0.65, r)
                  * (1.0 - smoothstep(0.82, 1.0, r));
    float inward = pow(max(0.0, sin(angle * 4.0 + r * 25.0 - clock * 2.0
                   + turbulence * 3.0)), 7.0) * 0.18;
    inward *= smoothstep(0.1, 0.4, r) * (1.0 - smoothstep(0.6, 0.85, r));
    vec3 hot = mix(uColor, vec3(1.0, 0.91, 0.72), 0.76);
    float energy = rim * (0.6 + turbulence) + strands * 0.65;
    vec3 rgb = uColor * (halo + strands * 0.7 + inward) + hot * energy;
    float alpha = min(1.0, energy + halo * 1.9 + inward);
    float interior = (1.0 - smoothstep(0.52, 0.75, r)) * 0.98;
    rgb = mix(vec3(0.008, 0.003, 0.014) + uColor * inward * 0.6, rgb,
              smoothstep(0.25, 0.76, r));
    alpha = max(alpha, interior);

    if (uInferno > 0.5 && uArtworkReady > 0.5) {
      // Crop with the material, keeping the original source asset unchanged.
      // A tiny tangential displacement moves the flames without rotating the oval.
      vec2 tangent = vec2(-p.y, p.x);
      float edgeMotion = smoothstep(0.36, 0.74, r) * 0.004;
      vec2 drift = tangent * sin(uTime * 0.7 + r * 13.0) * edgeMotion;
      vec2 imageUv = vec2(0.27 + vUv.x * 0.47, 0.10 + vUv.y * 0.90) + drift;
      vec3 art = texture2D(uArtwork, imageUv).rgb;
      float pulse = 1.0 + sin(uTime * 1.4) * 0.025;
      rgb = art * pulse + vec3(1.0, 0.2, 0.02) * strands * 0.08;
      alpha = 1.0 - smoothstep(0.80, 1.0, r);
    }
    // Portal de luz: reinterpretación procedural del arco dorado y la energía ovalada.
    // Sin usar imágenes: filigrana, anillos luminosos, rayos y un interior celestial.
    if (uLight > 0.5) {
      float t = uTime;
      float pulse = 0.94 + 0.06 * sin(t * 1.65);
      vec3 dark = vec3(0.016, 0.013, 0.032);
      vec3 gold = vec3(1.0, 0.63, 0.19);
      vec3 paleGold = vec3(1.0, 0.85, 0.48);
      vec3 ivory = vec3(1.0, 0.98, 0.88);
      vec3 azure = vec3(0.27, 0.62, 0.97);
      float ir = r + 0.009 * sin(angle * 19.0 - t * 0.8) + 0.009 * (turbulence - 0.5);
      float outer = exp(-pow((ir - 0.82) * 39.0, 2.0));
      float outerLine = exp(-pow((ir - 0.88) * 80.0, 2.0));
      float middle = exp(-pow((ir - 0.73) * 48.0, 2.0));
      float inner = exp(-pow((ir - 0.64) * 34.0, 2.0));
      float runeBand = exp(-pow((ir - 0.78) * 50.0, 2.0));
      float rune = pow(max(0.0, sin(angle * 48.0 + sin(angle * 12.0) * 2.0)), 17.0) * runeBand;
      float filigree = pow(max(0.0, sin(angle * 14.0 + ir * 42.0)), 12.0) * runeBand;
      float rotatingArc = pow(max(0.0, sin(angle * 9.0 - t * 0.5 + ir * 22.0 + turbulence * 3.0)), 7.0) * smoothstep(0.40, 0.64, r);
      float energyEdge = (outer * 1.7 + middle * 1.8 + inner * 1.3 + outerLine * 0.95) * pulse;
      float diffuseGlow = exp(-pow((r - 0.76) * 7.0, 2.0)) * 0.6;
      float interior = 1.0 - smoothstep(0.60, 0.70, r);
      // Un paisaje al otro lado del umbral, NO un agujero negro ni un remolino.
      // Cielo azul claro, nubes blancas flotantes, agujas doradas y camino de luz.
      vec2 landscape = p / 0.65;
      float sun = exp(-pow(length((landscape - vec2(0.0, 0.10)) * vec2(1.0, 1.35)) * 2.0, 2.0));
      vec3 sky = mix(vec3(0.43, 0.72, 0.96), vec3(0.91, 0.96, 1.0),
                     clamp(0.53 - landscape.y * 0.34, 0.0, 1.0));
      sky += vec3(1.0, 0.91, 0.72) * sun * 0.50;
      float horizon = exp(-pow((landscape.y + 0.22) * 8.0, 2.0));
      sky = mix(sky, vec3(1.0, 0.96, 0.83), horizon * 0.65);
      float cloudField = fbm(vec2(landscape.x * 3.8 + t * 0.018, landscape.y * 5.1));
      float cloudBands = sin(landscape.x * 7.0 + cloudField * 4.0) * 0.10;
      float clouds = 1.0 - smoothstep(0.12, 0.50,
          abs(landscape.y + 0.48 + cloudBands + cloudField * 0.25));
      clouds *= 0.94;
      sky = mix(sky, vec3(1.0, 0.99, 0.94), clouds);
      // Torres celestiales de diferentes alturas a la distancia, sin geometría adicional.
      float towers = 0.0;
      float highlights = 0.0;
      for (int i = 0; i < 13; i++) {
        float j = float(i);
        float tx = (j - 6.0) * 0.135;
        float distanceFromCenter = abs(tx);
        float height = 0.20 + 0.23 * (1.0 - distanceFromCenter);
        height += 0.11 * sin(j * 4.3);
        float width = 0.016 + 0.013 * (1.0 - distanceFromCenter);
        float spire = smoothstep(width * 0.25, width * 0.95, abs(landscape.x - tx));
        float vertical = 1.0 - smoothstep(-0.18 + height - 0.055, -0.18 + height + 0.06,
                              landscape.y + abs(landscape.x - tx) * 2.2);
        float body = (1.0 - smoothstep(width * 0.74, width, abs(landscape.x - tx))) *
                     smoothstep(-0.48, -0.38, landscape.y) * vertical;
        towers = max(towers, body);
        highlights = max(highlights, body * (1.0 - spire));
      }
      sky = mix(sky, vec3(0.93, 0.88, 0.69), towers * 0.86);
      sky += ivory * highlights * 0.28;
      float beam = exp(-pow(landscape.x * 8.0, 2.0)) * (0.35 + sun);
      sky += ivory * beam * (0.16 + 0.04 * sin(t));
      // Sendero luminoso que converge hacia el horizonte celestial.
      float roadExtent = max(0.0, -landscape.y - 0.20);
      float roadWidth = 0.035 + 0.46 * roadExtent;
      float road = (1.0 - smoothstep(roadWidth * 0.75, roadWidth, abs(landscape.x))) *
                    smoothstep(0.005, 0.08, roadExtent);
      sky = mix(sky, vec3(1.0, 0.91, 0.66), road * 0.75);
      float roadGlint = exp(-pow(landscape.x * (16.0 - 9.0 * roadExtent), 2.0)) * road;
      sky += ivory * roadGlint * 0.6;
      float sparks = pow(max(0.0, sin(p.x * 87.0 + p.y * 51.0 + t * 0.6)
                   * sin(p.y * 97.0 - p.x * 38.0 - t * 0.5)), 30.0);
      rgb = mix(vec3(0.11, 0.17, 0.26), sky, interior);
      rgb += sky * (1.0 - smoothstep(0.6, 0.9, r)) * 0.11;
      rgb += gold * (diffuseGlow * 0.65 + outerLine + filigree * 0.68 + rune * 0.8);
      rgb += paleGold * (outer * 1.0 + rotatingArc * 0.50 + strands * 0.42);
      rgb += ivory * (middle * 1.25 + inner * 1.05 + sparks * 0.32 + energyEdge * 0.56);
      alpha = max(interior * 0.98, clamp(energyEdge + diffuseGlow + rune * 0.7 + rotatingArc * 0.45, 0.0, 1.0));
      // Antialias de la silueta elíptica: el entorno sigue transparente.
      alpha *= 1.0 - smoothstep(0.89, 0.99, r);
    }
    rgb *= 1.0 + uHover * 0.22;
    alpha *= 1.0 - smoothstep(0.92, 1.0, r);
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(rgb, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createPortalSystem(THREE, scene, { reduced = false, onReady = () => {} } = {}) {
  const portals = [];
  const artwork = new THREE.TextureLoader().load(
    new URL('./portal-inferno.webp', import.meta.url).href,
    () => {
      for (const portal of portals) if (portal) portal.material.uniforms.uArtworkReady.value = 1;
      onReady();
    }
  );
  artwork.colorSpace = THREE.SRGBColorSpace;
  const planeGeometry = new THREE.PlaneGeometry(8.8, 13);
  const sparkCount = 180;
  const sparkVertex = `
    attribute float aSeed;
    attribute float aSize;
    uniform float uTime;
    varying float vFade;
    void main() {
      float orbit = aSeed * 6.2831853 + uTime * (0.10 + fract(aSeed * 13.7) * 0.09);
      float life = fract(aSeed * 7.31 + uTime * 0.055);
      float radius = 0.74 + life * 0.30;
      vec3 p = vec3(cos(orbit) * radius * 4.4,
                    sin(orbit) * radius * 6.5,
                    sin(aSeed * 49.0 + uTime * 0.2) * 0.32);
      vec4 view = modelViewMatrix * vec4(p, 1.0);
      vFade = sin(life * 3.1415926) * (0.45 + aSeed * 0.55);
      gl_PointSize = clamp(aSize * 90.0 / max(1.0, -view.z), 1.0, 5.0);
      gl_Position = projectionMatrix * view;
    }
  `;
  const sparkFragment = `
    uniform vec3 uColor;
    varying float vFade;
    void main() {
      float dist = length(gl_PointCoord - 0.5);
      float alpha = (1.0 - smoothstep(0.06, 0.5, dist)) * vFade;
      gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.88, 0.7), 0.4), alpha);
    }
  `;

  function add({ color, x, y, z, inferno = false, light = false, button, parent = scene, index = portals.length }) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    parent.add(group);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uColor: { value: new THREE.Color(color) },
        uInferno: { value: inferno ? 1 : 0 }, uLight: { value: light ? 1 : 0 },
        uArtwork: { value: artwork },
        uArtworkReady: { value: artwork.image ? 1 : 0 },
        uHover: { value: 0 }
      },
      vertexShader, fragmentShader,
      transparent: true, depthWrite: false, side: THREE.DoubleSide
    });
    const surface = new THREE.Mesh(planeGeometry, material);
    group.add(surface);
    const sparkGeometry = new THREE.BufferGeometry();
    const seeds = new Float32Array(sparkCount), sizes = new Float32Array(sparkCount);
    for (let i = 0; i < sparkCount; i++) {
      seeds[i] = (i + 0.5) / sparkCount;
      sizes[i] = 0.18 + ((i * 37) % 101) / 101 * 0.55;
    }
    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sparkCount * 3), 3));
    sparkGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    sparkGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const sparkMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } },
      vertexShader: sparkVertex, fragmentShader: sparkFragment,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
    // The vertex shader supplies positions; CPU bounds would otherwise be empty.
    sparks.frustumCulled = false;
    group.add(sparks);
    portals[index] = { group, material, sparkMaterial, button, light, hover: 0, lastUpdate: 0 };
    return surface;
  }

  const center = new THREE.Vector3(), corner = new THREE.Vector3();
  const halfSize = new THREE.Vector3(4.4, 6.5, 0);
  function update(time, camera, { active, level, f }) {
    const clock = reduced ? 0 : time;
    for (let i = 0; i < portals.length; i++) {
      const portal = portals[i];
      if (!portal) continue;
      portal.material.uniforms.uTime.value = clock;
      portal.sparkMaterial.uniforms.uTime.value = clock;
      // Suave realce visual al apuntar al portal, sin alterar la trayectoria.
      const hovered = !reduced && portal.button.matches(':hover, :focus-visible') && portal.button.style.visibility !== 'hidden';
      const delta = portal.lastUpdate ? Math.min(.05, Math.max(0, time - portal.lastUpdate)) : 1 / 60;
      portal.lastUpdate = time;
      portal.hover += ((hovered ? 1 : 0) - portal.hover) * (reduced ? 1 : 1 - Math.exp(-11 * delta));
      portal.group.scale.setScalar(1 + .035 * portal.hover);
      portal.material.uniforms.uHover.value = portal.hover;
      const available = active && i === level && f < 0.67;
      portal.group.visible = active && Math.abs(i - level) <= 1;
      center.copy(portal.group.position).project(camera);
      corner.copy(portal.group.position).add(halfSize).project(camera);
      const width = Math.abs(corner.x - center.x) * innerWidth;
      const height = Math.abs(corner.y - center.y) * innerHeight;
      const inView = available && center.z > -1 && center.z < 1
                  && Math.abs(center.x) < 1.45 && Math.abs(center.y) < 1.45;
      const button = portal.button;
      button.style.visibility = inView ? 'visible' : 'hidden';
      button.inert = !inView;
      button.setAttribute('aria-hidden', String(!inView));
      if (inView) {
        button.style.width = width + 'px';
        button.style.height = height + 'px';
        button.style.left = ((center.x * 0.5 + 0.5) * innerWidth - width / 2) + 'px';
        button.style.top = ((0.5 - center.y * 0.5) * innerHeight - height / 2) + 'px';
        button.style.opacity = String(1 - Math.max(0, (f - 0.46) / 0.21));
      }
    }
  }
  return { add, update };
}
