// Control de navegación de la nave. La ruta es local: no necesita servidor.
const clamp = value => Math.max(0, Math.min(1, value));
const ROUTES = Object.freeze([
  'LUX-001 · 042.8 / 007.2 / 001',
  'IGN-002 · 083.4 / 012.9 / 147',
  'UMB-003 · 016.3 / 099.4 / 408',
  'COS-004 · 271.0 / 043.8 / 999'
]);

export function createShipVoyage({ dimensions, currentLevel, prepare, reduced = false }) {
  const consoleEl = document.getElementById('ship-console');
  const currentEl = document.getElementById('ship-current');
  const nextEl = document.getElementById('ship-next');
  const routeEl = document.getElementById('ship-coordinates');
  const button = document.getElementById('teleport-next');
  const cockpit = document.getElementById('teleport-cockpit');
  const destination = document.getElementById('teleport-destination');
  const coordinates = document.getElementById('teleport-coordinates');
  const phaseLabel = document.getElementById('teleport-phase');
  const progressBar = document.getElementById('teleport-progress');
  const cameraMode = document.getElementById('camera-mode');
  const duration = reduced ? 700 : 4100;
  const jumpAt = reduced ? 350 : 2860;
  let transit = null;
  let frameId = 0;
  let displayedLevel = -1;

  function displayRoute(level) {
    if (level === displayedLevel) return;
    displayedLevel = level;
    const target = (level + 1) % dimensions.length;
    currentEl.textContent = dimensions[level].name;
    nextEl.textContent = dimensions[target].name;
    routeEl.textContent = ROUTES[target];
    button.textContent = level === dimensions.length - 1
      ? 'Teletransportar al origen'
      : 'Fijar coordenadas y teletransportar';
    button.setAttribute('aria-label', 'Teletransportar a ' + dimensions[target].name);
  }

  function setPhase(phase, caption) {
    if (cockpit.dataset.phase === phase) return;
    cockpit.dataset.phase = phase;
    phaseLabel.textContent = caption;
  }

  function jumpTo(level) {
    const target = document.getElementById('tunel-' + level);
    if (!target) return;
    // Evita que scroll-behavior:smooth deje visible la dimensión anterior durante el salto.
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, target.offsetTop);
    html.style.scrollBehavior = previous;
  }

  function finish() {
    const target = transit?.to;
    transit = null;
    cockpit.hidden = true;
    cockpit.dataset.phase = '';
    document.body.classList.remove('is-teleporting');
    cameraMode.textContent = 'CÁMARA EXTERIOR · TERCERA PERSONA';
    button.disabled = false;
    displayedLevel = -1;
    if (target !== undefined) displayRoute(target);
    frameId = 0;
  }

  function tick(now) {
    if (!transit) return;
    const elapsed = Math.max(0, now - transit.started);
    const progress = clamp(elapsed / duration);
    transit.progress = progress;
    progressBar.style.width = (progress * 100).toFixed(0) + '%';
    if (elapsed < duration * .25) {
      setPhase('targeting', 'Estableciendo coordenadas de destino…');
    } else if (elapsed < jumpAt) {
      setPhase('charging', 'Núcleo de salto cargando. Ruta confirmada.');
    } else if (elapsed < duration * .83) {
      setPhase('jump', '¡Salto dimensional en curso!');
    } else {
      setPhase('arrival', 'Destino alcanzado. Estabilizando navegación…');
    }
    if (!transit.jumped && elapsed >= jumpAt) {
      transit.jumped = true;
      jumpTo(transit.to);
    }
    if (elapsed >= duration) {
      if (!transit.jumped) jumpTo(transit.to);
      finish();
      return;
    }
    frameId = requestAnimationFrame(tick);
  }

  function begin(from = currentLevel(), to = (from + 1) % dimensions.length) {
    if (transit) return;
    // Precargamos la escena de llegada; un fallo no bloquea la navegación HTML.
    Promise.resolve().then(() => prepare(to)).catch(() => {});
    transit = { from, to, started: performance.now(), jumped: false, progress: 0 };
    cockpit.hidden = false;
    cockpit.dataset.phase = '';
    destination.textContent = dimensions[to].name;
    coordinates.textContent = ROUTES[to];
    progressBar.style.width = '0%';
    document.body.classList.add('is-teleporting');
    cameraMode.textContent = 'CABINA · PRIMERA PERSONA';
    button.disabled = true;
    frameId = requestAnimationFrame(tick);
  }

  function update(sequence, state) {
    if (transit) return;
    const isFlying = sequence.zone === 'flight';
    const isInsideDimensions = sequence.zone === 'dimensions';
    consoleEl.hidden = !isInsideDimensions;
    cameraMode.hidden = !(isFlying || isInsideDimensions);
    if (!isInsideDimensions) {
      displayedLevel = -1;
    } else if (displayedLevel >= 0 && state.level !== displayedLevel) {
      // Scrollear a otra sala también activa la transición; no se pueden saltar
      // dimensiones evitando el teletransporte mediante la rueda o el táctil.
      begin(displayedLevel, state.level);
    } else {
      displayRoute(state.level);
    }
  }

  function read() {
    return transit
      ? { active: true, progress: transit.progress, from: transit.from,
          to: transit.to, jumped: transit.jumped }
      : { active: false, progress: 0, jumped: false };
  }

  button.addEventListener('click', () => begin());
  document.addEventListener('visibilitychange', () => {
    // Si la pestaña queda suspendida durante el viaje, completamos el salto al volver.
    if (!document.hidden && transit && performance.now() - transit.started >= duration) {
      cancelAnimationFrame(frameId);
      jumpTo(transit.to);
      finish();
    }
  });
  return { begin, update, read };
}
