// The earlier floating fragments and Ω core, using shared geometry and one instanced field.
export function createOriginSequence(THREE, scene, reduced) {
  let root, fragments, core, center, materials;
  const seeds = Array.from({ length: 22 }, (_, i) => ({
    x: Math.sin(i * 17.31) * 24,
    y: Math.sin(i * 11.7 + 2) * 13,
    z: -7 - (i % 7) * 5,
    scale: .35 + (i % 6) * .18
  }));
  const transform = new THREE.Object3D();
  function build() {
    root = new THREE.Group(); scene.add(root);
    const fragmentMaterial = new THREE.MeshStandardMaterial({ color: 0x211423, metalness: .6,
      roughness: .3, emissive: 0x491127, emissiveIntensity: .45, transparent: true, depthWrite: false });
    fragments = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1), fragmentMaterial, seeds.length);
    fragments.frustumCulled = false; root.add(fragments);
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x24020b, metalness: .82,
      roughness: .2, emissive: 0xba143b, emissiveIntensity: .85, transparent: true, depthWrite: false });
    core = new THREE.Group(); core.position.set(innerWidth < 700 ? 0 : 12, innerWidth < 700 ? -5 : 0, -18); root.add(core);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(8 + i * 2, .18, 8, 72), ringMaterial);
      ring.rotation.set(i * .6, i * .55, i * .27); core.add(ring);
    }
    const centerMaterial = new THREE.MeshStandardMaterial({ color: 0x11070f, metalness: .7,
      roughness: .25, emissive: 0x941139, emissiveIntensity: .7, wireframe: true, transparent: true, depthWrite: false });
    center = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 1), centerMaterial); core.add(center);
    materials = { fragmentMaterial, ringMaterial, centerMaterial };
  }
  function update(time, sequence, mx, my) {
    if (!root && sequence.progress > .55 && sequence.portalEntry < 1) build();
    if (!root) return;
    const opacity = sequence.entry * (1 - sequence.portalEntry);
    root.visible = opacity > .002;
    if (!root.visible) return;
    const amount = Math.min(1, sequence.nucleus * 2);
    materials.fragmentMaterial.opacity = opacity * (1 - amount * .65);
    materials.ringMaterial.opacity = opacity * amount;
    materials.centerMaterial.opacity = opacity * amount;
    core.visible = amount > .002;
    core.position.x = innerWidth < 700 ? 0 : 12;
    core.position.y = innerWidth < 700 ? -5 : 0;
    core.scale.setScalar(innerWidth < 700 ? .62 : 1);
    core.rotation.set(my * .05 + (reduced ? 0 : Math.sin(time * .13) * .1), mx * .09 + (reduced ? 0 : time * .1), 0);
    center.rotation.y = reduced ? 0 : time * .28;
    seeds.forEach((seed, i) => {
      transform.position.set(seed.x + mx * .8, seed.y + (reduced ? 0 : Math.sin(time * .55 + i) * .35) - my * .6, seed.z);
      transform.rotation.set(i * .4 + (reduced ? 0 : time * .08), i * .3 + (reduced ? 0 : time * .12), 0);
      transform.scale.setScalar(seed.scale); transform.updateMatrix(); fragments.setMatrixAt(i, transform.matrix);
    });
    fragments.instanceMatrix.needsUpdate = true;
  }
  return { update };
}
