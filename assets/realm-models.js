// Mallas y materiales compartidos por el paisaje. Los ejes de vuelo se
// mantienen en espacio local para que alas, luces y estelas sigan al vehículo.
function styledTube(T, points, radii, steps, sides) {
  const curve = new T.CatmullRomCurve3(points.map(point => new T.Vector3(...point)));
  const geometry = new T.TubeGeometry(curve, steps, 1, sides, false);
  const positions = geometry.attributes.position;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const center = curve.getPointAt(t);
    const ratio = t * (radii.length - 1);
    const k = Math.min(radii.length - 2, Math.floor(ratio));
    const radius = T.MathUtils.lerp(radii[k], radii[k + 1], ratio - k);
    for (let j = 0; j <= sides; j++) {
      const v = i * (sides + 1) + j;
      positions.setXYZ(v, center.x + (positions.getX(v) - center.x) * radius,
        center.y + (positions.getY(v) - center.y) * radius,
        center.z + (positions.getZ(v) - center.z) * radius);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function chainGeometry(T) {
  // Samples around the stadium profile include straight rails.
  const end = .84;
  const rail = [];
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i <= 12; i++) {
      const a = (side * 12 + i) * Math.PI / 12;
      rail.push(new T.Vector3(Math.cos(a) * end, Math.sin(a) * end + (side ? -end : end), 0));
    }
  }
  const curve = new T.CatmullRomCurve3(rail, true, 'centripetal');
  return new T.TubeGeometry(curve, 40, .23, 8, true);
}

export function fracturedRock(T, seed = 0) {
  const geometry = new T.IcosahedronGeometry(1, 3);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const bump = 1 + .18 * Math.sin(x * 8 + z * 3 + seed) *
      Math.cos(y * 8 - z * 5) + .09 * Math.sin((x + y - z) * 19 + seed);
    p.setXYZ(i, x * bump * .82, y * bump * 1.13, z * bump);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createMeteorTail(T) {
  const material = new T.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        float d = vUv.y;
        float wave = sin(d * 24. - uTime * 8.) * d * .13;
        float width = mix(.17, .43, d);
        float edge = abs(vUv.x - .5 + wave) / width;
        float body = (1. - smoothstep(.04, 1., edge)) * pow(1. - d, 1.7);
        float flicker = .76 + .24 * sin(d * 70. - uTime * 14. + vUv.x * 12.);
        vec3 heat = mix(vec3(1., .09, .006), vec3(1., .66, .19), body);
        gl_FragColor = vec4(heat, body * flicker * .70);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending
  });
  const geometry = new T.PlaneGeometry(10, 24);
  geometry.translate(0, 12, 0);
  return { geometry, material };
}

