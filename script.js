/* ============================================================
   SnoSite — script.js
   1. The crystal   — procedurally generated, six-fold, never the same twice
   2. Page systems  — nav, scroll progress, scrollspy, reveals
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   1. THE CRYSTAL
   Every visitor gets a different snowflake. That's the whole brand:
   a real crystal grows from its own conditions and never repeats —
   and neither does a hand-built website.

   How it works:
   - A seeded random number generator (mulberry32) makes each crystal
     reproducible from a single number, which we show as its ID.
   - We grow ONE arm: a spine, a few branches, some sub-branches.
   - Each branch is mirrored left/right (real flakes are symmetric).
   - That arm is drawn six times, rotated 60° each — six-fold symmetry.
   - Growth is animated outward from the centre, like the real thing.
   ============================================================ */

const canvas = document.getElementById('crystal');
const ctx = canvas.getContext('2d');
const idEl = document.getElementById('crystalId');
const regrowBtn = document.getElementById('regrow');

/* --- seeded PRNG: same seed in, same crystal out --- */
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

let segments = [];   // {x1,y1,x2,y2,d1,d2,w}  — d = distance from centre
let nodes = [];      // {x,y,d,r}
let maxDist = 0;
let growth = 0;      // animated 0 → maxDist
let spin = 0;
let seed = 0;

/* --- grow one arm, then mirror + rotate it into a full crystal --- */
function generate(newSeed){
  seed = newSeed;
  const rand = mulberry32(seed);
  const R = 100;                       // arm length in local units

  const raw = [];                      // one arm, before rotation
  const rawNodes = [];

  // the spine: centre → tip
  raw.push({ x1:0, y1:0, x2:0, y2:-R, w:2.4 });
  rawNodes.push({ x:0, y:-R, r:3.2 });

  // branches along the spine
  const count = 3 + Math.floor(rand() * 3);          // 3–5 branch points
  for (let i = 0; i < count; i++){
    const t = 0.24 + (i / count) * 0.62 + rand() * 0.06;   // where on the spine
    const by = -t * R;
    const angle = (48 + rand() * 22) * Math.PI / 180;       // spread from spine
    const len = (0.5 - t * 0.32) * R * (0.75 + rand() * 0.6);
    if (len < 6) continue;

    rawNodes.push({ x:0, y:by, r:1.9 });

    // mirrored pair — left and right
    for (const dir of [-1, 1]){
      const ex = dir * Math.sin(angle) * len;
      const ey = by - Math.cos(angle) * len;
      raw.push({ x1:0, y1:by, x2:ex, y2:ey, w:1.7 });
      rawNodes.push({ x:ex, y:ey, r:1.5 });

      // sub-branches, sometimes
      if (rand() > 0.45 && len > 16){
        const q = 0.5 + rand() * 0.3;
        const sx = dir * Math.sin(angle) * len * q;
        const sy = by - Math.cos(angle) * len * q;
        const sLen = len * (0.3 + rand() * 0.25);
        const sAngle = angle + (rand() * 0.5 - 0.25);
        raw.push({
          x1:sx, y1:sy,
          x2:sx + dir * Math.sin(sAngle) * sLen,
          y2:sy - Math.cos(sAngle) * sLen,
          w:1.1
        });
      }
    }
  }

  // a hexagonal plate near the centre — real flakes have one
  const plate = 12 + rand() * 8;
  for (let k = 0; k < 6; k++){
    const a1 = (k * 60 - 90) * Math.PI / 180;
    const a2 = ((k + 1) * 60 - 90) * Math.PI / 180;
    raw.push({
      x1:Math.cos(a1) * plate, y1:Math.sin(a1) * plate,
      x2:Math.cos(a2) * plate, y2:Math.sin(a2) * plate,
      w:1
    });
  }

  // rotate the arm six times → the full crystal
  segments = [];
  nodes = [];
  maxDist = 0;

  const rot = (x, y, deg) => {
    const a = deg * Math.PI / 180;
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  };
  const dist = (x, y) => Math.hypot(x, y);

  for (let k = 0; k < 6; k++){
    const deg = k * 60;
    for (const s of raw){
      const [x1, y1] = rot(s.x1, s.y1, deg);
      const [x2, y2] = rot(s.x2, s.y2, deg);
      const d1 = dist(x1, y1), d2 = dist(x2, y2);
      segments.push({ x1, y1, x2, y2, d1, d2, w:s.w });
      maxDist = Math.max(maxDist, d1, d2);
    }
    for (const n of rawNodes){
      const [x, y] = rot(n.x, n.y, deg);
      const d = dist(x, y);
      nodes.push({ x, y, d, r:n.r });
      maxDist = Math.max(maxDist, d);
    }
  }

  growth = reduceMotion ? maxDist : 0;
  if (idEl) idEl.textContent = 'crystal_' + seed.toString(16).padStart(4, '0').slice(-4);
}

