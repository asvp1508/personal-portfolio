// The moon in the hero and every 3D figure on the site.
import { fig, fontsReady, surface, paint, webgl, THREE, INK, ACC, MID, REDUCE } from '/vendor/fig3d.js';
const $ = s => document.querySelector(s);
await fontsReady();

/* ---------------------------------------------------------------- moon */
// Arjun's photo of the moon over Bengaluru, wrapped onto a sphere and lit by
// the real phase for tonight. Drag sideways to run the month forward or back.
(function moon() {
  const cv = $('#moon-gl'), img = $('#moon-img'), cap = $('#moon-cap');
  if (!cv || !img || !webgl()) return;
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
        vec3 ghost = mix(paper, alb * 0.9, 0.13);
        float rim = smoothstep(0.0, 0.22, w.z);
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
  let off = 0, drag = null, idle = 0, shownTxt = '', ready = false;
  function label(age) {
    const pct = Math.round((1 - Math.cos(2 * Math.PI * age / SYN)) / 2 * 100);
    const days = Math.round(off);
    const when = days === 0 ? 'Tonight' : days > 0 ? `In ${days} day${days > 1 ? 's' : ''}` : `${-days} day${days < -1 ? 's' : ''} ago`;
    const txt = `${when} · ${nameOf(age)} · ${pct}% lit`;
    if (cap && txt !== shownTxt) { cap.textContent = txt; shownTxt = txt; }
  }
  const sf = surface(cv, (t, s) => {
    if (!ready) return;
    const now = performance.now();
    if (!drag && Math.abs(off) > 0.01 && now - idle > 2500 && !REDUCE) off *= 0.94; else if (!drag && Math.abs(off) <= 0.01) off = 0;
    const age = ((ageNow + off) % SYN + SYN) % SYN, th = 2 * Math.PI * age / SYN;
    uni.L.value.set(Math.sin(th), 0.08, -Math.cos(th));
    ball.rotation.set(REDUCE ? 0 : Math.sin(t * 0.21) * 0.05, REDUCE ? 0 : Math.sin(t * 0.13) * 0.08, 0);
    label(age);
    if (paint(s.ctx, scene, cam, s.w, s.h) && !img.dataset.swapped) { img.dataset.swapped = 1; img.style.visibility = 'hidden'; cv.style.opacity = 1; }
  }, { square: true });
  if (!sf) return;
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, off }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; off = drag.off + (e.clientX - drag.x) / cv.clientWidth * 14; idle = performance.now(); sf.redraw(); });
  const end = () => { drag = null; idle = performance.now(); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
    const g = src.getContext('2d'); g.fillStyle = '#a6a399'; g.fillRect(0, 0, 1024, 1024); g.drawImage(img, 0, 0, 1024, 1024);
    tex.needsUpdate = true; ready = true; sf.redraw(); sf.kick();
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

/* ---------------------------------------------------------------- ADMI */
// All 227 Atlanta fares: distance across (log), price per mile up (log),
// number of airlines going back. Used in "Under the hood" and on the ADMI page.
const admiData = fetch('/media/admi_points.json').then(r => r.json());
function admi(sel) {
  const cv = $(sel); if (!cv) return;
  const F = fig(cv, { dist: 23, distSmall: 24, target: [0, 0.4, 0], yaw: -0.55, pitch: 0.32, sway: 0.35 }); if (!F) return;
  const { plot, line, tag, ease } = F;
  const X = m => (Math.log10(m) - 2) / (Math.log10(5000) - 2) * 10 - 5;
  const Y = v => (Math.log10(v) - Math.log10(0.04)) / (Math.log10(2.5) - Math.log10(0.04)) * 6;
  const Z = a => (a - 2.5) * 1.6;
  for (let a = 1; a <= 4; a++) line([[-5, 0, Z(a)], [5, 0, Z(a)]], 0.28);
  for (const m of [100, 250, 500, 1000, 2500, 5000]) line([[X(m), 0, Z(1)], [X(m), 0, Z(4)]], 0.18);
  const zb = Z(4) + 0.6;
  line([[-5, 0, zb], [5.4, 0, zb]]); line([[-5, 0, zb], [-5, 6.3, zb]]); line([[-5, 0, zb], [-5, 0, Z(1) - 0.7]]);
  for (const v of [0.05, 0.1, 0.25, 0.5, 1, 2]) line([[-5, Y(v), zb], [5, Y(v), zb]], 0.12);
  for (const m of [100, 500, 1000, 5000]) tag(m >= 1000 ? (m / 1000) + 'k mi' : m + ' mi', [X(m), -0.45, zb + 0.3]);
  for (const v of [0.05, 0.25, 1, 2]) tag('$' + v, [-5.75, Y(v), zb]);
  ['1 airline', '2', '3', '4+'].forEach((t, i) => tag(t, [5.9, 0, Z(i + 1)]));
  tag('price per mile', [-5, 6.8, zb], { size: 30 }); tag('distance', [0, -1.05, zb + 0.5], { size: 30 });
  plot.position.set(0.3, -2.9, 0);
  admiData.then(pts => {
    const geo = new THREE.SphereGeometry(0.11, 14, 10);
    const mats = { s: new THREE.MeshStandardMaterial({ color: ACC, roughness: 0.4 }), one: new THREE.MeshStandardMaterial({ color: MID, roughness: 0.5 }), comp: new THREE.MeshStandardMaterial({ color: INK, roughness: 0.6 }) };
    const groups = { s: [], one: [], comp: [] };
    for (const p of pts) groups[p[5] ? 's' : p[3] === 1 ? 'one' : 'comp'].push(p);
    const inst = [];
    for (const k in groups) { const im = new THREE.InstancedMesh(geo, mats[k], groups[k].length); im.userData.pts = groups[k]; plot.add(im); inst.push(im); }
    const seg = []; for (const p of groups.s) { const x = X(p[1]), y = Y(p[2]), z = Z(p[3]); seg.push(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, y, z)); }
    plot.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg), new THREE.LineBasicMaterial({ color: ACC, transparent: true, opacity: 0.35 })));
    const m4 = new THREE.Matrix4(), jit = i => ((Math.sin(i * 91.7) * 43758.5) % 1) * 0.5;
    F.st.onFrame = t => { const k = ease(t / 1.6); inst.forEach(im => { im.userData.pts.forEach((p, i) => { m4.makeTranslation(X(p[1]), Y(p[2]) * k, Z(p[3]) + jit(i + p[1])); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; }); };
    F.sf.redraw();
  });
}
admi('#tk-gl'); admi('#admi-gl');

