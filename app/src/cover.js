// NEON COAST COVER LAB — cover renderer (round 2)
// Draws one cover onto any 2d canvas context: photo panels (cover-fit
// with per-panel zoom + pan, optional tilt), white frame lines, grade
// colour washes, a vignette, then the title band — halftone dots, a
// gradient big title with ink outline, a glowing script subtitle, a gold
// rule, a badge pill and a 5-star heat meter — and seeded film grain.
// Pure function of (images, state, W, H); no Date, no Math.random, no
// network, so every export is reproducible.

import { findGrade, findLayout } from './presets.js';

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Deterministic 0..1 hash of an integer seed — the grain source. Same
// seed always gives the same dots, so preview and export match.
function hash01(n) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = (x * 2246822519) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

function paintPanel(ctx, img, px, py, pw, ph, zoom, dx, dy, rot) {
  if (!img || !img.naturalWidth) return;
  const sw = img.naturalWidth / zoom;
  const sh = img.naturalHeight / zoom;
  let sx = (img.naturalWidth - sw) / 2 - dx * sw;
  let sy = (img.naturalHeight - sh) / 2 - dy * sh;
  sx = clamp(sx, 0, img.naturalWidth - sw);
  sy = clamp(sy, 0, img.naturalHeight - sh);
  ctx.save();
  if (rot) {
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate(rot);
    ctx.translate(-pw / 2, -ph / 2);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, pw, ph);
    ctx.shadowColor = 'transparent';
    px = 0; py = 0;
  }
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
  ctx.restore();
}

function paintFrames(ctx, W, H, layout) {
  const comic = layout.id === 'comic';
  ctx.save();
  ctx.strokeStyle = comic ? 'rgba(10,10,14,0.95)' : 'rgba(255,255,255,0.92)';
  ctx.lineWidth = comic ? Math.max(4, W * 0.006) : Math.max(2, W * 0.003);
  for (const r of layout.panels) {
    const px = r.x * W;
    const py = r.y * H;
    const pw = r.w * W;
    const ph = r.h * H;
    if (r.rot) {
      ctx.save();
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(r.rot);
      ctx.strokeRect(-pw / 2 + 2, -ph / 2 + 2, pw - 4, ph - 4);
      ctx.restore();
    } else {
      ctx.strokeRect(px + 2, py + 2, pw - 4, ph - 4);
    }
  }
  ctx.restore();
}

