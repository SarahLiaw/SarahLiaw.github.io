/* Vector landscape of Figs. 2-3 (traced by build/landscape.py), drawn into an SVG so it stays sharp at any zoom.
   Landscape.draw(parent, k, ox, oy) maps image pixel (col, row) to (ox + k col, oy + k row). */
(function () {
  'use strict';
  let uid = 0;
  function draw(parent, k, ox, oy) {
    const Ls = window.LEAP_LANDSCAPE, C = Ls.colors, s = Ls.step;
    const i0 = Math.ceil(Ls.first / s), i1 = Math.floor(Ls.last / s);
    const pts = (arr, from, to) => {
      const out = [], dir = from <= to ? 1 : -1;
      for (let i = from; i !== to + dir; i += dir) out.push((i * s).toFixed(1) + ',' + arr[i].toFixed(1));
      return out.join(' L');
    };
    const g = Fig.el('g', { transform: `translate(${ox},${oy}) scale(${k})` }, parent);
    const id = 'tint' + (++uid);
    const grad = Fig.el('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: 0, x2: Ls.width, y1: 0, y2: 0 },
      Fig.el('defs', {}, g));
    const f = (x) => (x / Ls.width).toFixed(4);
    [[0, C.blue], [f(Ls.bump - 90), C.blue], [f(Ls.bump), C.band], [f(Ls.bump + 90), C.pink], [1, C.pink]]
      .forEach(([o, c]) => Fig.el('stop', { offset: o, 'stop-color': c }, grad));
    Fig.el('path', { d: 'M' + pts(Ls.top, i0, i1) + ' L' + pts(Ls.bottom, i1, i0) + 'Z', fill: C.band }, g);
    Fig.el('path', { d: 'M' + pts(Ls.top, i0, i1) + ' L' + pts(Ls.curve, i1, i0) + 'Z', fill: `url(#${id})` }, g);
    Fig.el('path', { d: 'M' + pts(Ls.curve, i0, i1), fill: 'none', stroke: C.curve, 'stroke-width': Ls.curve_width,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
    for (const name in Ls.letters) {
      const L = Ls.letters[name];
      Fig.el('text', { x: L.x, y: L.base, 'text-anchor': 'middle', 'font-weight': 700, 'font-size': (L.cap / 0.72).toFixed(1),
        fill: C.curve, style: 'fill:' + C.curve }, g).textContent = name;
    }
    return g;
  }
  window.Landscape = { draw };
})();
