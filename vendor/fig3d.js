// Shared helpers for the 3D figures on the site.
// All figures share ONE WebGL renderer (phones cap how many contexts a page can
// hold); each figure renders into it and copies the pixels to its own 2D canvas.
// A figure only renders while it is on screen, honours reduced motion, and can be
// turned by dragging sideways (vertical drags still scroll the page).
import * as THREE from './three.module.min.js';
export { THREE };
export const INK = 0x1c1a17, ACC = 0xc4391f, MID = 0x8a4535;
export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

let R = null, BW = 0, BH = 0, failed = false;
function shared() {
  if (R || failed) return R;
  try {
    R = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    R.setPixelRatio(1); R.outputColorSpace = THREE.SRGBColorSpace; R.localClippingEnabled = true;
    R.setClearColor(0x000000, 0); R.setScissorTest(true);
  } catch (e) { failed = true; R = null; }
  return R;
}
export function webgl() { return !!shared(); }

// Render a scene at w x h device pixels and copy it onto a 2D context.
export function paint(ctx, scene, cam, w, h) {
  const r = shared(); if (!r || !w || !h) return false;
  if (w > BW || h > BH) { BW = Math.max(BW, w); BH = Math.max(BH, h); r.setSize(BW, BH, false); }
  r.setViewport(0, 0, w, h); r.setScissor(0, 0, w, h);
  r.clear(); r.render(scene, cam);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(r.domElement, 0, BH - h, w, h, 0, 0, w, h);
  return true;
}

// A canvas that draws a 3D scene when on screen. draw(t) is called per frame.
export function surface(canvas, onDraw, { square = false } = {}) {
  if (!shared()) return null;
  const ctx = canvas.getContext('2d');
  const s = { w: 0, h: 0, run: false, vis: false, t0: null, ctx, canvas };
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = square ? w : Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return false;
    if (w !== s.w || h !== s.h) { s.w = canvas.width = w; s.h = canvas.height = h; }
    return true;
  }
  function frame(now) {
    if (!size()) return;
    if (s.t0 === null) s.t0 = now;
    onDraw(REDUCE ? 99 : (now - s.t0) / 1000, s);
  }
  function loop(now) { if (!s.run) return; frame(now); requestAnimationFrame(loop); }
  s.kick = () => { if (!s.vis) return; if (REDUCE) frame(performance.now()); else if (!s.run) { s.run = true; requestAnimationFrame(loop); } };
  s.redraw = () => { if (!s.run) frame(performance.now()); };
  new ResizeObserver(() => { if (size()) s.redraw(); }).observe(canvas);
  new IntersectionObserver(es => es.forEach(e => {
    s.vis = e.isIntersecting && canvas.clientWidth > 0;
    if (s.vis) s.kick(); else s.run = false;
  }), { rootMargin: '80px' }).observe(canvas);
  return s;
}

export function fig(canvas, o = {}) {
  const opt = Object.assign({ fov: 28, dist: 22, distSmall: null, target: [0, 0, 0], yaw: -0.5, pitch: 0.35, sway: 0.3, minPitch: 0.02, maxPitch: 1.15, spin: 0 }, o);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(opt.fov, 1.4, 0.1, 300);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfbf, 1.6));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(6, 10, 8); scene.add(dl);
  const plot = new THREE.Group(); scene.add(plot);
  const st = { yaw: opt.yaw, pitch: opt.pitch, drag: null, onFrame: null };
  const sf = surface(canvas, (t, s) => {
    if (st.onFrame) st.onFrame(t);
    const auto = (REDUCE || st.drag) ? 0 : (opt.spin ? t * opt.spin : Math.sin(t * 0.25) * opt.sway);
    const yy = st.yaw + auto;
    const d = (opt.distSmall && canvas.clientWidth < 600) ? opt.distSmall : opt.dist;
    const [tx, ty, tz] = opt.target;
    cam.aspect = s.w / s.h; cam.updateProjectionMatrix();
    cam.position.set(tx + Math.sin(yy) * Math.cos(st.pitch) * d, ty + Math.sin(st.pitch) * d, tz + Math.cos(yy) * Math.cos(st.pitch) * d);
    cam.lookAt(tx, ty, tz);
    paint(s.ctx, scene, cam, s.w, s.h);
  });
  if (!sf) return null;
  canvas.addEventListener('pointerdown', e => { st.drag = { x: e.clientX, y: e.clientY, yaw: st.yaw, pitch: st.pitch }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!st.drag) return;
    st.yaw = st.drag.yaw + (e.clientX - st.drag.x) * 0.008;
    st.pitch = Math.max(opt.minPitch, Math.min(opt.maxPitch, st.drag.pitch + (e.clientY - st.drag.y) * 0.006));
    sf.redraw();
  });
  const end = () => { st.drag = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

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
  return { THREE, scene, cam, plot, st, line, tag, ease, sf };
}

export async function fontsReady() { try { await document.fonts.ready; } catch (e) {} }
