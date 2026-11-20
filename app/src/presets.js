// NEON COAST COVER LAB — preset data (round 2)
// Design tokens for the cover maker: export sizes, eight panel layouts,
// eight colour grades, four one-click mood presets and the two kit photos.
// Panels live in the top ~68% of the cover; the bottom ~32% is the title
// band the renderer draws. Nothing here touches the network.

export const SIZES = [
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide', w: 1920, h: 1080 },
];

// Panel rectangles are fractions of the cover (x, y, w, h). `rot` tilts a
// panel in radians for the snapshot-stack layout.
export const LAYOUTS = [
  {
    id: 'hero', label: 'Hero',
    panels: [{ x: 0.03, y: 0.03, w: 0.94, h: 0.65 }],
  },
  {
    id: 'duo', label: 'Duo',
    panels: [
      { x: 0.03, y: 0.03, w: 0.46, h: 0.65 },
      { x: 0.51, y: 0.03, w: 0.46, h: 0.65 },
    ],
  },
  {
    id: 'triptych', label: 'Triptych',
    panels: [
      { x: 0.03, y: 0.03, w: 0.94, h: 0.34 },
      { x: 0.03, y: 0.39, w: 0.46, h: 0.29 },
      { x: 0.51, y: 0.39, w: 0.46, h: 0.29 },
    ],
  },
  {
    id: 'grid', label: 'Grid 4',
    panels: [
      { x: 0.03, y: 0.03, w: 0.46, h: 0.31 },
      { x: 0.51, y: 0.03, w: 0.46, h: 0.31 },
      { x: 0.03, y: 0.36, w: 0.46, h: 0.32 },
      { x: 0.51, y: 0.36, w: 0.46, h: 0.32 },
    ],
  },
  {
    id: 'mosaic', label: 'Mosaic 9',
    panels: [
      { x: 0.03, y: 0.03, w: 0.295, h: 0.20 },
      { x: 0.345, y: 0.03, w: 0.295, h: 0.20 },
      { x: 0.66, y: 0.03, w: 0.295, h: 0.20 },
      { x: 0.03, y: 0.255, w: 0.295, h: 0.20 },
      { x: 0.345, y: 0.255, w: 0.295, h: 0.20 },
      { x: 0.66, y: 0.255, w: 0.295, h: 0.20 },
      { x: 0.03, y: 0.48, w: 0.295, h: 0.20 },
      { x: 0.345, y: 0.48, w: 0.295, h: 0.20 },
      { x: 0.66, y: 0.48, w: 0.295, h: 0.20 },
    ],
  },
  {
    id: 'tilted', label: 'Tilted Stack',
    panels: [
      { x: 0.05, y: 0.06, w: 0.30, h: 0.56, rot: -0.10 },
      { x: 0.35, y: 0.03, w: 0.30, h: 0.56, rot: 0.02 },
      { x: 0.65, y: 0.06, w: 0.30, h: 0.56, rot: 0.09 },
    ],
  },
  {
    id: 'strip', label: 'Hero + Strip',
    panels: [
      { x: 0.03, y: 0.03, w: 0.58, h: 0.65 },
      { x: 0.63, y: 0.03, w: 0.34, h: 0.20 },
      { x: 0.63, y: 0.25, w: 0.34, h: 0.20 },
      { x: 0.63, y: 0.47, w: 0.34, h: 0.21 },
    ],
  },
  {
    id: 'comic', label: 'Comic 3',
    panels: [
      { x: 0.03, y: 0.03, w: 0.94, h: 0.20 },
      { x: 0.03, y: 0.25, w: 0.94, h: 0.20 },
      { x: 0.03, y: 0.47, w: 0.94, h: 0.21 },
    ],
  },
];