export function createDragonKit(T, skin, eye) {
  const membrane = new T.MeshStandardMaterial({
    color: 0x4e1a1e, emissive: 0x391013, emissiveIntensity: .28,
    roughness: .85, side: T.DoubleSide
  });
  const horn = new T.MeshStandardMaterial({ color: 0x44343a, roughness: .7 });
  const scaleGeometry = new T.SphereGeometry(1, 18, 12);
  const body = styledTube(T, [[0,-.1,-4],[0,0,-1],[0,.35,2.5],[0,1.65,4.5],[0,2.2,6]],
    [.62,1.55,1.34,.55,.58], 24, 12);
  const tail = styledTube(T, [[0,-.15,-3.4],[0,-.55,-5.6],[-.65,-.35,-8],[-1.35,.25,-10.5],[-.4,.45,-13.2]],
    [.64,.5,.34,.21,.018], 24, 8);
  const ribs = [
    [[0,0,0],[3,.3,1.3],[6,.9,1.4],[11,.1,-1]],
    [[0,0,0],[3,.3,1.3],[6,.6,.4],[9,-.1,-4.1]],
    [[0,0,0],[3,.3,1.3],[5,.25,-.3],[6.1,-.55,-5.0]],
    [[0,0,0],[2.75,.25,.9],[3,0,-1.1],[3.7,-.75,-4.8]],
    [[0,0,0],[1.35,-.15,-1],[1.1,-.25,-2.2],[.55,-.45,-3.1]]
  ];
  const wingPoints = [], wingIndices = [];
  const span = 12, chord = 5;
  for (let panel = 0; panel < ribs.length - 1; panel++) {
    const a = new T.CatmullRomCurve3(ribs[panel].map(p => new T.Vector3(...p)));
    const b = new T.CatmullRomCurve3(ribs[panel + 1].map(p => new T.Vector3(...p)));
    const p = new T.Vector3(), base = wingPoints.length / 3;
    for (let i = 0; i <= span; i++) {
      const t = (i + .01) / (span + .01), start = a.getPointAt(t), end = b.getPointAt(t);
      for (let j = 0; j <= chord; j++) {
        const u = j / chord, camber = Math.sin(Math.PI * u) * t * t;
        p.copy(start).lerp(end, u);
        wingPoints.push(p.x - camber * .4, p.y + camber * .38, p.z + camber * .85);
        if (i < span && j < chord) {
          const v = base + i * (chord + 1) + j;
          wingIndices.push(v, v + 1, v + chord + 1, v + 1, v + chord + 2, v + chord + 1);
        }
      }
    }
  }
  const wingGeometry = new T.BufferGeometry();
  wingGeometry.setAttribute('position', new T.Float32BufferAttribute(wingPoints, 3));
  wingGeometry.setIndex(wingIndices);
  wingGeometry.computeVertexNormals();
  const bones = ribs.map((rib, i) => styledTube(T, rib,
    i === 0 ? [.46,.35,.24,.04] : [.18,.14,.09,.018], 16, 7));
  const horns = styledTube(T, [[0,0,0],[.22,.42,-.27],[.38,.8,-.72],[.36,.91,-1.23]],
    [.23,.17,.093,.015], 12, 8);
  const leg = styledTube(T, [[0,0,0],[.62,-.72,-.55],[.47,-1.08,-1.55],[.36,-.89,-2.15]],
    [.28,.22,.13,.035], 12, 8);
  return group => {
    const add = (parent, geometry, material, x = 0, y = 0, z = 0) => {
      const mesh = new T.Mesh(geometry, material);
      mesh.position.set(x,y,z);
      parent.add(mesh);
      return mesh;
    };
    add(group, body, skin);
    add(group, tail, skin);
    add(group, scaleGeometry, skin, 0, 2.1, 6.25).scale.set(.75,.53,1.13);
    add(group, scaleGeometry, horn, 0, 1.81, 6.95).scale.set(.48,.22,.81);
    const wings = [];
    for (const side of [-1,1]) {
      const wing = new T.Group();
      wing.position.set(side * .8,.45,1);
      wing.scale.x = side;
      group.add(wing);
      add(wing, wingGeometry, membrane);
      bones.forEach(bone => add(wing, bone, skin));
      wings.push({ wing, side });
      add(group, scaleGeometry, eye, side * .65, 2.25, 6.52).scale.set(.12,.095,.19);
      add(group, horns, horn, side * .47, 2.48, 5.81).scale.x = side;
      for (const z of [-2.15,1.9]) add(group, leg, skin, side * .78,-.5,z).scale.x = side;
    }
    return wings;
  };
}

export function createScoutKit(T, hull, light) {
  const panel = new T.MeshStandardMaterial({ color: 0x202631, roughness: .34, metalness: .68 });
  const shape = new T.Shape();
  shape.moveTo(0, 5.1);
  for (const [x,y] of [[1.45,2.4],[2.1,.6],[4.35,-.9],[4.75,-2.75],
    [3.15,-2.2],[1.38,-3.55],[-1.38,-3.55],[-3.15,-2.2],[-4.75,-2.75],
    [-4.35,-.9],[-2.1,.6],[-1.45,2.4]]) shape.lineTo(x,y);
  shape.closePath();
  const silhouette = new T.ExtrudeGeometry(shape, {
    depth: .51, bevelEnabled: true, bevelSegments: 3, bevelThickness: .25, bevelSize: .21
  });
  silhouette.rotateX(-Math.PI / 2);
  const cockpit = new T.SphereGeometry(1, 16, 12);
  const engine = new T.CylinderGeometry(.56,.74,2.85,12,1);
  engine.rotateX(Math.PI / 2);
  const nozzle = new T.TorusGeometry(.50,.095,6,18);
  const exhaust = new T.CircleGeometry(.44,16);
  const lamp = new T.SphereGeometry(.105,8,6);
  return group => {
    const add = (geometry, material, x, y, z) => {
      const object = new T.Mesh(geometry, material);
      object.position.set(x,y,z);
      group.add(object);
      return object;
    };
    add(silhouette,hull,0,0,0);
    add(cockpit,panel,0,.8,-1.16).scale.set(.79,.48,1.75);
    for (const side of [-1,1]) {
      add(engine,panel,side * 1.33,.24,2.6);
      add(nozzle,hull,side * 1.33,.24,4.07);
      add(exhaust,light,side * 1.33,.24,4.09);
      add(lamp,light,side * 4.12,.22,1.85);
    }
  };
}

