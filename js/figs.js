// The moon in the hero, and the 3D figures for RPDI, DTM and Liberty.
import { fig, fontsReady, THREE, INK, ACC, MID, REDUCE } from '/vendor/fig3d.js';
const $ = s => document.querySelector(s);
await fontsReady();

/* ---------------------------------------------------------------- moon */
// Arjun's photo of the moon over Bengaluru, wrapped onto a sphere and lit by
// the real phase for tonight. Drag sideways to run the month forward or back.
(function moon() {
  const cv = $('#moon-gl'), img = $('#moon-img'), cap = $('#moon-cap');
  if (!cv || !img) return;
  let r;
  try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return; }
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputColorSpace = THREE.LinearSRGBColorSpace; // shader output is already sRGB
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(20, 1, 0.1, 20);
  cam.position.set(0, 0, 6); cam.lookAt(0, 0, 0);
  const src = document.createElement('canvas'); src.width = src.height = 1024;
  const tex = new THREE.CanvasTexture(src); tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8;
  const uni = { map: { value: tex }, L: { value: new THREE.Vector3(0, 0, 1) }, paper: { value: new THREE.Vector3(242 / 255, 237 / 255, 226 / 255) } };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: `varying vec3 vO; varying vec3 vW;
      void main(){ vO = normal; vW = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 L; uniform vec3 paper; varying vec3 vO; varying vec3 vW;
      void main(){
        vec3 n = normalize(vO);
        vec2 uv = vec2(n.z < 0.0 ? -n.x : n.x, n.y) * 0.49 + 0.5;
        vec3 alb = texture2D(map, uv).rgb;
        vec3 w = normalize(vW);
        float d = dot(w, normalize(L));
        float lit = smoothstep(-0.07, 0.10, d);
        vec3 day = alb * (0.80 + 0.30 * max(d, 0.0));
        vec3 ghost = mix(paper, alb * 0.9, 0.13);          // earthshine, faint on paper
        float rim = smoothstep(0.0, 0.22, w.z);             // soften the limb into the page
        vec3 c = mix(ghost, day, lit);
        gl_FragColor = vec4(mix(paper, c, mix(0.55, 1.0, rim)), 1.0);
      }`
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), mat); scene.add(ball);

  // Phase from a known new moon (2000-01-06 18:14 UTC) and the mean synodic month.
  const SYN = 29.530588853, NEW = Date.UTC(2000, 0, 6, 18, 14);
  const ageNow = (((Date.now() - NEW) / 864e5) % SYN + SYN) % SYN;
  const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  const nameOf = a => names[Math.floor(((a / SYN) * 8 + 0.5)) % 8];
  let off = 0, drag = null, idle = 0, run = false, t0 = null, shownTxt = '';
  function label(age) {
    const pct = Math.round((1 - Math.cos(2 * Math.PI * age / SYN)) / 2 * 100);
    const days = Math.round(off);
    const when = days === 0 ? 'Tonight' : days > 0 ? `In ${days} day${days > 1 ? 's' : ''}` : `${-days} day${days < -1 ? 's' : ''} ago`;
    const txt = `${when} · ${nameOf(age)} · ${pct}% lit`;
    if (cap && txt !== shownTxt) { cap.textContent = txt; shownTxt = txt; }
  }
  function draw(now) {
    if (t0 === null) t0 = now; const t = (now - t0) / 1000;
    if (!drag && Math.abs(off) > 0.01 && now - idle > 2500 && !REDUCE) off *= 0.94; else if (!drag && Math.abs(off) <= 0.01) off = 0;
    const age = ((ageNow + off) % SYN + SYN) % SYN, th = 2 * Math.PI * age / SYN;
    uni.L.value.set(Math.sin(th), 0.08, -Math.cos(th));
    ball.rotation.set(REDUCE ? 0 : Math.sin(t * 0.21) * 0.05, REDUCE ? 0 : Math.sin(t * 0.13) * 0.08, 0);
    label(age);
    r.render(scene, cam);
    if (!img.dataset.swapped) { img.dataset.swapped = 1; img.style.visibility = 'hidden'; cv.style.opacity = 1; }
  }
  function size() { const w = cv.clientWidth; if (w && ready) { r.setSize(w, w, false); if (!run) draw(performance.now()); } }
  new ResizeObserver(size).observe(cv);
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, off }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; off = drag.off + (e.clientX - drag.x) / cv.clientWidth * 14; idle = performance.now(); if (!run) draw(performance.now()); });
  const end = () => { drag = null; idle = performance.now(); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  function loop(now) { if (!run) return; draw(now); requestAnimationFrame(loop); }
  new IntersectionObserver(es => es.forEach(e => {
    vis = e.isIntersecting;
    if (vis && !run && ready) { size(); if (!REDUCE) { run = true; requestAnimationFrame(loop); } }
    else if (!vis) run = false;
  })).observe(cv);
  let ready = false, vis = false;
  (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
    const g = src.getContext('2d'); g.fillStyle = '#a6a399'; g.fillRect(0, 0, 1024, 1024); g.drawImage(img, 0, 0, 1024, 1024);
    tex.needsUpdate = true; ready = true; size(); if (vis && !REDUCE && !run) { run = true; requestAnimationFrame(loop); }
  });
})();

