/* Interactive viewers for the renoise-denoise page. Every frame shown is a file from the experiments. */
(function () {
  'use strict';
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 1.5h3.2v11H2.5zM8.3 1.5h3.2v11H8.3z"/></svg>';
  var PRIME = '′';

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }

  function pills(labels, current, onPick, aria) {
    var wrap = h('div', { class: labels.length > 4 ? 'pills scroll' : 'pills', role: 'group', 'aria-label': aria });
    var btns = labels.map(function (lab, i) {
      var b = h('button', { type: 'button', 'aria-pressed': String(i === current) }, [lab]);
      b.addEventListener('click', function () { set(i); onPick(i); });
      wrap.appendChild(b);
      return b;
    });
    function set(i) { btns.forEach(function (b, j) { b.setAttribute('aria-pressed', String(i === j)); }); }
    wrap.set = set;
    return wrap;
  }

  function playButton(onToggle) {
    var b = h('button', { type: 'button', class: 'play', 'aria-label': 'Play', html: PLAY });
    b.addEventListener('click', onToggle);
    b.show = function (on) { b.innerHTML = on ? PAUSE : PLAY; b.setAttribute('aria-label', on ? 'Pause' : 'Play'); };
    return b;
  }

  function whenVisible(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); },
      { threshold: 0.2 }).observe(el);
  }

  // tick centers line up with the range thumb (about 16 px wide)
  function at(f) { return 'calc(8px + (100% - 16px) * ' + f + ')'; }

  function fmt(s) { return String(+s.toFixed(4)); }

  // word-level diff of two prompts (longest common subsequence): [word, changed] lists for each
  function wordDiff(a, b) {
    var A = a.split(/\s+/), B = b.split(/\s+/), n = A.length, m = B.length, i, j;
    var norm = function (w) { return w.toLowerCase().replace(/[^a-z0-9-]/g, ''); };
    var T = [];
    for (i = 0; i <= n; i++) { T.push([]); for (j = 0; j <= m; j++) T[i].push(0); }
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        T[i][j] = norm(A[i]) === norm(B[j]) ? T[i + 1][j + 1] + 1 : Math.max(T[i + 1][j], T[i][j + 1]);
      }
    }
    var keepA = A.map(function () { return false; }), keepB = B.map(function () { return false; });
    i = 0; j = 0;
    while (i < n && j < m) {
      if (norm(A[i]) === norm(B[j])) { keepA[i] = true; keepB[j] = true; i++; j++; }
      else if (T[i + 1][j] >= T[i][j + 1]) i++;
      else j++;
    }
    return { a: A.map(function (w, k) { return [w, !keepA[k]]; }), b: B.map(function (w, k) { return [w, !keepB[k]]; }) };
  }

  // the source prompt c above the new prompt c', changed words marked in each
  function promptPair(c, c2) {
    var d = wordDiff(c, c2), box = h('div', { class: 'prompts' });
    [['c', d.a, 'old'], ['c' + PRIME, d.b, 'new']].forEach(function (row) {
      var p = h('p', { class: 'prompt' }, [h('span', { class: 'plab', text: row[0] })]);
      row[1].forEach(function (w) {
        p.appendChild(document.createTextNode(' '));
        p.appendChild(w[1] ? h('span', { class: row[2], text: w[0] }) : document.createTextNode(w[0]));
      });
      box.appendChild(p);
    });
    return box;
  }

  function flowArrow(label) {
    return h('div', { class: 'arrow', 'aria-hidden': 'true' }, [h('span', { text: label }),
      h('div', { html: '<svg viewBox="0 0 44 12"><path d="M1 6h38M33 1.5l6 4.5-6 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' })]);
  }

  // a set of videos played on one clock; videos[0] drives the others
  function clock(videos, onTime) {
    var playing = false, raf = 0;
    function each(f) { videos.forEach(function (v) { if (v) f(v); }); }
    function report() { if (onTime) onTime(videos[0].currentTime, videos[0].duration || 0); }
    function playOne(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function loop() {
      raf = 0;
      if (!playing) return;
      var m = videos[0];
      each(function (v) {
        if (v === m || v.seeking || v.readyState < 2) return;     // let a pending seek finish first
        if (Math.abs(v.currentTime - m.currentTime) > 0.15) {
          try { v.currentTime = m.currentTime; } catch (e) { /* not seekable yet */ }
        }
        if (v.paused) playOne(v);
      });
      if (m.paused && m.readyState >= 2) playOne(m);
      report();
      raf = requestAnimationFrame(loop);
    }
    each(function (v) {
      v.muted = true; v.loop = true; v.playsInline = true;
      v.addEventListener('loadeddata', function () {
        if (v !== videos[0]) { try { v.currentTime = videos[0].currentTime; } catch (e) { /* ignore */ } }
        if (playing) playOne(v); else if (v === videos[0]) report();
      });
    });
    return {
      play: function () { playing = true; each(playOne); if (!raf) raf = requestAnimationFrame(loop); },
      pause: function () {
        playing = false;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        each(function (v) { v.pause(); });
        report();
      },
      seek: function (t) { each(function (v) { try { v.currentTime = t; } catch (e) { /* ignore */ } }); if (onTime) onTime(t, videos[0].duration || 0); },
      playing: function () { return playing; },
    };
  }

  function scrubber(onSeek) {
    var range = h('input', { type: 'range', min: '0', max: '1000', value: '0', step: '1', 'aria-label': 'Time' });
    range.addEventListener('input', function () { onSeek(+range.value / 1000); });
    return range;
  }

  /* ---------------- images: FLUX.1-dev renoise-denoise ---------------- */
  function imageViewer(root, D) {
    var TIERS = ['Attribute', 'Style', 'Subject', 'Scene'];
    var L = D.levels, n = L.length - 1, ex = D.examples;
    var cur = Math.max(0, ex.findIndex(function (e) { return e.id === 'cat2tiger'; }));
    var tier = TIERS.indexOf(ex[cur].tier), k = 0, playing = !REDUCE, visible = false, timer = 0;

    var tierPills = pills(TIERS, tier, function (i) {
      tier = i; renderThumbs();
      pick(ex.findIndex(function (e) { return e.tier === TIERS[i]; }));
    }, 'Edit type');
    var srcImg = h('img', { class: 'sq', alt: 'Source image', width: '512', height: '512' });
    var yImg = h('img', { class: 'sq pix', alt: 'Renoised latent', width: '64', height: '64' });
    var outImg = h('img', { class: 'sq', alt: 'Output image', width: '512', height: '512' });
    var badge = h('span', { class: 'badge' });
    function panel(img, title, small, extra) {
      return h('div', { class: 'panel' }, [h('div', { class: 'media' }, [img, extra || null]),
        h('div', { class: 'tag' }, [title, small])]);
    }
    var panels = h('div', { class: 'flow' }, [
      panel(srcImg, 'Source X', null),
      flowArrow('renoise'),
      panel(yImg, 'Renoised latent Y', null),
      flowArrow('denoise'),
      panel(outImg, 'Edit X' + PRIME, null, badge)]);
    var promptBox = h('div');
    var range = h('input', { type: 'range', min: '0', max: String(n), step: '1', value: '0', 'aria-label': 'Renoising strength s' });
    var ticks = h('div', { class: 'ticks' });
    [0, 1, 3, 6, 8, 10, 12].forEach(function (i) {
      if (i <= n) ticks.appendChild(h('span', { class: (i === 1 || i === 10) ? 'minor' : '', style: 'left:' + at(i / n), text: i === n ? '1' : fmt(L[i]) }));
    });
    var readS = h('span'), readNfe = h('small');
    var btn = playButton(function () { setPlaying(!playing); });
    var ctrl = h('div', { class: 'ctrl' }, [btn, h('div', { class: 'track' }, [range, ticks]),
      h('div', { class: 'readout' }, [readS, readNfe])]);
    var thumbs = h('div', { class: 'thumbs', role: 'group', 'aria-label': 'Edits' });
    root.appendChild(h('div', { class: 'bar' }, [tierPills]));
    root.appendChild(panels);
    root.appendChild(promptBox);
    root.appendChild(ctrl);
    root.appendChild(thumbs);

    function base(e) { return 'static/img/' + e.id + '/'; }
    function renderThumbs() {
      thumbs.innerHTML = '';
      ex.forEach(function (e, i) {
        if (e.tier !== TIERS[tier]) return;
        var b = h('button', { type: 'button', title: e.label, 'aria-label': e.label, 'aria-pressed': String(i === cur) },
          [h('img', { src: base(e) + 'thumb.webp', alt: '', width: '128', height: '128', loading: 'lazy' })]);
        b.addEventListener('click', function () { setPlaying(false); pick(i); });
        thumbs.appendChild(b);
      });
    }
    function pick(i) {
      cur = i;
      var e = ex[i];
      L.forEach(function (v) { (new Image()).src = base(e) + 's' + fmt(v) + '.webp'; (new Image()).src = base(e) + 'y' + fmt(v) + '.png'; });
      srcImg.src = base(e) + 's0.webp';
      promptBox.innerHTML = '';
      promptBox.appendChild(promptPair(e.c, e.c_new));
      Array.prototype.forEach.call(thumbs.children, function (b) { b.setAttribute('aria-pressed', String(b.title === e.label)); });
      show();
    }
    function show() {
      var e = ex[cur], v = L[k], key = fmt(v);
      range.value = String(k);
      yImg.src = base(e) + 'y' + key + '.png';
      outImg.src = base(e) + 's' + key + '.webp';
      readS.textContent = 's = ' + key;
      readNfe.textContent = k === 0 ? 'source' : (k === n ? 'regeneration' : '');
      var edited = e.margin[k] > 0;
      badge.textContent = 'CLIP prefers c' + (edited ? PRIME : '');
      badge.classList.toggle('on', edited);
    }
    function step() {
      timer = 0;
      if (!playing || !visible) return;
      var wait;
      if (k < n) { k += 1; wait = k === n ? 1700 : 620; } else { k = 0; wait = 1000; }
      show();
      timer = setTimeout(step, wait);
    }
    function setPlaying(on) {
      playing = on; btn.show(on);
      if (timer) { clearTimeout(timer); timer = 0; }
      if (on && visible) timer = setTimeout(step, 500);
    }
    range.addEventListener('input', function () { setPlaying(false); k = +range.value; show(); });
    renderThumbs();
    pick(cur);
    btn.show(playing);
    whenVisible(root, function (on) { visible = on; setPlaying(playing); });
  }

  /* ---------------- video: LTX-Video, renoise-denoise against the swap ---------------- */
  function videoViewer(root, D) {
    var NFE_RD = { '0.9094': 5, '0.975': 6, '0.9937': 9 }, NFE_SWAP = 10;   // paper video swap table: 2+3, 3+3, 6+3 and 7+3
    var cur = Math.max(0, D.edits.findIndex(function (e) { return e.pair === 'v_t2_robotdog'; }));   // the overview card's edit
    var sg = 1, visible = false, want = !REDUCE;
    var vids = [0, 1, 2].map(function () { return h('video', { class: 'wide', preload: 'auto', muted: '', playsinline: '' }); });
    var rdTag = h('small'), swTag = h('small');
    function panel(v, title, small) {
      return h('div', { class: 'panel' }, [h('div', { class: 'media' }, [v]), h('div', { class: 'tag' }, [title, small])]);
    }
    var range = scrubber(function (f) { want = false; btn.show(false); c.pause(); c.seek(f * (vids[0].duration || 0)); });
    var c = clock(vids, function (t, d) { if (d) range.value = String(Math.round(1000 * t / d)); });
    var btn = playButton(function () { want = !c.playing(); sync(); });
    var editPills = pills(D.edits.map(function (e) { return e.label; }), cur, function (i) { cur = i; load(); }, 'Edit');
    var sPills = pills(D.sigmas.map(function (v) { return 's = ' + v.toFixed(3); }), sg, function (i) { sg = i; load(); }, 'Renoising strength');
    var promptBox = h('div');
    root.appendChild(h('div', { class: 'bar' }, [editPills, sPills]));
    root.appendChild(h('div', { class: 'panels' }, [panel(vids[0], 'Source', null),
      panel(vids[1], 'Renoise-denoise', rdTag), panel(vids[2], 'Swap', swTag)]));
    root.appendChild(promptBox);
    root.appendChild(h('div', { class: 'ctrl' }, [btn, h('div', { class: 'track' }, [range])]));
    function load() {
      var e = D.edits[cur], s = D.sigmas[sg], key = String(s), base = 'static/video/edit/';
      var srcs = [base + e.src + '.mp4', base + e.src + '__' + e.pair + '__s' + key + '.mp4', base + e.src + '__' + e.pair + '__swap' + key + '.mp4'];
      vids[0].poster = base + e.src + '.jpg';
      vids.forEach(function (v, i) { if (v.getAttribute('src') !== srcs[i]) { v.src = srcs[i]; v.load(); } });
      var band = e.bands[key] || [false, false];          // black edge bands measured in the clip files
      rdTag.textContent = NFE_RD[key] + ' NFEs' + (band[0] ? ', black band is in the output' : '');
      swTag.textContent = NFE_SWAP + ' NFEs' + (band[1] ? ', black band is in the output' : '');
      promptBox.innerHTML = '';
      promptBox.appendChild(promptPair(e.c, e.c_new));
      sync();
    }
    function sync() { btn.show(want); if (want && visible) c.play(); else c.pause(); }
    load();
    whenVisible(root, function (on) { visible = on; sync(); });
  }

  /* ---------------- video: sequential prompt updates ---------------- */
  function streamViewer(root, D) {
    var LABELS = { city: 'city street', hiker: 'rope bridge', cat: 'garden cat' };
    var cur = 0, visible = false, want = !REDUCE;
    var rd = [0, 1, 2, 3].map(function () { return h('video', { preload: 'auto', muted: '', playsinline: '' }); });
    var rg = [0, 1, 2, 3].map(function () { return h('video', { preload: 'auto', muted: '', playsinline: '' }); });
    var heads = [0, 1, 2, 3].map(function () { return h('div', { class: 'colhead' }); });
    var grid = h('div', { class: 'streamgrid' });
    grid.appendChild(h('div'));
    heads.forEach(function (x) { grid.appendChild(x); });
    grid.appendChild(h('div', { class: 'rowlab' }, ['Renoise-denoise']));
    rd.forEach(function (v) { grid.appendChild(v); });
    grid.appendChild(h('div', { class: 'rowlab' }, ['Regeneration']));
    rg.forEach(function (v) { grid.appendChild(v); });
    var all = rd.concat(rg);
    var range = scrubber(function (f) { want = false; btn.show(false); c.pause(); c.seek(f * (all[0].duration || 0)); });
    var c = clock(all, function (t, d) { if (d) range.value = String(Math.round(1000 * t / d)); });
    var btn = playButton(function () { want = !c.playing(); sync(); });
    var streamPills = pills(D.streams.map(function (s) { return LABELS[s.name] || s.name; }), cur, function (i) { cur = i; load(); }, 'Stream');
    root.appendChild(h('div', { class: 'bar' }, [streamPills]));
    root.appendChild(grid);
    root.appendChild(h('div', { class: 'ctrl' }, [btn, h('div', { class: 'track' }, [range])]));
    function load() {
      var s = D.streams[cur], base = 'static/video/stream/' + s.name;
      for (var t = 0; t < 4; t++) {
        heads[t].textContent = (t ? '+ ' : '') + s.steps[t];
        heads[t].title = s.steps[t];
        [[rd, 'rd'], [rg, 'regen']].forEach(function (p) {
          var src = base + '__' + p[1] + '__' + t + '.mp4';
          if (p[0][t].getAttribute('src') !== src) { p[0][t].src = src; p[0][t].load(); }
        });
      }
      sync();
    }
    function sync() { btn.show(want); if (want && visible) c.play(); else c.pause(); }
    load();
    whenVisible(root, function (on) { visible = on; sync(); });
  }

  /* ---------------- language: LLaDA-8B erasure channel ---------------- */
  function langViewer(root, D) {
    var cur = 0, k = 5, playing = !REDUCE, visible = false, timer = 0;   // opens at s = 0.6, the paper's example
    var ex = D.examples;
    var instr = h('p', { class: 'instr' });
    var srcBox = h('div', { class: 'textbox' });
    var outBox = h('div', { class: 'textbox' });
    var outHead = h('h5');
    var outBody = h('div');
    outBox.appendChild(outHead); outBox.appendChild(outBody);
    var exPills = pills(ex.map(function (e) { return e.label; }), cur, function (i) { cur = i; setPlaying(false); render(); }, 'Edit');
    var N = 9;                                   // nine strengths 0.1 to 0.9, then regeneration
    var range = h('input', { type: 'range', min: '0', max: String(N), step: '1', value: String(k), 'aria-label': 'Renoising strength s' });
    var ticks = h('div', { class: 'ticks' });
    for (var i = 0; i <= N; i++) {
      if (i % 2 === 0 || i === N) ticks.appendChild(h('span', { class: i === N ? 'mark' : (i === N - 1 ? 'minor' : ''), style: 'left:' + at(i / N), text: i === N ? 'regen' : fmt((i + 1) / 10) }));
    }
    var readS = h('span'), readM = h('small');
    var btn = playButton(function () { setPlaying(!playing); });
    root.appendChild(h('div', { class: 'bar' }, [exPills]));
    root.appendChild(instr);
    root.appendChild(h('div', { class: 'textcols' }, [srcBox, outBox]));
    root.appendChild(h('div', { class: 'ctrl' }, [btn, h('div', { class: 'track' }, [range, ticks]), h('div', { class: 'readout' }, [readS, readM])]));
    function words(list) {
      var d = h('div');
      list.forEach(function (w, i) {
        if (i) d.appendChild(document.createTextNode(' '));
        d.appendChild(w[1] ? h('span', { class: 'new', text: w[0] }) : document.createTextNode(w[0]));
      });
      return d;
    }
    function render() {
      var e = ex[cur];
      instr.textContent = e.instruction;
      srcBox.innerHTML = '';
      srcBox.appendChild(h('h5', { text: 'Source' }));
      srcBox.appendChild(h('div', { text: e.source }));
      var lv = k < N ? e.levels[k] : e.regen;
      range.value = String(k);
      outHead.textContent = k < N ? 'Renoise-denoise, s = ' + fmt(lv.s) : 'Regeneration with the source in the prompt';
      outBody.innerHTML = '';
      outBody.appendChild(words(lv.words));
      readS.textContent = k < N ? 's = ' + fmt(lv.s) : 'regen';
      readM.textContent = k < N ? lv.masked + ' of ' + lv.tokens + ' tokens masked' : lv.nfe + ' NFEs';
    }
    function step() {
      timer = 0;
      if (!playing || !visible) return;
      var wait;
      if (k < N - 1) { k += 1; wait = k === N - 1 ? 3200 : 2200; } else { k = 0; wait = 2600; }
      render();
      timer = setTimeout(step, wait);
    }
    function setPlaying(on) {
      playing = on; btn.show(on);
      if (timer) { clearTimeout(timer); timer = 0; }
      if (on && visible) timer = setTimeout(step, 1800);
    }
    range.addEventListener('input', function () { setPlaying(false); k = +range.value; render(); });
    render();
    btn.show(playing);
    whenVisible(root, function (on) { visible = on; setPlaying(playing); });
  }

  /* ---------------- robotics: Diffusion Policy on Lift ---------------- */
  function robotViewer(root, D) {
    var arms = {};
    D.arms.forEach(function (a) { arms[a.arm] = a; });
    var rdList = D.arms.filter(function (a) { return a.kind === 'rd'; });
    var cur = 0, visible = false, want = !REDUCE;
    var vids = [0, 1, 2].map(function () { return h('video', { class: 'pix', preload: 'auto', muted: '', playsinline: '', width: '256', height: '256' }); });
    var badges = [0, 1, 2].map(function () { return h('span', { class: 'badge', hidden: '' }); });
    var tags = [0, 1, 2].map(function () { return h('small'); });
    var titles = ['Keep old plan', 'Renoise-denoise', 'Replan'];
    var panels = h('div', { class: 'panels' }, [0, 1, 2].map(function (i) {
      return h('div', { class: 'panel' }, [h('div', { class: 'media' }, [vids[i], badges[i]]), h('div', { class: 'tag' }, [titles[i], tags[i]])]);
    }));
    var time = h('span');
    var range = scrubber(function (f) { want = false; btn.show(false); c.pause(); c.seek(f * (vids[0].duration || 0)); });
    var marks = h('div', { class: 'marks' });
    var shown = [];
    var c = clock(vids, function (t, d) {
      if (d) {
        range.value = String(Math.round(1000 * t / d));
        marks.innerHTML = '';
        marks.appendChild(h('span', { style: 'left:' + at(Math.min(1, D.disturb_step / D.fps / d)), text: 'cube moved' }));
      }
      var step = Math.floor(t * D.fps + 1e-6);
      time.textContent = 'step ' + step;
      shown.forEach(function (a, i) {
        var up = a.t_lift != null && step >= a.t_lift;
        badges[i].textContent = 'lifted at step ' + a.t_lift;
        badges[i].hidden = !up;
        badges[i].classList.toggle('on', up);
      });
    });
    var btn = playButton(function () { want = !c.playing(); sync(); });
    var sPills = pills(rdList.map(function (a) { return 's = ' + a.s; }), cur, function (i) { cur = i; load(); }, 'Renoising strength');
    root.appendChild(h('div', { class: 'bar' }, [sPills]));
    root.appendChild(panels);
    root.appendChild(h('div', { class: 'ctrl' }, [btn, h('div', { class: 'track' }, [range, marks]), h('div', { class: 'readout' }, [time])]));
    function load() {
      var rdArm = rdList[cur];
      shown = [arms.rd_s100, rdArm, arms.replan];
      shown.forEach(function (a, i) {
        var src = 'static/video/robot/lift_' + a.arm + '.mp4';
        if (vids[i].getAttribute('src') !== src) { vids[i].src = src; vids[i].load(); }
      });
      tags[0].textContent = 's = 0 \u00b7 0 NFEs';
      tags[1].textContent = 's = ' + rdArm.s + ' \u00b7 ' + rdArm.react_nfe + ' NFEs';
      tags[2].textContent = 's = 1 \u00b7 ' + arms.replan.react_nfe + ' NFEs';
      sync();
    }
    function sync() { btn.show(want); if (want && visible) c.play(); else c.pause(); }
    load();
    whenVisible(root, function (on) { visible = on; sync(); });
  }

  function boot() {
    if (window.IMAGES) imageViewer(document.getElementById('imgViewer'), window.IMAGES);
    if (window.VIDEO) videoViewer(document.getElementById('vidViewer'), window.VIDEO);
    if (window.STREAMS) streamViewer(document.getElementById('streamViewer'), window.STREAMS);
    if (window.LANG) langViewer(document.getElementById('langViewer'), window.LANG);
    if (window.ROBOT) robotViewer(document.getElementById('robotViewer'), window.ROBOT);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