function paintGrade(ctx, W, H, grade) {
  for (const wash of grade.washes) {
    ctx.save();
    ctx.globalCompositeOperation = wash.blend;
    ctx.globalAlpha = wash.alpha;
    ctx.fillStyle = wash.color;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

function paintVignette(ctx, W, H, strength) {
  if (!strength) return;
  const cx = W / 2;
  const cy = H / 2;
  const radius = 0.85 * Math.max(W, H);
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.25, cx, cy, radius);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Letter-spaced fill, one glyph at a time, starting at (x, y).
function spacedText(ctx, text, x, y, gap) {
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + gap;
  }
  return cursor;
}

function starPath(ctx, cx, cy, r) {
  const inner = r * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + rad * Math.cos(a);
    const y = cy + rad * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function paintHeatStars(ctx, x, y, r, heat) {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const cx = x + i * r * 2.4;
    starPath(ctx, cx, y, r);
    if (i < heat) {
      ctx.fillStyle = '#ffc93c';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = Math.max(1, r * 0.12);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function paintBadge(ctx, x, y, w, h, grade, text) {
  ctx.save();
  ctx.fillStyle = grade.accent;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = '#14090a';
  ctx.font = `900 ${Math.max(9, Math.round(h * 0.52))}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

// The title band: halftone dots, tagline, gradient title, gold rule,
// glowing script subtitle, badge pill and heat stars. Badge placement
// and halftone density vary by layout so each layout reads differently
// even at contact-sheet size.
function paintTitleBand(ctx, W, H, state, grade, layout) {
  const bandY = H * 0.70;
  const bandH = H * 0.27;
  const padX = W * 0.05;
  const tagSize = Math.max(10, Math.round(W / 52));
  // Title height is capped by the band, not just the width, so the
  // tagline above it and the rule below it never collide with it.
  const titleSize0 = Math.round(Math.min(W / 8.5, bandH * 0.42));

  ctx.save();
  const bg = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  bg.addColorStop(0, 'rgba(12,9,22,0.88)');
  bg.addColorStop(1, 'rgba(12,9,22,0.97)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, bandY, W, bandH + H * 0.03);

  // Halftone dot field, spacing from the grade, radius grows left to right.
  const spacing = Math.max(8, grade.halftone * W);
  ctx.fillStyle = grade.accent;
  for (let yy = bandY + spacing * 0.6; yy < bandY + bandH; yy += spacing) {
    const row = Math.round((yy - bandY) / spacing);
    for (let xx = padX + (row % 2 ? spacing / 2 : 0); xx < W - padX; xx += spacing) {
      const fade = 1 - (xx - padX) / (W - padX * 2);
      ctx.globalAlpha = 0.10 + 0.14 * fade;
      ctx.beginPath();
      ctx.arc(xx, yy, spacing * 0.30, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Tagline, letter-spaced, in the grade caption colour.
  ctx.font = `700 ${tagSize}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = grade.caption;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  spacedText(ctx, (state.tagline || '').toUpperCase(), padX, bandY + tagSize * 1.5, tagSize * 0.30);
  ctx.shadowColor = 'transparent';

  // Big title: shrink to fit 90% of the width, gradient fill, ink outline.
  const caption = (state.caption || '').toUpperCase();
  let titleSize = titleSize0;
  ctx.font = `900 ${titleSize}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  while (titleSize > 18 && ctx.measureText(caption).width > W * 0.90) {
    titleSize -= 2;
    ctx.font = `900 ${titleSize}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  }
  const titleY = bandY + bandH * 0.58;
  if (state.titleStyle === 'outline') {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, titleSize * 0.08);
    ctx.strokeStyle = grade.caption;
    ctx.strokeText(caption, padX, titleY);
  } else {
    const tg = ctx.createLinearGradient(0, titleY - titleSize, 0, titleY);
    if (state.titleStyle === 'solid') {
      tg.addColorStop(0, grade.caption);
      tg.addColorStop(1, grade.caption);
    } else {
      tg.addColorStop(0, grade.titleTop);
      tg.addColorStop(1, grade.titleBottom);
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, titleSize * 0.09);
    ctx.strokeStyle = grade.stroke;
    ctx.strokeText(caption, padX, titleY);
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = tg;
    ctx.fillText(caption, padX, titleY);
    ctx.shadowColor = 'transparent';
  }

  // Gold rule under the title, tilted a touch on the tilted layout.
  const ruleY = bandY + bandH * 0.72;
  ctx.save();
  if (layout.id === 'tilted') {
    ctx.translate(padX, ruleY);
    ctx.rotate(-0.015);
    ctx.translate(-padX, -ruleY);
  }
  const rg = ctx.createLinearGradient(padX, 0, padX + W * 0.45, 0);
  rg.addColorStop(0, grade.accent);
  rg.addColorStop(1, 'rgba(255,255,255,0.15)');
  ctx.fillStyle = rg;
  ctx.fillRect(padX, ruleY, W * 0.45, Math.max(2, W * 0.003));
  ctx.restore();

  // Script subtitle with a neon glow.
  if (state.subtitle) {
    const subSize = Math.max(12, Math.round(titleSize * 0.42));
    ctx.font = `italic ${subSize}px "Brush Script MT", "Segoe Script", cursive`;
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = 14;
    ctx.fillText(state.subtitle, padX, bandY + bandH * 0.88);
    ctx.shadowColor = 'transparent';
  }

  // Badge pill: top-right by default, bottom-right on hero.
  const badgeH = Math.max(16, Math.round(tagSize * 1.9));
  const badgeText = 'EST. 2026  •  VICE CITY';
  ctx.font = `900 ${Math.max(9, Math.round(badgeH * 0.52))}px "Arial Black", Arial, sans-serif`;
  const badgeW = ctx.measureText(badgeText).width + badgeH * 1.4;
  let badgeX = W - padX - badgeW;
  let badgeY = bandY + tagSize * 0.7;
  if (layout.id === 'hero') badgeY = bandY + bandH - badgeH - tagSize * 0.5;
  paintBadge(ctx, badgeX, badgeY, badgeW, badgeH, grade, badgeText);

  // Heat meter: five stars under the badge (or above it on hero).
  const starR = Math.max(6, Math.round(W * 0.016));
  const starsW = 5 * starR * 2.4;
  const starsX = W - padX - starsW + starR;
  const starsY = layout.id === 'hero'
    ? bandY + tagSize * 0.7 + badgeH / 2
    : badgeY + badgeH + starR * 1.6;
  paintHeatStars(ctx, starsX, starsY, starR, state.heat || 0);
  ctx.restore();
}

function paintGrain(ctx, W, H, amount) {
  if (!amount || amount <= 0) return;
  const count = Math.min(9000, Math.round(((W * H) / 9000) * amount));
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = hash01(i * 3 + 11) * W;
    const y = hash01(i * 7 + 29) * H;
    const light = hash01(i * 13 + 7) > 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

export function drawCover(ctx, images, state, W, H) {
  const layout = findLayout(state.layout);
  const grade = findGrade(state.grade);
  ctx.fillStyle = '#14101c';
  ctx.fillRect(0, 0, W, H);
  layout.panels.forEach((rect, i) => {
    const panel = state.panels[i] || state.panels[0];
    const img = images[panel.photo] || images.pier;
    paintPanel(
      ctx, img,
      rect.x * W, rect.y * H, rect.w * W, rect.h * H,
      panel.zoom || 1, panel.dx || 0, panel.dy || 0, rect.rot || 0,
    );
  });
  paintFrames(ctx, W, H, layout);
  paintGrade(ctx, W, H, grade);
  paintVignette(ctx, W, H, grade.vignette);
  paintTitleBand(ctx, W, H, state, grade, layout);
  paintGrain(ctx, W, H, state.grain ?? 0.5);
}