/* ---------------------------------------------------------------- RPDI */
// x = D (factual distortion), back = L (portrayal), up = RPDI = 0.6D + 0.4L.
// Every film sits on that plane; the floor diagonal is D = L, where Gap = 0.
(function rpdi() {
  const cv = $('#rpdi-gl'); if (!cv) return;
  const F = fig(cv, { dist: 21, distSmall: 25, target: [0, 1.4, 0], yaw: -0.62, pitch: 0.38, sway: 0.28 }); if (!F) return;
  const { plot, line, tag, ease } = F;
  const films = [ // title, D, L, RPDI, gap class
    ["All the President's Men", .077, .125, .096, 'h'], ['Amaran', .206, .375, .273, 'g'], ['Bajirao Mastani', .610, .750, .666, 'g'],
    ['Dhurandhar 1', .484, .688, .565, 'x'], ['Gandhi', .212, .563, .352, 'x'], ['Manikarnika', .377, .688, .501, 'x'],
    ['Mohenjo Daro', .583, .900, .710, 'x'], ['Oppenheimer', .202, .313, .246, 'g'], ['Rocketry', .196, .438, .293, 'x'],
    ['RRR', .716, .917, .796, 'g'], ['Sardar Udham', .279, .375, .317, 'g'], ['Saving Private Ryan', .512, .375, .457, 's'],
    ['Shershaah', .313, .450, .368, 'g'], ['Tanhaji', .490, .688, .569, 'g'], ['The Kashmir Files', .214, .750, .429, 'x'], ['U-571', .512, .375, .457, 's']];
  const X = d => d * 8 - 4, Z = l => 4 - l * 8, Y = v => v * 5;
  // floor grid + axes
  for (let i = 0; i <= 4; i++) { const v = i / 4; line([[X(v), 0, Z(0)], [X(v), 0, Z(1)]], 0.16); line([[X(0), 0, Z(v)], [X(1), 0, Z(v)]], 0.16); }
  line([[X(0), 0, Z(0)], [X(1), 0, Z(1)]], 0.55, ACC);
  line([[X(0), 0, Z(1)], [X(0), Y(1), Z(1)]]);
  for (const v of [0.25, 0.5, 0.75, 1]) line([[X(0), Y(v), Z(1)], [X(1), Y(v), Z(1)]], 0.1);
  // the RPDI plane, as a wire grid
  const plane = [];
  for (let i = 0; i <= 8; i++) { const a = i / 8;
    plane.push(line([[X(a), Y(0.6 * a), Z(0)], [X(a), Y(0.6 * a + 0.4), Z(1)]], 0.13));
    plane.push(line([[X(0), Y(0.4 * a), Z(a)], [X(1), Y(0.6 + 0.4 * a), Z(a)]], 0.13)); }
  const col = { x: ACC, s: MID, g: INK, h: INK };
  const geo = new THREE.SphereGeometry(0.15, 18, 12);
  const dots = films.map(f => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col[f[4]], roughness: 0.45 })); plot.add(m); return m; });
  const drops = films.map(f => line([[X(f[1]), 0, Z(f[2])], [X(f[1]), 0, Z(f[2])]], 0.4, col[f[4]]));
  const shadows = films.map(f => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: col[f[4]], transparent: true, opacity: 0.35 })); m.rotation.x = -Math.PI / 2; m.position.set(X(f[1]), 0.01, Z(f[2])); plot.add(m); return m; });
  // labels
  tag('D  factual distortion →', [X(0.5), -0.55, Z(0) + 0.7], { size: 30 });
  tag('L  portrayal →', [X(1) + 1.3, -0.4, Z(0.5)], { size: 30 });
  tag('RPDI', [X(0), Y(1) + 0.45, Z(1)], { size: 30, weight: 600 });
  for (const v of [0.5, 1]) tag(v.toFixed(1), [X(0) - 0.45, Y(v), Z(1)], { size: 28 });
  tag('D = L  (no gap)', [X(0.93), 0.3, Z(0.93)], { size: 26, color: '#c4391f' });
  const named = { RRR: [0, .5], "All the President's Men": [0, -.45], 'The Kashmir Files': [0, .45], 'Mohenjo Daro': [-.2, .45], 'Saving Private Ryan': [0, -.5], 'Gandhi': [0, .42] };
  films.forEach(f => { if (named[f[0]]) { const [dx, dy] = named[f[0]]; tag(f[0] === 'Saving Private Ryan' ? 'Saving Private Ryan · U-571' : f[0], [X(f[1]) + dx, Y(f[3]) + dy, Z(f[2])], { size: 26, serif: true, italic: true, weight: 500, scale: 0.34, depthTest: false }); } });
  plot.position.set(0, 0, 0);
  F.st.onFrame = t => {
    films.forEach((f, i) => {
      const k = ease((t - 0.15 - i * 0.05) / 1.1), y = Y(f[3]) * k;
      dots[i].position.set(X(f[1]), y, Z(f[2]));
      const p = drops[i].geometry.attributes.position; p.setY(1, y); p.needsUpdate = true;
      shadows[i].scale.setScalar(0.3 + 0.7 * k);
    });
    const pk = ease((t - 1.2) / 1); plane.forEach(l => l.material.opacity = 0.13 * pk);
  };
})();

