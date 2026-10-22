// Shared helpers for the small 3D figures on the homepage and project pages.
// Each figure only renders while it is on screen, honours reduced motion,
// and can be turned by dragging sideways (vertical drags still scroll the page).
import * as THREE from './three.module.min.js';
export { THREE };
export const INK = 0x1c1a17, ACC = 0xc4391f, MID = 0x8a4535;
export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function fig(canvas, o = {}) {
  const opt = Object.assign({ fov: 28, dist: 22, distSmall: null, target: [0, 0, 0], yaw: -0.5, pitch: 0.35, sway: 0.3, minPitch: 0.02, maxPitch: 1.15 }, o);
  let r;
  try { r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return null; }
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(opt.fov, 1.4, 0.1, 300);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfbf, 1.6));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(6, 10, 8); scene.add(dl);
  const plot = new THREE.Group(); scene.add(plot);
  const st = { yaw: opt.yaw, pitch: opt.pitch, drag: null, t0: null, run: false, onFrame: null };

  canvas.addEventListener('pointerdown', e => { st.drag = { x: e.clientX, y: e.clientY, yaw: st.yaw, pitch: st.pitch }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!st.drag) return;
    st.yaw = st.drag.yaw + (e.clientX - st.drag.x) * 0.008;
    st.pitch = Math.max(opt.minPitch, Math.min(opt.maxPitch, st.drag.pitch + (e.clientY - st.drag.y) * 0.006));
    if (!st.run) draw(performance.now());
  });
  const end = () => { st.drag = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    if (!st.run) draw(performance.now());
  }
  new ResizeObserver(size).observe(canvas);

  function draw(now) {
    if (!canvas.clientWidth) return;
    if (st.t0 === null) st.t0 = now;
    const t = (now - st.t0) / 1000;
    if (st.onFrame) st.onFrame(REDUCE ? 99 : t);
    const auto = (REDUCE || st.drag) ? 0 : Math.sin(t * 0.25) * opt.sway;
    const yy = st.yaw + auto;
    const d = (opt.distSmall && canvas.clientWidth < 600) ? opt.distSmall : opt.dist;
    const [tx, ty, tz] = opt.target;
    cam.position.set(tx + Math.sin(yy) * Math.cos(st.pitch) * d, ty + Math.sin(st.pitch) * d, tz + Math.cos(yy) * Math.cos(st.pitch) * d);
    cam.lookAt(tx, ty, tz);
    r.render(scene, cam);
  }
  function loop(now) { if (!st.run) return; draw(now); requestAnimationFrame(loop); }
  new IntersectionObserver(es => es.forEach(e => {
    const on = e.isIntersecting && canvas.clientWidth > 0;
    if (on && !st.run) { size(); if (REDUCE) draw(performance.now()); else { st.run = true; requestAnimationFrame(loop); } }
    else if (!on) st.run = false;
  }), { rootMargin: '120px' }).observe(canvas);

  function line(pts, op = 1, color = INK) {
    const m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))),
      new THREE.LineBasicMaterial({ color, transparent: op < 1, opacity: op }));
    plot.add(m); return m;
  }
  function tag(text, pos, o2 = {}) {
    const size = o2.size || 34, w = o2.w || Math.max(128, Math.ceil(text.length * size * 0.56 / 64) * 64 + 32);
    const c = document.createElement('canvas'); c.width = w; c.height = 64;
    const g = c.getContext('2d');
    g.font = `${o2.italic ? 'italic ' : ''}${o2.weight || 500} ${size}px ${o2.serif ? 'Newsreader, Georgia, serif' : '"Instrument Sans", system-ui, sans-serif'}`;
    g.fillStyle = o2.color || '#1c1a17'; g.textBaseline = 'middle';
    g.textAlign = o2.align || 'center';
    g.fillText(text, o2.align === 'left' ? 4 : o2.align === 'right' ? w - 4 : w / 2, 32);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: o2.depthTest !== false }));
    const k = (o2.scale || 0.36) * 1.45; s.scale.set(w / 64 * k, k, 1);
    if (o2.align === 'left') s.center.set(0, 0.5); else if (o2.align === 'right') s.center.set(1, 0.5);
    s.position.set(...pos); plot.add(s); return s;
  }
  const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  return { THREE, r, scene, cam, plot, st, line, tag, draw, ease };
}

export async function fontsReady() { try { await document.fonts.ready; } catch (e) {} }
