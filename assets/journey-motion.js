export const smooth = value => {
  const n = Math.max(0, Math.min(1, value));
  return n * n * (3 - 2 * n);
};
const mix = (a, b, t) => a + (b - a) * t;

// Keep the original room layout. Drops pan vertically at a constant viewing distance.
export function journeyAt({ scroll, firstTop, stageHeight, viewportHeight, viewportWidth }) {
  const raw = Math.max(0, (scroll - firstTop) / Math.max(1, stageHeight));
  const level = Math.min(3, Math.floor(raw));
  const f = Math.min(1, raw - level), side = level % 2 ? 1 : -1;
  const hasDrop = level < 3;
  const crossing = hasDrop ? smooth((f - .42) / .24) : 0;
  const fall = hasDrop ? smooth((f - .68) / .32) : 0;
  const startX = side * (viewportWidth < 600 ? 11 : viewportWidth < 900 ? 8.5 : 6);
  const entryX = mix(level === 0 ? startX : side * 14, startX, smooth(f / .14));
  return {
    level, f, side, fall,
    x: mix(entryX, -side * 14, crossing),
    y: -32 * level - 32 * fall,
    z: 7,
    holeX: -side * 14,
    depth: level * 32 + fall * 32,
    active: scroll > firstTop - viewportHeight * .8
  };
}

export function readJourney() {
  const first = document.getElementById('tunel-0');
  return journeyAt({ scroll: scrollY, firstTop: first.offsetTop,
    stageHeight: first.offsetHeight, viewportHeight: innerHeight, viewportWidth: innerWidth });
}