/* ---------------------------------------------------------------- DTM */
// The rulebook's base pressure weights, over by over through a T20 innings,
// with the match-importance bonus stacked on top. Rules, not scored data.
(function dtm() {
  const cv = $('#dtm-gl'); if (!cv) return;
  const F = fig(cv, { dist: 24, distSmall: 29, target: [-0.6, 1.3, 0], yaw: -0.62, pitch: 0.42, sway: 0.25 }); if (!F) return;
  const { plot, line, tag, ease } = F;
  const base = o => o <= 2 ? 1 : o <= 6 ? 2 : o <= 8 ? 2 : o <= 15 ? 3 : o <= 18 ? 4 : 5;
  const tiers = [['Bilateral', 0], ['ICC group +0.5', 0.5], ['ICC knockout +1', 1], ['ICC final +2', 2]];
  const X = o => (o - 10.5) * 0.48, Z = i => 2.4 - i * 1.6, H = w => w * 0.55;
  const tone = o => o <= 6 ? 0xb9b0a1 : o <= 15 ? 0x6d655a : o <= 18 ? INK : ACC;
  const n = 20 * tiers.length;
  const box = new THREE.BoxGeometry(0.4, 1, 1.25); box.translate(0, 0.5, 0);
  const im = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: 0.75 }), n);
  const c = new THREE.Color(), m4 = new THREE.Matrix4(), cells = [];
  tiers.forEach((tr, i) => { for (let o = 1; o <= 20; o++) { const k = cells.length; cells.push([o, i, base(o) + tr[1]]); im.setColorAt(k, c.set(tone(o))); } });
  im.instanceColor.needsUpdate = true; plot.add(im);
  // phase brackets on the floor
  const phases = [[1, 6, 'Powerplay'], [7, 15, 'Middle overs'], [16, 18, 'Death'], [19, 20, 'Final 2']];
  const zf = Z(0) + 1.15;
  phases.forEach(([a, b, nm], i) => { line([[X(a) - 0.22, 0, zf], [X(b) + 0.22, 0, zf]], 0.7, i === 3 ? ACC : INK); tag(nm, [(X(a) + X(b)) / 2, -0.38, zf + 0.25], { size: 28, color: i === 3 ? '#c4391f' : '#1c1a17' }); });
  tiers.forEach(([nm], i) => tag(nm, [X(1) - 0.55, 0.15, Z(i)], { size: 26, align: 'right' }));
  // weight scale on the back wall
  const zb = Z(3) - 0.9;
  line([[X(1) - 0.3, 0, zb], [X(1) - 0.3, H(7.2), zb]]);
  for (const w of [1, 3, 5, 7]) { line([[X(1) - 0.3, H(w), zb], [X(20) + 0.3, H(w), zb]], 0.12); tag(String(w), [X(1) - 0.75, H(w), zb], { size: 28 }); }
  tag('pressure weight', [X(1) + 0.9, H(7.2) + 0.4, zb], { size: 28 });
  F.st.onFrame = t => {
    cells.forEach(([o, i, w], k) => { const e = ease((t - 0.1 - o * 0.06 - i * 0.12) / 0.9); m4.makeScale(1, Math.max(0.001, H(w) * e), 1); m4.setPosition(X(o), 0, Z(i)); im.setMatrixAt(k, m4); });
    im.instanceMatrix.needsUpdate = true;
  };
})();

