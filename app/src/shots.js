// Fixed scenes for screenshots: ?shot=cover shows the cover alone at the
// export size, ?shot=editor shows the page with sample photos loaded.
// `layout`, `grade`, `size`, `title` and `subtitle` come from the query.
// window.__shotReady is set once the scene has painted.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function runShot(shot, query, state, setLayout, setGrade, setSize, redraw) {
  const layout = query.get('layout') || 'slash';
  const grade = query.get('grade') || 'vice';
  const size = query.get('size') || '1920x1080';
  const title = query.get('title') || 'NEON COAST';
  const subtitle = query.get('subtitle') || 'SUNSET HEIST';
  setLayout(layout);
  setGrade(grade);
  setSize(size);
  state.title = title;
  state.subtitle = subtitle;
  const titleInput = document.getElementById('title');
  const subtitleInput = document.getElementById('subtitle');
  if (titleInput) titleInput.value = title;
  if (subtitleInput) subtitleInput.value = subtitle;
  try {
    const [a, b, c] = await Promise.all([
      loadImage('samples/sunset.jpg'),
      loadImage('samples/neon.jpg'),
      loadImage('samples/palms.jpg'),
    ]);
    state.panels[0].img = a;
    state.panels[1].img = b;
    state.panels[2].img = c;
  } catch (e) {
    window.__shotError = 'sample photo failed to load: ' + e.message;
    return;
  }
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    // paint the cover at the viewport's own pixels so the screenshot is the art
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const { drawCover } = await import('./cover.js');
    drawCover(canvas, state);
  } else {
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
