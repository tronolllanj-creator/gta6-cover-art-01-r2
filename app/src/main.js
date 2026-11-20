// NEON COAST COVER LAB — editor wiring (round 2)
// Owns the page state, loads the two kit photos plus any photo the user
// uploads (read on their machine, never sent anywhere), wires the toolbar
// and renders the preview canvas. Drag on the preview to pan the selected
// panel, scroll to zoom it. Shot mode (?shot=cover|editor) is handed to
// shots.js instead. Export draws the same cover at full export size.

import { LAYOUTS, GRADES, SIZES, PHOTOS, PRESETS, findLayout, findGrade, findSize, findPreset, defaultState } from './presets.js';
import { drawCover } from './cover.js';
import { stageShot } from './shots.js';

const state = defaultState();
const images = {};
const uploaded = [];
for (const p of PHOTOS) {
  const img = new Image();
  img.src = p.path;
  images[p.id] = img;
}

const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

window.onerror = (message, source, lineno, colno, error) => {
  window.__shotError = { message, source, lineno, colno, error: error ? String(error) : null };
  return false;
};

// Undo / redo: snapshots of the whole state, capped at 30 steps.
const history = [];
let future = [];
function snapshot() {
  return JSON.stringify(state);
}
function pushHistory() {
  history.push(snapshot());
  if (history.length > 30) history.shift();
  future = [];
  refreshUndo();
}
function restore(json) {
  const next = JSON.parse(json);
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, next);
  rebuildPanelPicker();
  rebuildPhotoChips();
  refreshControls();
  paintPreview();
}
function undo() {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  refreshUndo();
}
function redo() {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  refreshUndo();
}
function refreshUndo() {
  const u = $('undo');
  const r = $('redo');
  if (u) u.disabled = !history.length;
  if (r) r.disabled = !future.length;
}

function paintPreview() {
  const canvas = $('cover');
  if (!canvas) return;
  const box = canvas.parentElement;
  const rect = box ? box.getBoundingClientRect() : { width: 800, height: 600 };
  const W = Math.max(1, Math.floor(rect.width));
  const H = Math.max(1, Math.floor(rect.height));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const ready = PHOTOS.every((p) => images[p.id].complete && images[p.id].naturalWidth);
  if (ready) {
    drawCover(ctx, images, state, W, H);
  } else {
    ctx.fillStyle = '#14101c';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f5efe4';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading photos…', W / 2, H / 2);
  }
}