/* ---------------------------------------------------------------- Liberty 2 */
// The salt heap that was the cover, cut open to show what it was hiding.
(function salt() {
  const cv = $('#liberty2-gl'); if (!cv) return;
  const F = fig(cv, { dist: 17, distSmall: 19, target: [0, 0.9, 0], yaw: 0.62, pitch: 0.36, sway: 0.22 }); if (!F) return;
  const { plot, line, tag } = F;
  const cut = new THREE.Plane(new THREE.Vector3(0, 0, -1), 6);
  const cube = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const cells = [];
  for (let x = -4; x <= 4.01; x += 0.34) for (let z = -4; z <= 4.01; z += 0.34) {
    const h = 3.1 * Math.exp(-(x * x + z * z) / 5.2) + 0.12 * Math.sin(x * 3.1 + z * 1.7);
    const n = Math.max(0, Math.round(h / 0.33));
    for (let k = 0; k < n; k++) cells.push([x, 0.16 + k * 0.33, z]);
  }
  const salt = new THREE.InstancedMesh(cube, new THREE.MeshStandardMaterial({ color: 0xefebe2, roughness: 0.9 }), cells.length);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  cells.forEach((p, i) => { m4.makeTranslation(...p); salt.setMatrixAt(i, m4); salt.setColorAt(i, c.setHSL(0.11, 0.12, 0.86 + ((i * 37) % 9) / 100)); });
  plot.add(salt);
  // the ore inside
  const ore = new THREE.Group(); plot.add(ore);
  const rock = new THREE.DodecahedronGeometry(0.2, 0);
  for (let i = 0; i < 46; i++) {
    const a = i * 2.399, r = 1.5 * Math.sqrt(((i * 0.618) % 1)), y = 0.25 + ((i * 0.37) % 1) * 1.2;
    const m = new THREE.Mesh(rock, new THREE.MeshStandardMaterial({ color: i % 3 ? ACC : INK, roughness: 0.55, metalness: 0.1 }));
    m.position.set(Math.cos(a) * r, y, Math.sin(a) * r * 0.8); m.rotation.set(i, i * 1.3, i * 0.7); m.scale.setScalar(0.8 + (i % 4) * 0.18);
    ore.add(m);
  }
  // section frame that travels with the cut
  const frame = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-4.4, 0, 0], [4.4, 0, 0], [4.4, 3.3, 0], [-4.4, 3.3, 0]].map(p => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color: ACC, transparent: true, opacity: 0.7 }));
  plot.add(frame);
  line([[-4.6, 0, -4.6], [4.6, 0, -4.6]], 0.3); line([[-4.6, 0, -4.6], [-4.6, 0, 4.6]], 0.3);
  const t1 = tag('salt · what the trade showed', [-3.4, 3.3, -1.5], { size: 26, serif: true, italic: true });
  const t2 = tag('uranium · what it was for', [0.4, 2.35, 0], { size: 26, serif: true, italic: true, color: '#c4391f', depthTest: false });
  F.st.onFrame = t => {
    const p = (t % 12) / 12;                     // 0..1 loop
    const k = p < 0.15 ? 0 : p < 0.45 ? (p - 0.15) / 0.3 : p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2;
    const e = k * k * (3 - 2 * k), zc = 4.6 - e * 4.6;   // cut from the front to the middle
    frame.position.z = zc; frame.visible = e > 0.01;
    cells.forEach((q, i) => { if (q[2] > zc) m4.makeScale(0, 0, 0); else m4.identity(); m4.setPosition(...q); salt.setMatrixAt(i, m4); });
    salt.instanceMatrix.needsUpdate = true;
    t2.material.opacity = Math.max(0, (e - 0.6) / 0.4);
  };
})();

