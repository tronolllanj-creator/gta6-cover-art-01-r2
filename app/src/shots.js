// NEON COAST COVER LAB — screenshot staging (round 2)
// ?shot=cover renders the cover full-bleed (chrome hidden); ?shot=editor
// keeps the editor visible and paints the preview canvas. Optional
// ?photo=pier|boulevard forces every panel to that photo,
// ?caption=TEXT replaces the caption, ?layout= and ?grade= pick a layout
// and grade, ?preset= applies a mood preset. Both modes set
// window.__shotReady once the frame is painted twice (second paint
// settles any async image decode), and never use randomness.

import { drawCover } from './cover.js';
import { findPreset } from './presets.js';

function readShotParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot'),
    photo: q.get('photo'),
    caption: q.get('caption'),
    layout: q.get('layout'),
    grade: q.get('grade'),
    preset: q.get('preset'),
    tagline: q.get('tagline'),
    subtitle: q.get('subtitle'),
  };
}

function applyOverrides(state, params) {
  if (params.preset) {
    const p = findPreset(params.preset);
    state.layout = p.layout;
    state.grade = p.grade;
    state.caption = p.caption;
    state.tagline = p.tagline;
    state.subtitle = p.subtitle;
    state.heat = p.heat;
  }
  if (params.layout) state.layout = params.layout;
  if (params.grade) state.grade = params.grade;
  if (params.photo === 'pier' || params.photo === 'boulevard') {
    for (const panel of state.panels) panel.photo = params.photo;
  }
  if (params.caption) state.caption = params.caption;
  if (params.tagline) state.tagline = params.tagline;
  if (params.subtitle) state.subtitle = params.subtitle;
}

function paintTwice(canvas, ctx, images, state) {
  const W = canvas.width;
  const H = canvas.height;
  drawCover(ctx, images, state, W, H);
  requestAnimationFrame(() => {
    drawCover(ctx, images, state, W, H);
    window.__shotReady = true;
  });
}

export function stageShot(shot, canvas, ctx, images, state) {
  const params = readShotParams();
  applyOverrides(state, params);
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    paintTwice(canvas, ctx, images, state);
  } else if (shot === 'editor') {
    const status = document.getElementById('status');
    if (status) status.textContent = 'Editor — photo loaded, cover live';
    const box = canvas.parentElement;
    const rect = box ? box.getBoundingClientRect() : { width: 1280, height: 720 };
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
    paintTwice(canvas, ctx, images, state);
  }
}
