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

  function add({ color, x, y, z, inferno = false, button, parent = scene, index = portals.length }) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    parent.add(group);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uColor: { value: new THREE.Color(color) },
        uInferno: { value: inferno ? 1 : 0 }, uArtwork: { value: artwork },
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
    portals[index] = { group, material, sparkMaterial, button, hover: 0, lastUpdate: 0 };
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