function refreshControls() {
  $$('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  $$('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  $$('[data-preset]').forEach((b) => b.classList.toggle('active', false));
  $$('[data-photo]').forEach((b) => {
    const panel = state.panels[state.selected];
    b.classList.toggle('active', !!panel && panel.photo === b.dataset.photo);
  });
  const sizeSel = $('size');
  if (sizeSel) sizeSel.value = state.size;
  const panelSel = $('panel');
  if (panelSel) panelSel.value = String(state.selected);
  const panel = state.panels[state.selected];
  if (panel) {
    $('zoom').value = String(panel.zoom);
    $('dx').value = String(panel.dx);
    $('dy').value = String(panel.dy);
    $('zoom-out').textContent = panel.zoom.toFixed(2);
    $('dx-out').textContent = panel.dx.toFixed(2);
    $('dy-out').textContent = panel.dy.toFixed(2);
  }
  $('heat').value = String(state.heat);
  $('heat-out').textContent = `${state.heat} / 5`;
  $('grain').value = String(state.grain);
  $('grain-out').textContent = `${Math.round(state.grain * 100)}%`;
  const ts = $('titlestyle');
  if (ts) ts.value = state.titleStyle;
  $('caption').value = state.caption;
  $('tagline').value = state.tagline;
  $('subtitle').value = state.subtitle;
  const count = $('panelcount');
  if (count) count.textContent = `${findLayout(state.layout).panels.length} panels · ${findGrade(state.grade).label} grade`;
}

function rebuildPanelPicker() {
  const panelSel = $('panel');
  if (!panelSel) return;
  panelSel.innerHTML = '';
  findLayout(state.layout).panels.forEach((_, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Panel ${i + 1}`;
    panelSel.appendChild(opt);
  });
  if (state.selected >= findLayout(state.layout).panels.length) state.selected = 0;
}

function rebuildPhotoChips() {
  const wrap = $('photochips');
  if (!wrap) return;
  wrap.innerHTML = '';
  const all = [...PHOTOS, ...uploaded];
  for (const p of all) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.photo = p.id;
    b.textContent = p.label;
    b.addEventListener('click', () => {
      pushHistory();
      const panel = state.panels[state.selected];
      if (panel) panel.photo = p.id;
      refreshControls();
      paintPreview();
    });
    wrap.appendChild(b);
  }
}

function applyPreset(preset) {
  pushHistory();
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.caption = preset.caption;
  state.tagline = preset.tagline;
  state.subtitle = preset.subtitle;
  state.heat = preset.heat;
  rebuildPanelPicker();
  refreshControls();
  paintPreview();
  $('status').textContent = `Preset: ${preset.label}`;
}

function exportOne(sizeId) {
  const size = findSize(sizeId);
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  const ctx = off.getContext('2d');
  if (!ctx) return;
  drawCover(ctx, images, state, size.w, size.h);
  const a = document.createElement('a');
  a.download = `neon-coast-cover-${size.id}.png`;
  a.href = off.toDataURL('image/png');
  a.click();
  $('status').textContent = `Exported ${size.w}x${size.h} PNG`;
}

function exportAll() {
  for (const s of SIZES) exportOne(s.id);
  $('status').textContent = 'Exported all 3 sizes (1080x1080, 1080x1350, 1920x1080)';
}

function shuffle() {
  pushHistory();
  state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
  state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
  rebuildPanelPicker();
  refreshControls();
  paintPreview();
}

function bindUpload() {
  const input = $('upload');
  if (!input) return;
  input.addEventListener('change', () => {
    const files = Array.from(input.files || []).slice(0, 6);
    for (const file of files) {
      const id = `up${uploaded.length}`;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          images[id] = img;
          uploaded.push({ id, label: file.name.replace(/\.[^.]+$/, '').slice(0, 12) || 'Photo' });
          rebuildPhotoChips();
          refreshControls();
          paintPreview();
          $('status').textContent = `Loaded ${file.name} — kept on this machine`;
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  });
}

function bindDragPan() {
  const canvas = $('cover');
  if (!canvas) return;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    pushHistory();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const panel = state.panels[state.selected];
    if (!panel) return;
    const rect = canvas.getBoundingClientRect();
    panel.dx = Math.max(-0.5, Math.min(0.5, panel.dx + (e.clientX - lastX) / rect.width));
    panel.dy = Math.max(-0.5, Math.min(0.5, panel.dy + (e.clientY - lastY) / rect.height));
    lastX = e.clientX;
    lastY = e.clientY;
    refreshControls();
    paintPreview();
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Math.max(1, Math.min(2.5, panel.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
    refreshControls();
    paintPreview();
  }, { passive: false });
  // Click a panel region to select it: pick the panel whose rect holds the point.
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const layout = findLayout(state.layout);
    const idx = layout.panels.findIndex((r) => fx >= r.x && fx <= r.x + r.w && fy >= r.y && fy <= r.y + r.h);
    if (idx >= 0 && idx !== state.selected) {
      state.selected = idx;
      refreshControls();
      paintPreview();
    }
  });
}

function bind() {
  $$('[data-layout]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.layout = b.dataset.layout;
    rebuildPanelPicker();
    refreshControls();
    paintPreview();
  }));
  $$('[data-grade]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.grade = b.dataset.grade;
    refreshControls();
    paintPreview();
  }));
  $$('[data-preset]').forEach((b) => b.addEventListener('click', () => {
    applyPreset(findPreset(b.dataset.preset));
  }));
  $('size').addEventListener('change', (e) => {
    state.size = e.target.value;
    refreshControls();
    paintPreview();
  });
  $('panel').addEventListener('change', (e) => {
    const idx = Number.parseInt(e.target.value, 10);
    if (Number.isInteger(idx) && idx >= 0 && idx < state.panels.length) {
      state.selected = idx;
      refreshControls();
      paintPreview();
    }
  });
  $('caption').addEventListener('input', (e) => { state.caption = e.target.value; paintPreview(); });
  $('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; paintPreview(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; paintPreview(); });
  $('titlestyle').addEventListener('change', (e) => {
    pushHistory();
    state.titleStyle = e.target.value;
    refreshControls();
    paintPreview();
  });
  for (const [id, key] of [['zoom', 'zoom'], ['dx', 'dx'], ['dy', 'dy']]) {
    $(id).addEventListener('focus', () => pushHistory());
    $(id).addEventListener('input', (e) => {
      const v = Number.parseFloat(e.target.value);
      const panel = state.panels[state.selected];
      if (!Number.isNaN(v) && panel) {
        panel[key] = v;
        refreshControls();
        paintPreview();
      }
    });
  }
  $('heat').addEventListener('focus', () => pushHistory());
  $('grain').addEventListener('focus', () => pushHistory());
  $('heat').addEventListener('input', (e) => {
    state.heat = Number.parseInt(e.target.value, 10) || 0;
    refreshControls();
    paintPreview();
  });
  $('grain').addEventListener('input', (e) => {
    state.grain = Number.parseFloat(e.target.value) || 0;
    refreshControls();
    paintPreview();
  });
  $('export').addEventListener('click', () => exportOne(state.size));
  $('exportall').addEventListener('click', exportAll);
  $('shuffle').addEventListener('click', shuffle);
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  $('reset').addEventListener('click', () => {
    pushHistory();
    const fresh = defaultState();
    for (const k of Object.keys(state)) delete state[k];
    Object.assign(state, fresh);
    rebuildPanelPicker();
    rebuildPhotoChips();
    refreshControls();
    paintPreview();
  });
  bindUpload();
  bindDragPan();
}

function boot() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  const canvas = $('cover');
  const ctx = canvas.getContext('2d');
  const photosReady = Promise.all(PHOTOS.map((p) => new Promise((resolve) => {
    const img = images[p.id];
    if (img.complete) resolve();
    else { img.onload = () => resolve(); img.onerror = () => resolve(); }
  })));
  photosReady.then(() => {
    if (shot === 'cover' || shot === 'editor') {
      rebuildPanelPicker();
      rebuildPhotoChips();
      stageShot(shot, canvas, ctx, images, state);
      // Refresh after stageShot: its overrides change layout/grade/words,
      // and the chips must show the shot's look, not the defaults.
      refreshControls();
    } else {
      rebuildPanelPicker();
      rebuildPhotoChips();
      bind();
      refreshControls();
      refreshUndo();
      paintPreview();
      $('status').textContent = 'Ready — pick a photo, a layout, a grade, export';
    }
  });
  window.addEventListener('resize', () => {
    if (!new URLSearchParams(window.location.search).get('shot')) paintPreview();
  });
}

boot();