/* ---------------------------------------------------------------- World Famous Driver */
// A bus route through a cold grid of a city. Each lap he takes one more
// "small favour": a red detour to the edge of town that stays on the route.
(function wfd() {
  const cv = $('#wfd-gl'), out = $('#wfd-n'); if (!cv) return;
  const F = fig(cv, { dist: 22, distSmall: 25, target: [0, 0, 0], yaw: -0.45, pitch: 1.0, sway: 0.18, maxPitch: 1.4 }); if (!F) return;
  const { plot } = F;
  const blk = new THREE.BoxGeometry(1.1, 1, 1.1); blk.translate(0, 0.5, 0);
  const n = 7, city = new THREE.InstancedMesh(blk, new THREE.MeshStandardMaterial({ roughness: 0.95 }), n * n);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const k = i * n + j, h = 0.25 + (((i * 7 + j * 13) * 37) % 19) / 22;
    m4.makeScale(1, h, 1); m4.setPosition((i - 3) * 1.6, 0, (j - 3) * 1.6); city.setMatrixAt(k, m4);
    city.setColorAt(k, c.set(((i + j) % 3) ? 0xd6cfc1 : 0xc3bbac));
  }
  plot.add(city);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 12.4), new THREE.MeshBasicMaterial({ color: 0xe7e1d4 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; plot.add(ground);
  const V = (x, z) => new THREE.Vector3(x, 0.06, z);
  const loop = [[-2.4, -2.4], [-0.8, -2.4], [0.8, -2.4], [2.4, -2.4], [2.4, -0.8], [2.4, 0.8], [2.4, 2.4], [0.8, 2.4], [-0.8, 2.4], [-2.4, 2.4], [-2.4, 0.8], [-2.4, -0.8]].map(p => V(...p));
  const spurs = [[1, [[-0.8, -4], [-4, -4], [-4, -5.6]]], [4, [[4, -0.8], [4, -4]]], [6, [[4, 2.4], [4, 5.6]]], [7, [[0.8, 4], [5.6, 4]]], [10, [[-4, 0.8], [-4, 4], [-5.6, 4]]]]
    .map(([j, pts]) => ({ j, pts: pts.map(p => V(...p)) }));
  const ribbon = (pts, color, w = 0.16) => {
    const g = new THREE.Group();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = a.distanceTo(b);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, len + w), new THREE.MeshBasicMaterial({ color }));
      m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b.x, m.position.y, b.z); g.add(m);
    }
    plot.add(g); return g;
  };
  ribbon([...loop, loop[0]], INK);
  const red = spurs.map(s => { const g = ribbon([loop[s.j], ...s.pts], ACC, 0.13); const end = s.pts[s.pts.length - 1];
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), new THREE.MeshStandardMaterial({ color: ACC, roughness: 0.6 })); box.position.set(end.x, 0.21, end.z); g.add(box); g.visible = false; return g; });
  const bus = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.28), new THREE.MeshStandardMaterial({ color: INK, roughness: 0.5 })); body.position.y = 0.2; bus.add(body);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, 0.3), new THREE.MeshBasicMaterial({ color: ACC })); stripe.position.y = 0.26; bus.add(stripe);
  plot.add(bus);
  function lapPath(k) { // main loop with the first k spurs as out-and-back detours
    const act = new Map(spurs.slice(0, k).map(s => [s.j, s.pts]));
    const p = [];
    loop.forEach((v, i) => { p.push(v); if (act.has(i)) { const s = act.get(i); p.push(...s, ...s.slice(0, -1).reverse(), v); } });
    p.push(loop[0]);
    const d = [0]; for (let i = 1; i < p.length; i++) d.push(d[i - 1] + p[i].distanceTo(p[i - 1]));
    return { p, d, L: d[d.length - 1] };
  }
  const paths = [0, 1, 2, 3, 4, 5].map(lapPath);
  const SPEED = 3.2, laps = [0, 1, 2, 3, 4, 5, 5];
  const lapT = laps.map(k => paths[k].L / SPEED), cycle = lapT.reduce((a, b) => a + b, 0);
  let shown = -1;
  F.st.onFrame = t => {
    let u = REDUCE ? lapT[0] * 0.3 : t % cycle, li = 0;
    while (u > lapT[li]) { u -= lapT[li]; li++; }
    const k = laps[li], P = paths[k], dist = u * SPEED;
    red.forEach((g, i) => g.visible = i < k);
    let i = 1; while (i < P.d.length - 1 && P.d[i] < dist) i++;
    const a = P.p[i - 1], b = P.p[i], f = (dist - P.d[i - 1]) / Math.max(1e-6, P.d[i] - P.d[i - 1]);
    bus.position.lerpVectors(a, b, Math.min(1, f)); bus.position.y = 0.03;
    bus.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x);
    if (out && k !== shown) { shown = k; out.textContent = k === 0 ? 'The route as hired. No favours yet.' : `${k} favour${k > 1 ? 's' : ''} in. Each one stays on the route.`; }
  };
})();

