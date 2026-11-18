import { TUNNEL } from './tunnel-openings.js?v=ship-voyage-1';

export const smooth = value => {
  const n = Math.max(0, Math.min(1, value));
  return n * n * (3 - 2 * n);
};
const mix = (a, b, t) => a + (b - a) * t;

// Cada dimensión es una parada independiente. No hay caída entre niveles.
export function journeyAt({ scroll, stages, viewportHeight, viewportWidth }) {
  let level = 0;
  for (let i = 1; i < stages.length; i++) {
    if (scroll >= stages[i].top - viewportHeight * .12) level = i;
  }
  const start = stages[level].top;
  const end = stages[level + 1]?.top ?? start + stages[level].height;
  const f = Math.max(0, Math.min(1, (scroll - start) / Math.max(1, end - start)));
  const side = level % 2 ? 1 : -1;
  const portalInset = viewportWidth < 600 ? 1 : viewportWidth < 900 ? 3 : 5;
  const beginning = side * (TUNNEL.portalOffset - portalInset);
  const destination = -side * TUNNEL.travelOffset;
  return {
    level, f, side, fall: 0,
    x: mix(beginning, destination, smooth(f)),
    y: -32 * level - 1,
    z: 7,
    active: scroll > stages[0].top - viewportHeight * .8
  };
}

let layout;
export function readJourney() {
  if (!layout || layout.viewportWidth !== innerWidth || layout.viewportHeight !== innerHeight) {
    layout = {
      stages: Array.from({ length: 4 }, (_, i) => {
        const element = document.getElementById('tunel-' + i);
        const rect = element.getBoundingClientRect();
        return { top: rect.top + scrollY, height: rect.height };
      }),
      viewportHeight: innerHeight, viewportWidth: innerWidth
    };
  }
  return journeyAt({ scroll: scrollY, ...layout });
}