// A grade is a stack of full-frame colour washes (canvas blend modes), a
// vignette strength, caption ink, the two title-gradient stops, an accent
// for the badge/rule and a halftone dot spacing in cover-width fractions.
export const GRADES = [
  {
    id: 'sunset', label: 'Sunset',
    washes: [
      { color: '#ff8c1a', blend: 'multiply', alpha: 0.30 },
      { color: '#ff2d78', blend: 'overlay', alpha: 0.35 },
    ],
    vignette: 0.45, caption: '#fff3e0', stroke: '#14090a',
    titleTop: '#ffd23c', titleBottom: '#ff2d78', accent: '#ffc93c', halftone: 0.028,
  },
  {
    id: 'neon', label: 'Neon',
    washes: [
      { color: '#ff2bd6', blend: 'color', alpha: 0.45 },
      { color: '#22e6ff', blend: 'screen', alpha: 0.30 },
    ],
    vignette: 0.30, caption: '#ffffff', stroke: '#200a30',
    titleTop: '#22e6ff', titleBottom: '#ff2bd6', accent: '#ff2bd6', halftone: 0.022,
  },
  {
    id: 'noir', label: 'Noir',
    washes: [
      { color: '#8a8aa0', blend: 'saturation', alpha: 0.35 },
      { color: '#000000', blend: 'multiply', alpha: 0.40 },
    ],
    vignette: 0.65, caption: '#f2ecdc', stroke: '#000000',
    titleTop: '#ffffff', titleBottom: '#b8b8c8', accent: '#e8e8e8', halftone: 0.034,
  },
  {
    id: 'vice', label: 'Vice',
    washes: [
      { color: '#0e7d84', blend: 'soft-light', alpha: 0.55 },
      { color: '#ff8c1a', blend: 'color', alpha: 0.38 },
    ],
    vignette: 0.38, caption: '#ffffff', stroke: '#0a2e33',
    titleTop: '#7ef0e0', titleBottom: '#ff8c1a', accent: '#22e6ff', halftone: 0.026,
  },
  {
    id: 'gold', label: 'Gold',
    washes: [
      { color: '#ffb400', blend: 'multiply', alpha: 0.30 },
      { color: '#7a4a00', blend: 'overlay', alpha: 0.30 },
    ],
    vignette: 0.40, caption: '#fff8dc', stroke: '#2a1a00',
    titleTop: '#fff3b0', titleBottom: '#ff9d00', accent: '#ffc93c', halftone: 0.030,
  },
  {
    id: 'miami', label: 'Miami',
    washes: [
      { color: '#ff7ad9', blend: 'screen', alpha: 0.35 },
      { color: '#00b3c8', blend: 'color', alpha: 0.40 },
    ],
    vignette: 0.32, caption: '#ffffff', stroke: '#2a0030',
    titleTop: '#ff7ad9', titleBottom: '#00e5ff', accent: '#ff7ad9', halftone: 0.024,
  },
  {
    id: 'dusk', label: 'Dusk',
    washes: [
      { color: '#6d28d9', blend: 'multiply', alpha: 0.35 },
      { color: '#ff8c1a', blend: 'overlay', alpha: 0.30 },
    ],
    vignette: 0.50, caption: '#f3e8ff', stroke: '#1a0a2e',
    titleTop: '#ffb347', titleBottom: '#a78bfa', accent: '#c4b5fd', halftone: 0.028,
  },
  {
    id: 'palm', label: 'Palm',
    washes: [
      { color: '#0e9f6e', blend: 'soft-light', alpha: 0.45 },
      { color: '#ffd23c', blend: 'color', alpha: 0.30 },
    ],
    vignette: 0.35, caption: '#f0fff4', stroke: '#06281c',
    titleTop: '#d9ff7a', titleBottom: '#00b39a', accent: '#7ef0a0', halftone: 0.026,
  },
];

// One-click moods: layout + grade + words + heat in a single tap.
export const PRESETS = [
  {
    id: 'neon-night', label: 'Neon Night', layout: 'tilted', grade: 'neon',
    caption: 'NEON HEAT', tagline: 'VICE CITY AFTER DARK', subtitle: 'midnight run', heat: 5,
  },
  {
    id: 'retro-sunset', label: 'Retro Sunset', layout: 'mosaic', grade: 'sunset',
    caption: 'SUNSET HEIST', tagline: 'GOLDEN HOUR CREW', subtitle: 'golden hour', heat: 4,
  },
  {
    id: 'gritty-noir', label: 'Gritty Noir', layout: 'comic', grade: 'noir',
    caption: 'PIER PRESSURE', tagline: 'NOIR EDITION', subtitle: 'last call', heat: 3,
  },
  {
    id: 'palm-gold', label: 'Palm Gold', layout: 'strip', grade: 'gold',
    caption: 'BOULEVARD QUEEN', tagline: 'PALM TREE ROYALE', subtitle: 'queen of the boulevard', heat: 5,
  },
];

export const PHOTOS = [
  { id: 'pier', label: 'Pier', path: 'samples/pier.jpg' },
  { id: 'boulevard', label: 'Boulevard', path: 'samples/boulevard.jpg' },
];

export function findLayout(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}
export function findGrade(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}
export function findSize(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}
export function findPhoto(id) {
  return PHOTOS.find((p) => p.id === id) || PHOTOS[0];
}
export function findPreset(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}

// Fresh default state. Panel crops are fixed so the first paint is
// deterministic; the UI shuffle is the only random path.
export function defaultState() {
  const photos = ['pier', 'boulevard', 'pier', 'boulevard', 'pier', 'boulevard', 'pier', 'boulevard', 'pier'];
  const zooms = [1.25, 1.4, 1.15, 1.3, 1.2, 1.45, 1.1, 1.35, 1.25];
  return {
    layout: 'mosaic',
    grade: 'neon',
    size: 'wide',
    caption: 'NEON HEAT',
    tagline: 'VICE CITY AFTER DARK',
    subtitle: 'midnight run',
    heat: 5,
    grain: 0.5,
    titleStyle: 'gradient',
    selected: 0,
    panels: photos.map((photo, i) => ({
      photo, zoom: zooms[i], dx: (i % 3 - 1) * 0.04, dy: (i % 2 ? 0.03 : -0.03),
    })),
  };
}