/* ---------------------------------------------------------------- Spring */
// What a family inherits that isn't property: rings of things left unsaid pass
// from Devaraju to Vijay; Raju is the thread between them. The marriage lifts them.
(function spring() {
  const cv = $('#spring-gl'); if (!cv) return;
  const F = fig(cv, { dist: 15, distSmall: 17, target: [0, 1.6, 0], yaw: -0.28, pitch: 0.22, sway: 0.25 }); if (!F) return;
  const { plot, tag } = F;
  const pos = { dev: new THREE.Vector3(-2.6, 0, 0), vij: new THREE.Vector3(2.6, 0, 0), raj: new THREE.Vector3(0, 0, 1.6) };
  const pillar = (p, h, col) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, h, 32), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })); m.position.set(p.x, h / 2, p.z); plot.add(m); return m; };
  pillar(pos.dev, 3.6, INK); pillar(pos.vij, 3.0, INK); pillar(pos.raj, 2.3, 0xb9b0a1);
  tag('Devaraju', [pos.dev.x, 0.25, pos.dev.z + 0.75], { size: 32, serif: true, depthTest: false }); tag('Vijay', [pos.vij.x, 0.25, pos.vij.z + 0.75], { size: 32, serif: true, depthTest: false }); tag('Raju', [pos.raj.x, 0.25, pos.raj.z + 0.75], { size: 32, serif: true, depthTest: false });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(5.2, 64), new THREE.MeshBasicMaterial({ color: 0xe7e1d4 })); floor.rotation.x = -Math.PI / 2; plot.add(floor);
  const ringGeo = new THREE.TorusGeometry(0.62, 0.07, 12, 48);
  const N = 6, mk = col => new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, transparent: true }));
  const devR = [], vijR = [];
  for (let i = 0; i < N; i++) { const a = mk(0x6d655a); a.rotation.x = Math.PI / 2; plot.add(a); devR.push(a); const b = mk(0x6d655a); b.rotation.x = Math.PI / 2; plot.add(b); vijR.push(b); }
  // Raju's threads, with beads running both ways
  const thread = (a, b) => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x, 1.8, a.z), new THREE.Vector3(b.x, 1.8, b.z)]); plot.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.35 }))); };
  thread(pos.raj, pos.dev); thread(pos.raj, pos.vij);
  const beadGeo = new THREE.SphereGeometry(0.07, 10, 8), beads = [];
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(beadGeo, new THREE.MeshBasicMaterial({ color: ACC })); plot.add(m); beads.push(m); }
  const wed = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.05, 10, 96), new THREE.MeshStandardMaterial({ color: ACC, roughness: 0.4, transparent: true }));
  wed.rotation.x = Math.PI / 2; plot.add(wed);
  const wTag = tag('the marriage', [0, 4.6, 0], { size: 26, serif: true, italic: true, color: '#c4391f', depthTest: false });
  const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  F.st.onFrame = t => {
    const T = REDUCE ? 6.5 : t % 15;
    for (let i = 0; i < N; i++) {
      const y = 1.1 + i * 0.42;
      const lift = sm((T - 9 - i * 0.12) / 2.2);             // after the marriage, rings rise and go
      devR[i].position.set(pos.dev.x, y + lift * 3, 0); devR[i].material.opacity = 1 - lift;
      const k = sm((T - 0.6 - i * 0.9) / 0.8);               // copy travels to Vijay
      const from = new THREE.Vector3(pos.dev.x, y, 0), to = new THREE.Vector3(pos.vij.x, 0.9 + i * 0.36, 0);
      const p = from.lerp(to, k); p.y += Math.sin(k * Math.PI) * 1.4;
      vijR[i].position.copy(p); vijR[i].position.y += lift * 3; vijR[i].material.opacity = (k > 0.001 ? 1 : 0) * (1 - lift);
      vijR[i].scale.setScalar(0.92);
    }
    beads.forEach((b, i) => { const side = i % 2 ? pos.vij : pos.dev, f = ((t * 0.35 + i / 6) % 1); const fwd = i < 3; const q = fwd ? f : 1 - f;
      b.position.set(pos.raj.x + (side.x - pos.raj.x) * q, 1.8, pos.raj.z + (side.z - pos.raj.z) * q); });
    const w = sm((T - 7) / 1.4) * (1 - sm((T - 12.5) / 1.2));
    wed.position.y = 6 - 4.4 * sm((T - 7) / 1.6); wed.material.opacity = w; wTag.material.opacity = w;
  };
})();

