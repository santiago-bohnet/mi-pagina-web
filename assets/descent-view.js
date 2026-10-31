import { readJourney } from './journey-motion.js';

const worlds = ['Cielo', 'Infierno', 'Inframundo', 'Extraterrestre'];
const colors = ['#e2c88d', '#f45124', '#a17bea', '#58dfbd'];
const stone = [[105, 99, 88], [77, 54, 45], [69, 58, 78], [45, 70, 67]];
const hash = n => { const value = Math.sin(n * 127.1 + 37.7) * 43758.5453; return value - Math.floor(value); };

// A fixed three-quarter cutaway keeps both landings in frame throughout the drop.
// Canvas renders the same transition on devices where WebGL is unavailable.
export function installDescentView() {
  const canvas = document.createElement('canvas');
  canvas.id = 'descent-view';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const caption = document.createElement('div');
  caption.id = 'descent-caption';
  caption.setAttribute('aria-live', 'off');
  document.body.append(canvas, caption);
  const artwork = new Image();
  artwork.src = new URL('./portal-inferno.webp', import.meta.url).href;
  artwork.onload = schedule;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let queued = false, width = 0, height = 0, pixelRatio = 1;

  function resize() {
    width = innerWidth; height = innerHeight;
    pixelRatio = Math.min(devicePixelRatio || 1, 1.7);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    schedule();
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(frame); }
  }
  function frame(time) {
    queued = false;
    const state = readJourney();
    const visible = state.active && state.observer > .001;
    canvas.style.opacity = String(state.observer);
    caption.style.opacity = String(state.observer);
    document.body.classList.toggle('showing-descent', visible);
    if (!visible) return;
    caption.textContent = state.fall < .001 ? 'El borde de la abertura'
      : state.fall > .999 ? 'Llegamos a ' + worlds[state.level + 1]
      : 'Bajando a ' + worlds[state.level + 1] + ' · ' + Math.round(state.fall * 32) + ' / 32 m';
    draw(state, reduced ? 0 : time * .001);
    if (!reduced && !document.hidden) schedule();
  }

  function draw(state, time) {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, '#14131a');
    background.addColorStop(.5, '#090a10');
    background.addColorStop(1, '#17131c');
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    const scale = Math.min((width - 32) / (width < 600 ? 34 : 62), (height - 160) / 51);
    // Orthonormal observer axes. No camera roll, zoom or follow during the fall.
    const right = [.923, 0, -.385], up = [-.134, .937, -.323], forward = [-.361, -.35, -.865];
    const target = [0, -24, 0];
    function project(point) {
      const p = point.map((n, i) => n - target[i]);
      return {
        x: width * .5 + (p[0] * right[0] + p[2] * right[2]) * scale,
        y: height * .49 - (p[0] * up[0] + p[1] * up[1] + p[2] * up[2]) * scale,
        depth: p[0] * forward[0] + p[1] * forward[1] + p[2] * forward[2]
      };
    }
    function polygon(points, fill, stroke) {
      const p = points.map(project);
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = .65; ctx.stroke(); }
    }
    const commands = [];
    function face(points, fill, stroke) {
      commands.push({ depth: points.reduce((sum, p) => sum + project(p).depth, 0) / points.length,
        paint: () => polygon(points, fill, stroke) });
    }
    function floor(y, level, hasOpening) {
      const rgb = stone[level];
      for (let x = -26; x < 26; x += 2) {
        for (let z = -9; z < 9; z += 1.5) {
          if (hasOpening && (x + 1) ** 2 + (z + .75 - 3.2) ** 2 < 4.45 ** 2) continue;
          const noise = hash((x + 30) * 17 + z * 11 + level * 351);
          const color = rgb.map(n => Math.round(n * (.68 + noise * .21)));
          face([[x, y, z], [x + 2, y, z], [x + 2, y, z + 1.5], [x, y, z + 1.5]],
            'rgb(' + color.join(',') + ')', '#00000013');
          // Small, irregular mineral seams make the ledge read as rock.
          if (noise > .77) {
            const a = [x + .2, y + .006, z + .3], b = [x + 1.3, y + .006, z + .9];
            commands.push({ depth: project(a).depth - .01, paint() {
              const pa = project(a), pb = project(b);
              ctx.strokeStyle = '#cbc2bd24'; ctx.lineWidth = .7;
              ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
            } });
          }
        }
        const jag = 1.7 + hash(x * 17 + level * 31) * .8;
        face([[x, y, 9], [x + 2, y, 9], [x + 2, y - jag, 9], [x, y - 2, 9]],
          level === 1 ? '#2b1d1a' : '#27242c', '#09080e44');
      }
      for (const x of [-26, 26]) face([[x, y, -9], [x, y, 9], [x, y - 2, 9], [x, y - 2, -9]], '#211e25');
      if (hasOpening) {
        for (let n = 0; n < 64; n++) {
          const a = n / 64 * Math.PI * 2, b = (n + 1) / 64 * Math.PI * 2;
          const p = [Math.cos(a) * 4.3, y, 3.2 + Math.sin(a) * 4.3];
          const q = [Math.cos(b) * 4.3, y, 3.2 + Math.sin(b) * 4.3];
          face([p, q, [q[0], y - 1.8, q[2]], [p[0], y - 1.8, p[2]]], n > 32 ? '#242129' : '#383039');
        }
      }
    }
    floor(-10.5, state.level, true);
    floor(-42.5, state.level + 1, false);

    const landing = [state.side * 3, -34.4, -5.8];
    commands.push({ depth: project(landing).depth, paint() {
      const p = project(landing), w = 6.8 * scale, h = 11.4 * scale;
      ctx.save(); ctx.translate(p.x, p.y);
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, h * .6);
      glow.addColorStop(0, colors[state.level + 1] + '33'); glow.addColorStop(1, '#00000000');
      ctx.fillStyle = glow; ctx.fillRect(-h, -h, h * 2, h * 2);
      ctx.beginPath(); ctx.ellipse(0, 0, w * .5, h * .5, 0, 0, Math.PI * 2); ctx.clip();
      if (state.level === 0 && artwork.complete && artwork.naturalWidth) {
        ctx.drawImage(artwork, artwork.naturalWidth * .27, 0, artwork.naturalWidth * .47,
          artwork.naturalHeight * .90, -w * .5, -h * .5, w, h);
      } else {
        ctx.fillStyle = '#080610'; ctx.fillRect(-w, -h, w * 2, h * 2);
        ctx.shadowColor = colors[state.level + 1]; ctx.shadowBlur = 12;
        for (let ring = 0; ring < 9; ring++) {
          ctx.strokeStyle = colors[state.level + 1] + (ring % 2 ? 'aa' : '44');
          ctx.lineWidth = 1.1 + ring * .12;
          ctx.beginPath(); ctx.ellipse(0, 0, w * (.35 + ring * .018), h * (.35 + ring * .018),
            0, time * .16 + ring, time * .16 + ring + 4.7); ctx.stroke();
        }
      }
      ctx.restore();
    } });

    const shadow = [];
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * Math.PI * 2;
      shadow.push([Math.cos(a) * 3.8, -42.48, 3.2 + Math.sin(a) * 1.5]);
    }
    face(shadow, '#00000055');
    const guide = [0, -6 - state.fall * 32, 3.2];
    commands.push({ depth: project(guide).depth - .05, paint() {
      const p = project(guide); drawKuro(p.x, p.y, scale, time);
    } });
    commands.sort((a, b) => b.depth - a.depth);
    for (const command of commands) command.paint();

    // Stationary dust is a depth reference; it does not fall with the character.
    for (let i = 0; i < 35; i++) {
      const p = project([(hash(i) - .5) * 28, -12 - hash(i + 100) * 27, -8]);
      ctx.fillStyle = '#e3d4c4' + (i % 3 ? '25' : '55');
      ctx.fillRect(p.x, p.y, 1.1, 1.1);
    }
    function label(y, text, color) {
      const point = project([-15, y + 2, 1]);
      const x = Math.max(24, Math.min(width - 180, point.x));
      const py = Math.max(66, Math.min(height - 115, point.y));
      ctx.font = '500 11px system-ui, sans-serif';
      const size = ctx.measureText(text).width;
      ctx.fillStyle = '#09090de8'; ctx.fillRect(x - 10, py - 15, size + 20, 27);
      ctx.fillStyle = color; ctx.fillText(text, x, py + 3);
    }
    label(-10.5, worlds[state.level].toUpperCase() + ' · ' + (state.level ? '−' + (state.level * 32) : '0') + ' m', colors[state.level]);
    label(-42.5, worlds[state.level + 1].toUpperCase() + ' · −' + ((state.level + 1) * 32) + ' m', colors[state.level + 1]);
    const vignette = ctx.createRadialGradient(width / 2, height / 2, height * .23, width / 2, height / 2, height * .85);
    vignette.addColorStop(0, '#00000000'); vignette.addColorStop(1, '#00000088');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
  }

  function drawKuro(x, y, unit, time) {
    ctx.save(); ctx.translate(x, y); ctx.scale(unit, unit);
    const exhaust = ctx.createRadialGradient(0, .75, 0, 0, .75, 3.5);
    exhaust.addColorStop(0, '#ff395577'); exhaust.addColorStop(1, '#ff183300');
    ctx.fillStyle = exhaust; ctx.fillRect(-4, -2, 8, 6);
    ctx.fillStyle = '#11111b'; ctx.strokeStyle = '#5c5360'; ctx.lineWidth = .055;
    ctx.beginPath(); ctx.moveTo(-3.5, .4); ctx.lineTo(-1.8, -.3); ctx.lineTo(1.8, -.3);
    ctx.lineTo(3.5, .4); ctx.lineTo(1.2, .95); ctx.lineTo(-1.2, .95); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#e43a59'; ctx.lineWidth = .07;
    ctx.beginPath(); ctx.moveTo(-3, .42); ctx.lineTo(-1.3, .72); ctx.lineTo(1.3, .72); ctx.lineTo(3, .42); ctx.stroke();
    ctx.strokeStyle = '#16151f'; ctx.lineWidth = .22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(.55, -.2); ctx.bezierCurveTo(1.6, .1, 1.7, -1.4, 1.25, -1.4); ctx.stroke();
    const fur = ctx.createLinearGradient(-.8, -3, .8, .2);
    fur.addColorStop(0, '#34313d'); fur.addColorStop(.4, '#13121b'); fur.addColorStop(1, '#07060a');
    ctx.fillStyle = fur; ctx.strokeStyle = '#45404d'; ctx.lineWidth = .04;
    ctx.beginPath(); ctx.ellipse(0, -.65, .48, .73, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-.73, -2.1); ctx.lineTo(-.62, -3.0); ctx.lineTo(-.16, -2.55);
    ctx.lineTo(.16, -2.55); ctx.lineTo(.62, -3.0); ctx.lineTo(.73, -2.1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -1.95, .75, .68, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#8d344b'; ctx.beginPath();
      ctx.moveTo(side * .52, -2.75); ctx.lineTo(side * .29, -2.45); ctx.lineTo(side * .59, -2.35); ctx.fill();
      ctx.shadowColor = '#ff214f'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#ff244f'; ctx.beginPath(); ctx.ellipse(side * .30, -1.95, .19, .16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#200510'; ctx.fillRect(side * .30 - .025, -2.07, .05, .24);
      ctx.fillStyle = '#fff2f4'; ctx.beginPath(); ctx.arc(side * .30 - .055, -2.015, .04, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#aa8d9d'; ctx.lineWidth = .018;
      for (let n = -1; n <= 1; n++) {
        ctx.beginPath(); ctx.moveTo(side * .42, -1.62 + n * .045);
        ctx.lineTo(side * 1.03, -1.64 + n * .17); ctx.stroke();
      }
    }
    ctx.fillStyle = '#b8667c'; ctx.beginPath(); ctx.moveTo(-.075, -1.66); ctx.lineTo(.075, -1.66); ctx.lineTo(0, -1.58); ctx.fill();
    ctx.restore();
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  resize();
}
