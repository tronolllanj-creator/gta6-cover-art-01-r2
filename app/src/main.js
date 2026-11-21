// Neon Coast Cover Lab — wires the page: photos, layouts, grades, title,
// drag-to-pan per panel, zoom, and PNG export in three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead.
import { drawCover, GRADES, LAYOUTS, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const statusEl = document.getElementById('status');
const zoomSlider = document.getElementById('zoom');
const panelLabel = document.getElementById('panelLabel');

const state = {
  layout: 'slash',
  grade: 'vice',
  title: 'NEON COAST',
  subtitle: 'SUNSET HEIST ON THE COAST',
  size: '1920x1080',
  panels: [
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
  ],
};
let selected = 0;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function previewSize() {
  const s = SIZES[state.size];
  const scale = 880 / Math.max(s.w, s.h);
  return { w: Math.round(s.w * scale), h: Math.round(s.h * scale) };
}

function redraw() {
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  panelLabel.textContent = `Panel ${selected + 1} of ${panelCount()} — drag the cover to move it, scroll to zoom`;
  zoomSlider.value = String(Math.round((state.panels[selected].zoom - 1) * 100));
}

function panelCount() {
  return state.layout === 'slash' ? 2 : 3;
}

function setLayout(layout) {
  state.layout = layout;
  document.querySelectorAll('[data-layout]').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === layout));
  if (selected >= panelCount()) selected = 0;
  redraw();
}

function setGrade(grade) {
  state.grade = grade;
  document.querySelectorAll('[data-grade]').forEach((b) =>
    b.classList.toggle('active', b.dataset.grade === grade));
  redraw();
}

function setSize(size) {
  state.size = size;
  document.querySelectorAll('[data-size]').forEach((b) =>
    b.classList.toggle('active', b.dataset.size === size));
  redraw();
}

document.querySelectorAll('[data-layout]').forEach((b) =>
  b.addEventListener('click', () => setLayout(b.dataset.layout)));
document.querySelectorAll('[data-grade]').forEach((b) =>
  b.addEventListener('click', () => setGrade(b.dataset.grade)));
document.querySelectorAll('[data-size]').forEach((b) =>
  b.addEventListener('click', () => setSize(b.dataset.size)));

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
zoomSlider.addEventListener('input', () => {
  state.panels[selected].zoom = 1 + Number(zoomSlider.value) / 100;
  redraw();
});

// one file input per panel slot
document.querySelectorAll('[data-photo]').forEach((input) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const i = Number(input.dataset.photo);
    state.panels[i].img = await loadImage(URL.createObjectURL(file));
    selected = i;
    redraw();
    statusEl.textContent = `Photo ${i + 1} loaded — drag it into place.`;
  });
});

document.getElementById('fillAll').addEventListener('click', () => {
  const first = state.panels.find((p) => p.img);
  if (!first) { statusEl.textContent = 'Load a photo first, then Fill all.'; return; }
  state.panels.forEach((p) => { p.img = first.img; });
  redraw();
  statusEl.textContent = 'One photo fills every panel.';
});

// drag to pan the selected panel; wheel zooms it; click picks a panel
let dragging = false;
let lastX = 0;
let lastY = 0;

function panelAt(cx, cy) {
  const rect = canvas.getBoundingClientRect();
  const px = (cx - rect.left) * (canvas.width / rect.width);
  const py = (cy - rect.top) * (canvas.height / rect.height);
  const w = canvas.width;
  const h = canvas.height;
  if (state.layout === 'slash') {
    const slope = h * 0.28;
    const band = w * 0.16;
    const edge = h - slope - band + ((px / w) * (2 * band));
    return py < edge ? 0 : 1;
  }
  if (state.layout === 'hero') {
    const top = Math.round(h * 0.60);
    if (py < top) return 0;
    return px < w / 2 ? 1 : 2;
  }
  const pw = w / 3;
  return Math.min(2, Math.floor(px / pw));
}

canvas.addEventListener('pointerdown', (e) => {
  selected = panelAt(e.clientX, e.clientY);
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = state.panels[selected];
  p.ox = Math.max(-1, Math.min(1, p.ox + (e.clientX - lastX) / canvas.clientWidth * 2));
  p.oy = Math.max(-1, Math.min(1, p.oy + (e.clientY - lastY) / canvas.clientHeight * 2));
  lastX = e.clientX;
  lastY = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[selected];
  p.zoom = Math.max(1, Math.min(2.5, p.zoom - Math.sign(e.deltaY) * 0.08));
  redraw();
}, { passive: false });

async function exportPNG(key) {
  const s = SIZES[key];
  const off = document.createElement('canvas');
  off.width = s.w;
  off.height = s.h;
  drawCover(off, state);
  const blob = await new Promise((res) => off.toBlob(res, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `neon-coast-${key}.png`;
  a.click();
  statusEl.textContent = `Saved neon-coast-${key}.png`;
}

document.querySelectorAll('[data-export]').forEach((b) =>
  b.addEventListener('click', () => exportPNG(b.dataset.export)));

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, setLayout, setGrade, setSize, redraw);
} else {
  // default samples so the first paint already looks like a cover
  (async () => {
    try {
      const [a, b, c] = await Promise.all([
        loadImage('samples/sunset.jpg'),
        loadImage('samples/neon.jpg'),
        loadImage('samples/palms.jpg'),
      ]);
      state.panels[0].img = a;
      state.panels[1].img = b;
      state.panels[2].img = c;
      redraw();
    } catch {
      redraw();
    }
  })();
}