/* ---------------------------------------------------------------- Liberty */
// Vikram's arc through the treatment: story order across, his power up,
// and how much he still believes in the Empire front to back. My reading of
// the treatment, not measured data.
(function liberty() {
  const cv = $('#liberty-gl'); if (!cv) return;
  const F = fig(cv, { dist: 22, distSmall: 25, target: [-0.7, 1.8, 0], yaw: -0.78, pitch: 0.32, sway: 0.25 }); if (!F) return;
  const { plot, line, tag, ease } = F;
  const beats = [ // story position, power, faith in the Empire, label
    [0.00, 0.05, 0.55, '1896 · the empty plinth'], [0.12, 0.35, 0.95, 'Rises in the administration'], [0.22, 0.50, 0.92, ''],
    [0.32, 0.55, 0.78, ''], [0.40, 0.57, 0.62, ''], [0.50, 0.63, 0.25, 'The salt was uranium'],
    [0.60, 0.78, 0.12, 'Russia and China'], [0.68, 0.72, 0.05, ''], [0.76, 0.86, 0.02, 'Hyderabad ambush'],
    [0.88, 0.90, 0.00, ''], [1.00, 0.97, 0.00, '“I lost… but still won.”']];
  const X = s => s * 10 - 5, Y = p => p * 4.4, Z = f => (0.5 - f) * 6;
  const P = beats.map(b => new THREE.Vector3(X(b[0]), Y(b[1]), Z(b[2])));
  const curve = new THREE.CatmullRomCurve3(P, false, 'centripetal');
  const tube = new THREE.TubeGeometry(curve, 260, 0.06, 10, false);
  const total = tube.index.count;
  plot.add(new THREE.Mesh(tube, new THREE.MeshStandardMaterial({ color: INK, roughness: 0.5 })));
  const flat = (fy, fz, op) => { const pts = curve.getPoints(200).map(v => [v.x, fy === null ? v.y : fy, fz === null ? v.z : fz]); return line(pts, op); };
  const floor = flat(0, null, 0.22), wall = flat(null, Z(1) - 0.4, 0.18);
  // floor + back wall frame
  line([[-5, 0, Z(1) - 0.4], [5, 0, Z(1) - 0.4]], 0.5); line([[-5, 0, Z(1) - 0.4], [-5, 0, Z(0) + 0.4]], 0.5); line([[-5, 0, Z(1) - 0.4], [-5, 4.8, Z(1) - 0.4]], 0.5);
  for (const p of [0.25, 0.5, 0.75, 1]) line([[-5, Y(p), Z(1) - 0.4], [5, Y(p), Z(1) - 0.4]], 0.08);
  const geo = new THREE.SphereGeometry(0.13, 16, 12);
  const red = new Set([5, 10]);
  const dots = beats.map((b, i) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: red.has(i) ? ACC : INK, roughness: 0.4 })); m.position.copy(P[i]); plot.add(m); return m; });
  const tags = beats.map((b, i) => b[3] ? tag(b[3], [P[i].x, P[i].y + 0.42, P[i].z], { size: 26, serif: true, italic: true, scale: 0.34, color: red.has(i) ? '#c4391f' : '#1c1a17', depthTest: false }) : null);
  tag('story →', [0, -0.45, Z(0) + 0.8], { size: 28 });
  tag('power', [-5, 5.2, Z(1) - 0.4], { size: 28 });
  tag('loyal to the Empire', [-5.6, 0.1, Z(1) - 0.3], { size: 24, align: 'right' });
  tag('against it', [-5.6, 0.1, Z(0) + 0.4], { size: 24, align: 'right' });
  F.st.onFrame = t => {
    const k = ease(t / 3.2);
    tube.setDrawRange(0, Math.floor(total * k / 3) * 3);
    beats.forEach((b, i) => { const on = k >= b[0] * 0.995; dots[i].visible = on; if (tags[i]) tags[i].visible = on; });
    floor.geometry.setDrawRange(0, Math.floor(201 * k)); wall.geometry.setDrawRange(0, Math.floor(201 * k));
  };
})();
