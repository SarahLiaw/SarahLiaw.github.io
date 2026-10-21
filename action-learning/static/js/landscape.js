/* Vector landscape of Figs. 2-3 (traced by build/landscape.py), drawn into an SVG so it stays sharp at any zoom.
   Landscape.draw(parent, k, ox, oy, floorRow) maps image pixel (col, row) to (ox + k col, oy + k row) and fills the
   ground down to floorRow (default: the lowest row of the traced band). */
(function () {
  'use strict';
  function draw(parent, k, ox, oy, floorRow) {
    const Ls = window.LEAP_LANDSCAPE, C = Ls.colors, s = Ls.step;
    const i0 = Math.ceil(Ls.first / s), i1 = Math.floor(Ls.last / s);
    // the traced curve between its two wall tops; past them the trace fell back down, so the wall stays level
    let iL = i0, iR = i1;
    for (let i = i0; i <= Math.floor(300 / s); i++) if (Ls.curve[i] < Ls.curve[iL]) iL = i;
    for (let i = Math.ceil(1300 / s); i <= i1; i++) if (Ls.curve[i] < Ls.curve[iR]) iR = i;
    const row = (i) => (i < iL ? Ls.curve[iL] : i > iR ? Ls.curve[iR] : Ls.curve[i]);
    const line = [];
    for (let i = i0; i <= i1; i++) line.push((i * s).toFixed(1) + ',' + row(i).toFixed(1));
    const bottom = (floorRow === undefined ? Math.max(...Ls.bottom) : floorRow).toFixed(1);
    const g = Fig.el('g', { transform: `translate(${ox},${oy}) scale(${k})` }, parent);
    Fig.el('path', { d: `M${line.join(' L')} L${(i1 * s).toFixed(1)},${bottom} L${(i0 * s).toFixed(1)},${bottom}Z`, fill: C.band }, g);
    Fig.el('path', { d: 'M' + line.join(' L'), fill: 'none', stroke: C.curve, 'stroke-width': Ls.curve_width,
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