export function createTreeGeometry(T, seed, compact) {
  const random = n => {
    const value = Math.sin(seed * 941.6 + n * 71.9) * 43758.5453;
    return value - Math.floor(value);
  };
  const ox = (random(2) - .5) * 2.5;
  const oz = (random(3) - .5) * 2.5;
  const trunk = [[0,-.48,0],[.45,2.2,.3],[.12,5.5,-.25],[ox * .65,8,oz * .45],[ox,10.1,oz]];
  const parts = [styledTube(T, trunk, [.59,.43,.29,.16,.032], 17, 9)];
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4 + seed, dx = Math.cos(a), dz = Math.sin(a);
    parts.push(styledTube(T, [[0,.85,0],[dx*.78,.38,dz*.78],
      [dx*1.7,-.13,dz*1.7],[dx*2.3,-.43,dz*2.3]], [.34,.27,.16,.012], 7, 6));
  }
  for (let i = 0; i < (compact ? 6 : 9); i++) {
    const branchHeight = 2.9 + i * .69 + random(i + 17) * .46;
    const branchAngle = i * 2.39 + seed * .78;
    const spread = (4.7 - i * .36) * (.75 + random(i + 4) * .35);
    const x = Math.cos(branchAngle) * spread, z = Math.sin(branchAngle) * spread;
    const baseX = ox * Math.max(0, branchHeight - 5) / 6;
    const baseZ = oz * Math.max(0, branchHeight - 5) / 6;
    const joint = [baseX + x*.7, branchHeight + 1.04, baseZ + z*.7];
    parts.push(styledTube(T, [[baseX,branchHeight,baseZ],[baseX+x*.35,branchHeight+.42,baseZ+z*.3],
      joint,[baseX+x,branchHeight+1.9,baseZ+z]], [.24,.18,.095,.012], 10, 7));
    for (const side of [-1,1]) {
      parts.push(styledTube(T, [joint,[joint[0]+x*.07+z*.18*side,joint[1]+.75,joint[2]+z*.07-x*.18*side],
        [joint[0]+x*.13+z*.3*side,joint[1]+1.55,joint[2]+z*.13-x*.3*side]], [.09,.046,.008], 6, 5));
    }
  }
  const position = [], normal = [], indices = [];
  for (const part of parts) {
    const offset = position.length / 3;
    for (const value of part.attributes.position.array) position.push(value);
    for (const value of part.attributes.normal.array) normal.push(value);
    for (const index of part.index.array) indices.push(offset + index);
    part.dispose();
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(position, 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute(normal, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function calderaGeometry(T, x, z, radius, height, heightAt, compact) {
  const profile = [[1,-1.8],[.94,-.5],[.84,.09],[.70,.22],[.56,.35],
    [.49,.53],[.38,.70],[.30,.87],[.265,1],[.21,.91],[.15,.78]];
  const segments = compact ? 40 : 64;
  const positions = [], colors = [], indices = [];
  const basalt = new T.Color(0x35282b), ash = new T.Color(0x574148), shade = new T.Color();
  const center = heightAt(x,z);
  for (let ring = 0; ring < profile.length; ring++) {
    const [fraction, elevation] = profile[ring];
    for (let i = 0; i <= segments; i++) {
      const a = 2 * Math.PI * i / segments;
      const r = radius * fraction * (1 + Math.sin(a*5+x)*.09 + Math.cos(a*9-z)*.06);
      const px = Math.cos(a)*r, pz = Math.sin(a)*r*.88;
      const foothill = heightAt(x+px,z+pz);
      const strata = Math.sin(a*13+ring*1.9)*1.6 + Math.cos(a*23-ring)*.9;
      const blend = Math.min(1,(1-fraction)*1.9);
      positions.push(px,ring < 2 ? foothill+elevation :
        T.MathUtils.lerp(foothill,center+height*elevation,blend)+strata*blend,pz);
      shade.copy(basalt).lerp(ash,.34+.16*Math.cos(a*8+ring)+.2*Math.sin(ring*2.1));
      colors.push(shade.r,shade.g,shade.b);
      if (ring < profile.length-1 && i < segments) {
        const v = ring*(segments+1)+i, next = v+segments+1;
        indices.push(v,next,v+1,v+1,next,next+1);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const n = geometry.attributes.normal, seam = new T.Vector3();
  for (let ring = 0; ring < profile.length; ring++) {
    const first = ring*(segments+1), last = first+segments;
    seam.set(n.getX(first)+n.getX(last),n.getY(first)+n.getY(last),n.getZ(first)+n.getZ(last)).normalize();
    n.setXYZ(first,seam.x,seam.y,seam.z);
    n.setXYZ(last,seam.x,seam.y,seam.z);
  }
  return geometry;
}