/* ---------------------------------------------------------------- Choreopathia */
// Two crowds, 1518 below and now above. The dancing spreads through both at
// once, and one figure stands in both.
(function choreo() {
  const cv = $('#choreo-gl'); if (!cv) return;
  const F = fig(cv, { dist: 17, distSmall: 19, target: [0, 1.9, 0], yaw: -0.5, pitch: 0.42, sway: 0.2 }); if (!F) return;
  const { plot, tag, line } = F;
  const lv = [0, 3.8], N = 130, people = [];
  const capGeo = new THREE.CapsuleGeometry(0.06, 0.2, 4, 8); capGeo.translate(0, 0.16, 0);
  lv.forEach((y, L) => {
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.04, 5.2), new THREE.MeshStandardMaterial({ color: L ? 0xe9e3d6 : 0xd9d1c2, roughness: 1, transparent: true, opacity: L ? 0.92 : 1 }));
    sheet.position.y = y - 0.02; plot.add(sheet);
    const im = new THREE.InstancedMesh(capGeo, new THREE.MeshStandardMaterial({ roughness: 0.6 }), N);
    const pts = [];
    for (let i = 0; i < N; i++) { const a = i * 2.399 + L, r = 2.4 * Math.sqrt((i + 0.5) / N); pts.push([Math.cos(a) * r * 1.35, y, Math.sin(a) * r * 0.95, r]); }
    plot.add(im); people.push({ im, pts });
  });
  tag('1518', [-3.9, lv[0] + 0.25, 2.3], { size: 30, serif: true, weight: 600, align: 'right' });
  tag('now', [-3.9, lv[1] + 0.25, 2.3], { size: 30, serif: true, weight: 600, align: 'right' });
  const thread = line([[0, lv[0] + 0.3, 0], [0, lv[1], 0]], 0.8, ACC);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(), e = new THREE.Euler(), S = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
  F.st.onFrame = t => {
    const T = REDUCE ? 6 : t % 13, front = Math.max(0, (T - 1.2) * 0.42);  // radius the dancing has reached
    const fade = 1 - Math.min(1, Math.max(0, (T - 11.5) / 1.2));
    people.forEach(({ im, pts }, L) => {
      pts.forEach(([x, y, z, r], i) => {
        const on = (r < front ? 1 : 0) * fade, ph = i * 1.7 + L * 0.5;
        const sx = on * Math.cos(t * 4 + ph) * 0.09, sz = on * Math.sin(t * 4 + ph) * 0.09, hop = on * Math.abs(Math.sin(t * 6 + ph)) * 0.12;
        e.set(on * Math.sin(t * 5 + ph) * 0.45, t * 3 * on + ph, on * Math.cos(t * 5 + ph) * 0.45); q.setFromEuler(e);
        m4.compose(P.set(x + sx, y + hop, z + sz), q, S); im.setMatrixAt(i, m4);
        im.setColorAt(i, c.set(i === 0 ? ACC : on ? 0xa8402c : INK));
      });
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
    });
    thread.material.opacity = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.2));
  };
})();