/* --- size the canvas to its box, sharp on retina --- */
function resize(){
  const box = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = box.width * dpr;
  canvas.height = box.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* --- draw --- */
function draw(){
  const box = canvas.getBoundingClientRect();
  const w = box.width, h = box.height;
  ctx.clearRect(0, 0, w, h);
  if (!w) return;

  const scale = (Math.min(w, h) / 2) * 0.88 / 100;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(spin);
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';

  // lines
  for (const s of segments){
    if (growth < s.d1) continue;
    let { x2, y2 } = s;
    if (growth < s.d2){                       // partially grown
      const t = (growth - s.d1) / (s.d2 - s.d1 || 1);
      x2 = s.x1 + (s.x2 - s.x1) * t;
      y2 = s.y1 + (s.y2 - s.y1) * t;
    }
    // colour runs frost → ice as it moves outward
    const mix = Math.min(s.d2 / maxDist, 1);
    ctx.strokeStyle = mix > 0.62 ? '#7dd3fc' : '#3b82f6';
    ctx.globalAlpha = 0.55 + mix * 0.45;
    ctx.lineWidth = s.w;
    ctx.shadowColor = mix > 0.62 ? 'rgba(125,211,252,.9)' : 'rgba(59,130,246,.9)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // nodes
  for (const n of nodes){
    if (growth < n.d) continue;
    const mix = Math.min(n.d / maxDist, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = mix > 0.62 ? '#7dd3fc' : '#3b82f6';
    ctx.shadowColor = 'rgba(125,211,252,.9)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function tick(){
  if (growth < maxDist) growth += maxDist / 90;    // ~1.5s to full size
  if (!reduceMotion) spin += 0.0006;               // very slow drift
  draw();
  requestAnimationFrame(tick);
}

if (canvas){
  const newSeed = () => Math.floor(Math.random() * 65535);
  resize();
  generate(newSeed());
  draw();
  if (!reduceMotion) tick(); 

  if (regrowBtn) regrowBtn.addEventListener('click', () => {
    generate(newSeed());
  });

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { resize(); draw(); }, 120);
  });
}

/* ============================================================
   2. PAGE SYSTEMS
   ============================================================ */

/* --- nav background + scroll progress bar --- */
const nav = document.getElementById('nav');
const progress = document.getElementById('progress');

function onScroll(){
  nav.classList.toggle('stuck', window.scrollY > 12);
  const max = document.body.scrollHeight - window.innerHeight;
  progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
}
window.addEventListener('scroll', onScroll, { passive:true });
onScroll();

/* --- mobile menu --- */
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
navLinks.addEventListener('click', e => {
  if (e.target.tagName === 'A'){
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

/* --- reveal on scroll --- */
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold:0.05, rootMargin:'0px 0px 0px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 25 + 'ms';
  io.observe(el);
});

/* --- scrollspy: highlight the section you're in --- */
const spy = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      const id = entry.target.id;
      document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    }
  });
}, { rootMargin:'-45% 0px -50% 0px' });

document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));

