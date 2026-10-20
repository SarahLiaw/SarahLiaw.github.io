/* Shared helpers for the animated figures: palette, layered canvas + SVG stage, rich labels, axes, loop. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  // One palette with the paper's meanings: blue is LEAP, red a local or one-step estimator,
  // near-black dashed the exact reference, gray context. Schematic colors follow Figs. 1-3.
  const P = {
    leap: '#2171b5', local: '#d62728', exact: '#1b1b1e', muted: '#8c8c8c', grid: '#e9e9e9',
    regimeHi: '#6a51a3', regimeLo: '#238b45', ink2: '#4a4f5c', accent: '#156082',
    A: '#114d68', B: '#b26aa8', data: '#ea0700', ref: '#535353', cand: '#8b9ae9', disc: '#fd7276',
    samples: ['#3c6982', '#8e67b3', '#fd7276'], action: ['#001dc8', '#802276', '#d20000'],
    fig7: { leap: '#fa765a', cyan: '#5ed8f4', white: '#f7f7f7', pink: '#f7a4e0', ink: '#30334c' },
  };

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Tiny math markup: \i{..} italic, _{..} subscript, ^{..} superscript; everything else upright.
  function parse(s) {
    const runs = [];
    let i = 0;
    function block(style, stop) {
      let buf = '';
      const flush = () => { if (buf) { runs.push(Object.assign({ t: buf }, style)); buf = ''; } };
      while (i < s.length) {
        const ch = s[i];
        if (stop && ch === '}') { i++; break; }
        if (s.startsWith('\\i{', i)) { flush(); i += 3; block(Object.assign({}, style, { it: true }), true); continue; }
        if ((ch === '_' || ch === '^') && s[i + 1] === '{') {
          flush(); i += 2;
          block(Object.assign({}, style, { shift: ch === '_' ? 'sub' : 'sup' }), true);
          continue;
        }
        buf += ch; i++;
      }
      flush();
    }
    block({ it: false, shift: null }, false);
    return runs;
  }
  function rich(parent, x, y, s, attrs) {
    const t = el('text', Object.assign({ x, y }, attrs || {}), parent);
    let prev = null;
    for (const r of parse(s)) {
      const sp = el('tspan', {}, t);
      sp.textContent = r.t;
      if (r.it) sp.setAttribute('font-style', 'italic');
      if (r.shift) { sp.setAttribute('font-size', '72%'); }
      // baseline shifts written as dy so they render in every browser
      const target = r.shift === 'sub' ? 0.28 : r.shift === 'sup' ? -0.42 : 0;
      const cur = prev === 'sub' ? 0.28 : prev === 'sup' ? -0.42 : 0;
      if (target !== cur) sp.setAttribute('dy', ((target - cur) * (r.shift ? 1 : 0.72) * 1).toFixed(2) + 'em');
      prev = r.shift;
    }
    return t;
  }
  function setRich(t, s) {
    while (t.firstChild) t.removeChild(t.firstChild);
    const x = t.getAttribute('x'), y = t.getAttribute('y');
    const tmp = rich(t.parentNode, x, y, s, {});
    while (tmp.firstChild) t.appendChild(tmp.firstChild);
    tmp.remove();
    return t;
  }

  // Layered stage in one logical W x H frame: a vector background, a DPR-aware canvas for marks, an SVG for text.
  function stage(container, W, H, onresize) {
    container.classList.add('fig');
    container.style.setProperty('--aspect', W + ' / ' + H);
    const canvas = document.createElement('canvas');
    const bg = el('svg', { class: 'layer', viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' });
    const svg = el('svg', { class: 'layer', viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' });
    container.append(bg, canvas, svg);
    const ctx = canvas.getContext('2d');
    const st = { canvas, ctx, bg, svg, W, H, scale: 1 };
    let ready = false;
    function resize() {
      const r = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      st.scale = canvas.width / W;
      ctx.setTransform(st.scale, 0, 0, st.scale, 0, 0);
      if (onresize && ready) onresize();
    }
    st.clear = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(st.scale, 0, 0, st.scale, 0, 0);
    };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(container);
    window.addEventListener('resize', resize);
    resize();
    setTimeout(() => { ready = true; }, 0);
    return st;
  }

  function polyline(ctx, xs, ys, n, style) {
    if (n < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < n; i++) ctx.lineTo(xs[i], ys[i]);
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width || 1.5;
    ctx.globalAlpha = style.alpha === undefined ? 1 : style.alpha;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (style.dash) ctx.setLineDash(style.dash);
    if (style.halo) { ctx.save(); ctx.strokeStyle = style.halo; ctx.lineWidth = (style.width || 1.5) + (style.haloWidth || 2.2); ctx.stroke(); ctx.restore(); }
    ctx.stroke();
    ctx.restore();
  }
  function dot(ctx, x, y, r, fill, stroke, lw) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }

  // SVG axes in the paper's style: thin left/bottom spines, light grid.
  function axes(svg, o) {
    const g = el('g', {}, svg);
    const sx = (v) => o.x + (v - o.xlim[0]) / (o.xlim[1] - o.xlim[0]) * o.w;
    const sy = (v) => o.y + o.h - (v - o.ylim[0]) / (o.ylim[1] - o.ylim[0]) * o.h;
    for (const v of o.ygrid || o.yticks || []) el('line', { x1: o.x, x2: o.x + o.w, y1: sy(v), y2: sy(v), class: 'gridline' }, g);
    for (const v of o.xgrid || []) el('line', { x1: sx(v), x2: sx(v), y1: o.y, y2: o.y + o.h, class: 'gridline' }, g);
    el('path', { d: `M${o.x},${o.y} V${o.y + o.h} H${o.x + o.w}`, class: 'axis' }, g);
    for (const v of o.xticks || []) {
      el('line', { x1: sx(v), x2: sx(v), y1: o.y + o.h, y2: o.y + o.h + 4, class: 'axis' }, g);
      const t = el('text', { x: sx(v), y: o.y + o.h + 18, 'text-anchor': 'middle', class: 'tick' }, g);
      t.textContent = (o.xfmt || String)(v);
    }
    for (const v of o.yticks || []) {
      el('line', { x1: o.x - 4, x2: o.x, y1: sy(v), y2: sy(v), class: 'axis' }, g);
      const t = el('text', { x: o.x - 7, y: sy(v) + 4.5, 'text-anchor': 'end', class: 'tick' }, g);
      t.textContent = (o.yfmt || String)(v);
    }
    if (o.xlabel) rich(g, o.x + o.w / 2, o.y + o.h + 38, o.xlabel, { 'text-anchor': 'middle', class: 'lbl' });
    if (o.ylabel) rich(g, 0, 0, o.ylabel, { 'text-anchor': 'middle', class: 'lbl', transform: `translate(${o.x - (o.ylabelGap || 42)},${o.y + o.h / 2}) rotate(-90)` });
    return { g, sx, sy };
  }

  // Legend row of [kind, color, label] entries; kind: line | dash | dot | dotted | band | square
  function legend(svg, x, y, items, o) {
    o = o || {};
    const g = el('g', {}, svg);
    let cx = x;
    for (const it of items) {
      const [kind, color, label] = it;
      const k = el('g', { transform: `translate(${cx},${y})` }, g);
      const light = /^#f[0-9a-f]f/i.test(color) || color === '#fff' || color === '#ffffff';
      if (kind === 'dot') el('circle', { cx: 9, cy: -5, r: 4.5, fill: color, stroke: light ? '#30334c' : 'none', 'stroke-width': 1 }, k);
      else if (kind === 'square') el('rect', { x: 4.5, y: -9.5, width: 9, height: 9, fill: color }, k);
      else if (kind === 'band') el('rect', { x: 0, y: -10, width: 22, height: 10, fill: color, opacity: 0.3 }, k);
      else {
        if (light) el('line', { x1: 0, x2: 22, y1: -5, y2: -5, stroke: '#30334c', 'stroke-width': 3.6, 'stroke-linecap': 'round' }, k);
        el('line', { x1: 0, x2: 22, y1: -5, y2: -5, stroke: color, 'stroke-width': kind === 'thick' ? 3 : 2,
        'stroke-dasharray': kind === 'dash' ? '5 3' : kind === 'dotted' ? '1.5 2.5' : 'none', 'stroke-linecap': 'round' }, k);
      }
      const t = rich(k, 28, 0, label, { class: 'lbl' });
      const w = (o.widths && o.widths[items.indexOf(it)]) || (36 + label.replace(/\\i\{|[{}_^]/g, '').length * 7.2);
      cx += w + (o.gap || 18);
      if (o.vertical) { cx = x; y += o.lineHeight || 22; k.setAttribute('transform', `translate(${x},${y - (o.lineHeight || 22)})`); }
      void t;
    }
    return g;
  }

  // Animation clock with play/pause, paused while scrolled out of view or under reduced motion.
  function loop(step, opts) {
    opts = opts || {};
    let playing = !reduced, visible = true, last = null;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.01 }).observe(document.body);
    }
    function frame(now) {
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
      last = now;
      if (playing && visible) step(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    const api = { get playing() { return playing; }, set(p) { playing = p; if (opts.onchange) opts.onchange(p); } };
    return api;
  }
  function playButton(parent, clock) {
    const b = document.createElement('button');
    b.className = 'icon';
    b.type = 'button';
    const set = () => {
      b.innerHTML = clock.playing
        ? '<svg viewBox="0 0 16 16"><rect x="3" y="2" width="3.2" height="12" rx=".6"/><rect x="9.8" y="2" width="3.2" height="12" rx=".6"/></svg>'
        : '<svg viewBox="0 0 16 16"><path d="M4 2.5 L13.5 8 L4 13.5 Z"/></svg>';
      b.setAttribute('aria-label', clock.playing ? 'Pause animation' : 'Play animation');
      b.title = b.getAttribute('aria-label');
    };
    b.addEventListener('click', () => { clock.set(!clock.playing); set(); });
    parent.appendChild(b);
    set();
    return { refresh: set };
  }

  // ?t=<seconds>&tab=<index> jumps to a moment, for checking frames.
  const query = (k, d) => { try { const v = new URLSearchParams(location.search).get(k); return v === null ? d : +v; } catch (e) { return d; } };

  window.Fig = { query, P, NS, el, rich, setRich, parse, stage, polyline, dot, axes, legend, loop, playButton, clamp, smooth, lerp, reduced };
})();