/* ---------------------------------------------------------------- Scarlet */
// No story yet, so nothing to plot: a page where lines go in and come back out.
(function scarlet() {
  const cv = $('#scarlet-gl'); if (!cv) return;
  const F = fig(cv, { dist: 9.5, distSmall: 11, target: [0, 0, 0], yaw: -0.35, pitch: 0.75, sway: 0.15, maxPitch: 1.45 }); if (!F) return;
  const { plot } = F;
  const page = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.05, 5.6), new THREE.MeshStandardMaterial({ color: 0xfbf9f4, roughness: 0.95 }));
  plot.add(page);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 5.9), new THREE.MeshBasicMaterial({ color: 0x1c1a17, transparent: true, opacity: 0.08 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(0.12, -0.04, 0.12); plot.add(shadow);
  const title = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.16), new THREE.MeshBasicMaterial({ color: ACC })); title.position.set(-0.9, 0.04, -2.2); plot.add(title);
  const lines = [], widths = [3.2, 2.7, 3.0, 1.9, 3.1, 2.4, 2.9, 1.4];
  widths.forEach((w, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 0.07), new THREE.MeshBasicMaterial({ color: INK })); m.position.set(0, 0.04, -1.6 + i * 0.42); plot.add(m); lines.push([m, w]); });
  const cur = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.2), new THREE.MeshBasicMaterial({ color: ACC })); plot.add(cur);
  F.st.onFrame = t => {
    const T = REDUCE ? 3 : t % 11;
    // type for ~5s, hold, then everything after line 2 is deleted back
    let typed = Math.min(T / 5, 1) * widths.length;
    const del = T > 7 ? Math.min(1, (T - 7) / 2.5) : 0;
    typed = typed - del * (widths.length - 2);
    let cx = -2, cz = -1.6;
    lines.forEach(([m, w], i) => {
      const f = Math.max(0, Math.min(1, typed - i)), len = Math.max(0.0001, w * f);
      m.scale.x = len; m.position.x = -1.7 + len / 2; m.visible = f > 0;
      if (f > 0) { cx = -1.7 + len + 0.08; cz = m.position.z; }
    });
    cur.position.set(cx, 0.05, cz); cur.visible = Math.floor(t * 2) % 2 === 0;
  };
})();
