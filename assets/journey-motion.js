import { TUNNEL } from './tunnel-openings.js?v=signs-origin';

export const smooth = value => {
  const n = Math.max(0, Math.min(1, value));
  return n * n * (3 - 2 * n);
};
const mix = (a, b, t) => a + (b - a) * t;

// Keep the original room layout. Drops pan vertically at a constant viewing distance.
export function journeyAt({ scroll, firstTop, stageHeight, viewportHeight, viewportWidth }) {
  let raw = Math.max(0, (scroll - firstTop) / Math.max(1, stageHeight));
  const boundary = Math.round(raw);
  // Fractional svh layout and anchor scrolling can differ by a pixel.
  if (Math.abs(raw - boundary) * stageHeight < 1.5) raw = boundary;
  const level = Math.min(3, Math.floor(raw));
  const elapsed = Math.min(1, raw - level), side = level % 2 ? 1 : -1;
  // Stretch time spent in the corridor; keep the approved drop duration unchanged.
  const f = elapsed < TUNNEL.corridorShare
    ? elapsed / TUNNEL.corridorShare * TUNNEL.corridorEnd
    : TUNNEL.corridorEnd + (elapsed - TUNNEL.corridorShare) / (1 - TUNNEL.corridorShare) * (1 - TUNNEL.corridorEnd);
  const hasDrop = level < 3;
  const crossing = Math.max(0, Math.min(1, f / (hasDrop ? TUNNEL.corridorEnd : 1)));
  const fall = hasDrop ? smooth((f - .68) / .32) : 0;
  const portalInset = viewportWidth < 600 ? 0 : viewportWidth < 900 ? 2.5 : 5;
  const startX = side * (TUNNEL.portalOffset - portalInset);
  const entryX = level === 0 ? startX : side * TUNNEL.openingOffset;
  return {
    level, f, side, fall,
    x: mix(entryX, -side * TUNNEL.openingOffset, crossing),
    y: -32 * level - 32 * fall,
    z: 7,
    holeX: -side * TUNNEL.openingOffset,
    depth: level * 32 + fall * 32,
    active: scroll > firstTop - viewportHeight * .8
  };
}

let layout;
export function readJourney() {
  if (!layout || layout.viewportWidth !== innerWidth || layout.viewportHeight !== innerHeight) {
    const rect = document.getElementById('tunel-0').getBoundingClientRect();
    layout = { firstTop: rect.top + scrollY, stageHeight: rect.height,
      viewportHeight: innerHeight, viewportWidth: innerWidth };
  }
  return journeyAt({ scroll: scrollY, ...layout });
}
