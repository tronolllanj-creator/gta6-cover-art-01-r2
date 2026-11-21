// Neon Coast Cover Lab — cover renderer.
// Draws GTA-style poster covers on a 2D canvas: multi-panel layouts, neon
// sunset grades, bold outlined title lettering, halftone and vignette.
// Everything is drawn from the photos the user loads plus gradients;
// no external art, no network, no fonts to download.

export const LAYOUTS = ['triptych', 'slash', 'hero'];

export const GRADES = {
  vice: { name: 'Vice Sunset', sky: ['#ff5e8a', '#2b1055'], wash: 'rgba(255, 46, 136, 0.34)', accent: '#ff2e88', glow: '#ff7ab8', ink: '#1c0b2e' },
  neon: { name: 'Neon Night', sky: ['#7b2fff', '#0b1035'], wash: 'rgba(0, 229, 255, 0.30)', accent: '#00e5ff', glow: '#b967ff', ink: '#0a0a24' },
  dusk: { name: 'Palm Dusk', sky: ['#ff8a3d', '#3d0b3d'], wash: 'rgba(255, 138, 61, 0.32)', accent: '#ffb347', glow: '#ff9e5e', ink: '#2a0a1e' },
  gold: { name: 'Gold Hour', sky: ['#ffd76a', '#7a2d12'], wash: 'rgba(255, 215, 106, 0.30)', accent: '#ffe9a8', glow: '#ffcf5c', ink: '#2e1503' },
  noir: { name: 'Noir Pink', sky: ['#ff4d6d', '#101014'], wash: 'rgba(255, 77, 109, 0.30)', accent: '#ff4d6d', glow: '#ff8fa3', ink: '#0c0c12' },
  mint: { name: 'Mint Vice', sky: ['#39ffb0', '#0b2b3d'], wash: 'rgba(57, 255, 176, 0.28)', accent: '#39ffb0', glow: '#7dffd4', ink: '#06231f' },
};

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Landscape 1920 x 1080' },
};

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

/** Cover-fit draw of one photo into a rect, with zoom and pan offsets. */
export function drawPanel(ctx, img, rect, panel) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!img) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#3a2350');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    return;
  }
  const zoom = panel && panel.zoom ? panel.zoom : 1;
  const ox = panel && panel.ox ? panel.ox : 0;
  const oy = panel && panel.oy ? panel.oy : 0;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const dx = x + (w - pw) / 2 + ox * w * 0.25;
  const dy = y + (h - ph) / 2 + oy * h * 0.25;
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
}

/** Panel rects for a layout, in canvas pixels. Gutter g separates panels. */
export function layoutRects(layout, w, h) {
  const g = Math.round(Math.min(w, h) * 0.012);
  if (layout === 'slash') {
    return [
      { x: 0, y: 0, w, h, clip: 'left' },
      { x: 0, y: 0, w, h, clip: 'right' },
    ];
  }
  if (layout === 'hero') {
    const top = Math.round(h * 0.60);
    const bw = Math.round((w - g) / 2);
    return [
      { x: 0, y: 0, w, h: top - g },
      { x: 0, y: top, w: bw, h: h - top },
      { x: bw + g, y: top, w: bw, h: h - top },
    ];
  }
  // triptych: three vertical panels
  const pw = Math.round((w - g * 2) / 3);
  return [
    { x: 0, y: 0, w: pw, h },
    { x: pw + g, y: 0, w: pw, h },
    { x: (pw + g) * 2, y: 0, w: pw, h },
  ];
}