/* ============================================================
   3. EFFECTS — snowflake rain + binary rain
   ============================================================ */

function injectKeyframes(id, css) {
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
  }
}

function rainSnowflakes() {
  injectKeyframes('snowfall-style',
    `@keyframes snowfall{0%{transform:translateY(0) rotate(0deg);opacity:.9}80%{opacity:.6}100%{transform:translateY(110vh) rotate(360deg);opacity:0}}`
  );
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(wrap);
  for (let i = 0; i < 55; i++) {
    const f = document.createElement('span');
    const size = 12 + Math.random() * 24;
    f.textContent = '❄';
    f.style.cssText = `position:absolute;left:${Math.random()*100}%;top:-30px;font-size:${size}px;color:white;text-shadow:0 0 8px rgba(125,211,252,.8);animation:snowfall ${2+Math.random()*2}s ${Math.random()*2}s ease-in forwards;`;
    wrap.appendChild(f);
  }
  setTimeout(() => {
    wrap.style.transition = 'opacity 1s ease';
    wrap.style.opacity = '0';
    setTimeout(() => wrap.remove(), 1000);
  }, 3000);
}

function rainBinary(onDone) {
  injectKeyframes('binary-style',
    `@keyframes binaryfall{0%{transform:translateY(0);opacity:1}100%{transform:translateY(110vh);opacity:0}}`
  );
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(wrap);
  for (let i = 0; i < 70; i++) {
    const f = document.createElement('span');
    const size = 10 + Math.random() * 16;
    const dur = 1.8 + Math.random() * 1.4;
    const delay = Math.random() * 1.2;
    f.textContent = Math.random() > 0.5 ? '1' : '0';
    f.style.cssText = `position:absolute;left:${Math.random()*100}%;top:-20px;font-family:monospace;font-weight:700;font-size:${size}px;color:rgba(125,211,252,${0.5+Math.random()*0.5});text-shadow:0 0 10px rgba(59,130,246,.9);animation:binaryfall ${dur}s ${delay}s linear forwards;`;
    wrap.appendChild(f);
  }
  setTimeout(() => {
    wrap.style.transition = 'opacity 0.4s ease';
    wrap.style.opacity = '0';
    setTimeout(() => { wrap.remove(); if (onDone) onDone(); }, 400);
  }, 2800);
}

/* --- logo click → snowflake rain --- */
document.querySelectorAll('.brand').forEach(el => {
  el.addEventListener('click', () => rainSnowflakes());
});

/* --- monitor click → binary rain --- */
const monitor = document.getElementById('aboutMonitor');
if (monitor) monitor.addEventListener('click', () => rainBinary());

/* --- thesis box click → snowflake rain --- */
const thesisBox = document.getElementById('thesisBox');
if (thesisBox) thesisBox.addEventListener('click', () => rainSnowflakes());

/* --- work card links → binary rain then open --- */
document.querySelectorAll('.work-card[href]').forEach(card => {
  card.addEventListener('click', e => {
    e.preventDefault();
    const href = card.href;
    rainBinary(() => window.open(href, '_blank'));
  });
});

/* --- contact form --- */
const quoteForm = document.getElementById('quoteForm');
if (quoteForm) {
  quoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = quoteForm.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    try {
      const res = await fetch(quoteForm.action, {
        method: 'POST',
        body: new FormData(quoteForm),
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        quoteForm.innerHTML = '<p style="text-align:center;padding:40px 0;font-family:var(--display);font-size:20px;color:var(--ice)">✓ Message sent!<br><span style="font-size:15px;color:var(--slate);font-family:var(--body)">We\'ll be in touch within a day.</span></p>';
      } else {
        btn.textContent = 'Send it over';
        btn.disabled = false;
        alert('Something went wrong. Please try again or email us directly.');
      }
    } catch {
      btn.textContent = 'Send it over';
      btn.disabled = false;
      alert('Something went wrong. Please try again or email us directly.');
    }
  });
}

/* --- year --- */
document.getElementById('year').textContent = new Date().getFullYear();
