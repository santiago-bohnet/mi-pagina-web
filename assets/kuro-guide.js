import { readJourney } from './journey-motion.js?v=signs-origin';

export const DIMENSIONS = Object.freeze([
  { theme: 'light', name: 'Dimensión de la luz', color: '#e2c88d',
    description: 'Esta es la dimensión de la luz. Contiene columnas de piedra clara y destellos dorados.' },
  { theme: 'fire', name: 'Dimensión del fuego', color: '#f45124',
    description: 'Esta es la dimensión del fuego. Contiene roca volcánica, lava y energía escarlata.' },
  { theme: 'shadow', name: 'Dimensión de las sombras', color: '#a17bea',
    description: 'Esta es la dimensión de las sombras. Aquí esperan ruinas antiguas, cristales y secretos.' },
  { theme: 'cosmos', name: 'Dimensión cósmica', color: '#58dfbd',
    description: 'Esta es la dimensión cósmica. Aquí encontrarás estructuras extrañas y energía de otros mundos.' }
]);

export function guideLine({ progress, entry, portalEntry = entry, zone = 'dimensions', level, f, fall }) {
  if (progress < .28) return 'Hola, soy Kuro.';
  if (progress < 1 || zone === 'intro') return 'Seré tu guía. Ven, tengo algo que mostrarte.';
  if (zone === 'exploration') return 'No todo lo que flota está perdido. Aquí comienza nuestro recorrido.';
  if (zone === 'nucleus' && portalEntry < .20) return 'Este es el núcleo Ω, el corazón de nuestro universo.';
  if (portalEntry < .99) return 'Estas son las dimensiones que compartimos mi dueño y yo.';
  if (level === 0 && f < .08) return 'Puedes echar un vistazo.';
  if (fall > 0) return 'Por esta abertura llegamos a la siguiente dimensión. ¡Sígueme!';
  if (level === 3 && f > .94) return 'Puedes volver a explorar las dimensiones subiendo. Yo te acompaño.';
  return DIMENSIONS[level].description;
}

let sequenceLayout;
export function readIntro() {
  if (!sequenceLayout || sequenceLayout.width !== innerWidth || sequenceLayout.height !== innerHeight) {
    const bounds = id => {
      const rect = document.getElementById(id).getBoundingClientRect();
      return { top: rect.top + scrollY, height: rect.height };
    };
    sequenceLayout = { width: innerWidth, height: innerHeight, intro: bounds('despertar'),
      exploration: bounds('explorar'), nucleus: bounds('nucleo'), dimensions: bounds('tunel-0') };
  }
  const clamp = n => Math.max(0, Math.min(1, n));
  const layout = sequenceLayout;
  const length = Math.max(1, layout.intro.height - innerHeight);
  const progress = Math.max(0, Math.min(1, scrollY / length));
  const entry = clamp((scrollY - length) / innerHeight);
  const portalEntry = clamp((scrollY - layout.dimensions.top + innerHeight) / innerHeight);
  const viewportCenter = scrollY + innerHeight * .4;
  const zone = viewportCenter < layout.exploration.top ? 'intro'
    : viewportCenter < layout.nucleus.top ? 'exploration'
    : viewportCenter < layout.dimensions.top ? 'nucleus' : 'dimensions';
  return { progress, entry, portalEntry, zone,
    exploration: clamp((scrollY + innerHeight * .6 - layout.exploration.top) / layout.exploration.height),
    nucleus: clamp((scrollY + innerHeight * .6 - layout.nucleus.top) / layout.nucleus.height) };
}

export function createKuroGuide() {
  const bubble = document.getElementById('kuro-greeting');
  const speech = document.getElementById('kuro-speech');
  const skip = document.getElementById('skip-intro');
  const introEyes = document.getElementById('intro-eyes');
  const stages = [...document.querySelectorAll('.tunnel-stage')];
  let lastText = '', lastLevel = -1, pending = false;
  let bubbleWidth = 300, bubbleHeight = 100, lastX = -1000, lastY = -1000;
  const observer = new ResizeObserver(entries => {
    const rect = entries[0].target.getBoundingClientRect();
    bubbleWidth = rect.width; bubbleHeight = rect.height;
  });
  observer.observe(bubble);

  function update() {
    pending = false;
    const intro = readIntro(), state = readJourney();
    const text = guideLine({ ...state, ...intro });
    if (text !== lastText) { speech.textContent = text; lastText = text; }
    bubble.classList.add('speaking');
    if (state.level !== lastLevel) {
      stages.forEach((stage, i) => {
        stage.classList.toggle('is-near', Math.abs(i - state.level) <= 1);
        stage.classList.toggle('is-active', i === state.level);
      });
      lastLevel = state.level;
    }
    skip.hidden = intro.entry > .99;
    if (introEyes) {
      introEyes.style.transform = 'translate(-50%,-50%) scale(' + (1 + intro.progress * 1.9) + ')';
      introEyes.style.opacity = String(1 - Math.max(0, (intro.progress - .65) / .35));
    }
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  function placeAnchor(x, y) {
    if (!document.body.classList.contains('has-webgl')) return;
    const left = Math.max(14, Math.min(innerWidth - bubbleWidth - 14, x - 35));
    const top = Math.max(70, Math.min(innerHeight - bubbleHeight - 40, y - bubbleHeight - 28));
    if (Math.abs(left - lastX) > .8 || Math.abs(top - lastY) > .8) {
      bubble.style.left = Math.round(left) + 'px';
      bubble.style.top = Math.round(top) + 'px';
      bubble.style.setProperty('--tail-left', Math.max(22, Math.min(bubbleWidth - 25, x - left)) + 'px');
      lastX = left; lastY = top;
    }
  }
  function useFallback() {
    bubble.style.removeProperty('left'); bubble.style.removeProperty('top');
    bubble.style.removeProperty('--tail-left'); lastX = lastY = -1000;
    update();
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  let pointerFrame = 0, pointerX = 0, pointerY = 0;
  addEventListener('pointermove', event => {
    if (document.body.classList.contains('has-webgl')) return;
    pointerX = (event.clientX / innerWidth - .5) * 18;
    pointerY = (event.clientY / innerHeight - .5) * 14;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      document.documentElement.style.setProperty('--space-x', pointerX + 'px');
      document.documentElement.style.setProperty('--space-y', pointerY + 'px');
    });
  }, { passive: true });
  update();
  return { placeAnchor, useFallback };
}