/** The diagonal neon slash: two clipped halves plus a glowing band. */
function drawSlash(ctx, w, h, panels, grade) {
  const band = w * 0.16;
  const slope = h * 0.28;
  // left/top half
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, h - slope - band);
  ctx.lineTo(0, h - slope + band);
  ctx.closePath();
  ctx.clip();
  drawPanel(ctx, panels[0] && panels[0].img, { x: 0, y: 0, w, h }, panels[0]);
  ctx.restore();
  // right/bottom half
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, h - slope + band);
  ctx.lineTo(w, h - slope - band);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.clip();
  drawPanel(ctx, panels[1] && panels[1].img, { x: 0, y: 0, w, h }, panels[1]);
  ctx.restore();
  // glowing band along the diagonal
  ctx.save();
  ctx.translate(w / 2, h - slope / 2);
  ctx.rotate(Math.atan2(-slope, w));
  const bg = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  bg.addColorStop(0, grade.accent);
  bg.addColorStop(0.5, grade.glow);
  bg.addColorStop(1, grade.accent);
  ctx.fillStyle = bg;
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = w * 0.03;
  ctx.fillRect(-w / 2, -band * 0.28, w, band * 0.56);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `900 ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size = Math.floor(size * 0.94);
    ctx.font = `900 ${size}px ${family}`;
  }
  return size;
}

function drawTitleBlock(ctx, w, h, state, grade) {
  const title = (state.title || 'NEON COAST').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  const family = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
  const bandH = Math.round(h * 0.24);
  const bandY = h - bandH;
  // dark scrim so the letters read on any photo
  const scrim = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  scrim.addColorStop(0, 'rgba(10, 4, 20, 0)');
  scrim.addColorStop(0.45, 'rgba(10, 4, 20, 0.62)');
  scrim.addColorStop(1, 'rgba(10, 4, 20, 0.88)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);
  // thin neon rule above the title
  const rule = ctx.createLinearGradient(0, 0, w, 0);
  rule.addColorStop(0, grade.accent);
  rule.addColorStop(0.5, grade.glow);
  rule.addColorStop(1, grade.accent);
  ctx.fillStyle = rule;
  ctx.fillRect(w * 0.06, bandY + h * 0.015, w * 0.88, Math.max(3, h * 0.004));
  // title
  const size = fitFont(ctx, title, w * 0.88, Math.round(h * 0.115), family);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = `${Math.round(size * 0.04)}px`; } catch { /* older canvas */ }
  const ty = bandY + bandH * 0.52;
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = size * 0.35;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeStyle = grade.ink;
  ctx.lineJoin = 'round';
  ctx.strokeText(title, w / 2, ty);
  const tg = ctx.createLinearGradient(0, ty - size, 0, ty);
  tg.addColorStop(0, '#ffffff');
  tg.addColorStop(1, grade.glow);
  ctx.fillStyle = tg;
  ctx.fillText(title, w / 2, ty);
  ctx.shadowBlur = 0;
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  // subtitle, letterspaced small caps
  if (subtitle) {
    const ss = Math.round(h * 0.028);
    ctx.font = `700 ${ss}px ${family}`;
    try { ctx.letterSpacing = `${Math.round(ss * 0.35)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.92;
    ctx.fillText(subtitle, w / 2, bandY + bandH * 0.82);
    ctx.globalAlpha = 1;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  // star badge, top right — pill sized to the measured text so it never clips
  const bs = Math.round(h * 0.052);
  const badgeText = '★ EST. 2026 ★';
  ctx.font = `900 ${Math.round(bs * 0.52)}px ${family}`;
  const pillW = ctx.measureText(badgeText).width + bs * 1.4;
  const bx = w - w * 0.03 - pillW;
  const by = h * 0.035;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 4, 20, 0.55)';
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(2, h * 0.002);
  roundRect(ctx, bx, by, pillW, bs, bs * 0.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = grade.glow;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, bx + pillW / 2, by + bs * 0.54);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function applyGrade(ctx, w, h, grade) {
  // warm sky wash
  const sky = ctx.createLinearGradient(0, 0, w * 0.4, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(1, grade.sky[1]);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // halftone dots, top-left corner
  const step = Math.max(9, Math.round(w * 0.012));
  ctx.fillStyle = '#ffffff';
  for (let yy = step; yy < h * 0.16; yy += step) {
    for (let xx = step; xx < w * 0.30; xx += step) {
      const fade = 1 - (xx / (w * 0.30) + yy / (h * 0.16)) / 2;
      ctx.globalAlpha = 0.10 * Math.max(0, fade);
      ctx.beginPath();
      ctx.arc(xx, yy, Math.max(1.2, step * 0.14), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  // vignette
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(8,2,16,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

/** Draws the whole cover onto `canvas` at its own pixel size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.vice;
  const panels = state.panels || [];
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);
  if (state.layout === 'slash') {
    drawSlash(ctx, w, h, panels, grade);
  } else {
    const rects = layoutRects(state.layout, w, h);
    rects.forEach((r, i) => drawPanel(ctx, panels[i] && panels[i].img, r, panels[i]));
    // gutters get a neon hairline
    ctx.strokeStyle = grade.accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
    rects.forEach((r) => { ctx.strokeRect(r.x, r.y, r.w, r.h); });
    ctx.globalAlpha = 1;
  }
  applyGrade(ctx, w, h, grade);
  drawTitleBlock(ctx, w, h, state, grade);
}
