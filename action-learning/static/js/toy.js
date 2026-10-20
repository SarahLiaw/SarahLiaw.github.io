/* Toy landscape of Figs. 2-3: overdamped Langevin dynamics in a channel just above the drawn curve.
   State x = (u, h) in units of the image width. V = c G(u) + k(s) s^2 with s = h - G(u) - d.
   Path quantities are exact for the Euler-Maruyama chain on this grid (Eqs. 8-9, A.10).
   The reference is a Brownian bridge with diffusion Dref, conditioned to stay above the curve. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LEAPToy = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULTS = { D: 0.0032, Dref: 0.0288, dt: 0.0025, N: 100, c: 5, kUp: 1.8, kDn: 160, d: 0.01, below: 0.002 };

  function rng(seed) {
    let a = seed >>> 0, spare = null;
    const uni = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const normal = () => {
      if (spare !== null) { const s = spare; spare = null; return s; }
      let u = 0, v = 0;
      while (u <= 1e-12) u = uni();
      v = uni();
      const r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    };
    return { uni, normal };
  }

  function make(ground, opts) {
    const p = Object.assign({}, DEFAULTS, opts || {});
    const { D, Dref, dt, c, kUp, kDn, d } = p;
    const L = ground.L, x0 = ground.x0, Y = Float64Array.from(ground.G), n = Y.length;
    // Natural cubic spline through the curve (unit knot spacing in pixels): G, G', G'' agree exactly.
    const M2 = new Float64Array(n);
    {
      const cp = new Float64Array(n), rhs = new Float64Array(n);
      for (let i = 1; i < n - 1; i++) rhs[i] = 6 * (Y[i + 1] - 2 * Y[i] + Y[i - 1]);
      for (let i = 1; i < n - 1; i++) {
        const m = 4 - (i > 1 ? cp[i - 1] : 0);
        cp[i] = 1 / m;
        rhs[i] = (rhs[i] - (i > 1 ? rhs[i - 1] : 0)) / m;
      }
      for (let i = n - 2; i >= 1; i--) M2[i] = rhs[i] - cp[i] * M2[i + 1];
    }
    const sp = new Float64Array(3);       // G, dG/du, d2G/du2 at the last query
    function spline(u) {
      let f = u * L - x0;
      if (f < 0) f = 0;
      if (f > n - 1) f = n - 1;
      let i = f | 0;
      if (i > n - 2) i = n - 2;
      const t = f - i, a = Y[i], b = Y[i + 1], ma = M2[i], mb = M2[i + 1];
      sp[0] = (1 - t) * a + t * b + ((1 - t) ** 3 - (1 - t)) * ma / 6 + (t ** 3 - t) * mb / 6;
      sp[1] = (b - a + (-(3 * (1 - t) ** 2) + 1) * ma / 6 + (3 * t * t - 1) * mb / 6) * L;
      sp[2] = ((1 - t) * ma + t * mb) * L * L;
      return sp;
    }
    const ground_h = (u) => spline(u)[0];

    // drift b = -grad V into out[0..1]
    function drift(u, h, out) {
      spline(u);
      const s = h - sp[0] - d, k = s >= 0 ? kUp : kDn;
      out[0] = sp[1] * (2 * k * s - c);
      out[1] = -2 * k * s;
    }
    // Jacobian of b: [buu, buh, bhu, bhh]
    function jac(u, h, out) {
      spline(u);
      const g1 = sp[1], g2 = sp[2], s = h - sp[0] - d, k = s >= 0 ? kUp : kDn;
      out[0] = g2 * (2 * k * s - c) - 2 * k * g1 * g1;
      out[1] = 2 * k * g1;
      out[2] = 2 * k * g1;
      out[3] = -2 * k;
    }
    function V(u, h) {
      spline(u);
      const s = h - sp[0] - d, k = s >= 0 ? kUp : kDn;
      return c * sp[0] + k * s * s;
    }

    const bk = new Float64Array(2), J = new Float64Array(4);
    // Eq. (9) with b_ref = 0: one transition's correction term
    function gTerm(ua, ha, ub, hb) {
      drift(ua, ha, bk);
      return (bk[0] * (ub - ua) + bk[1] * (hb - ha)) / (2 * D) - (bk[0] * bk[0] + bk[1] * bk[1]) * dt / (4 * D);
    }
    // path = Float64Array [u0,h0,u1,h1,...]
    function Gpath(path, from, to) {
      const m = path.length / 2 - 1;
      from = from || 0; to = to === undefined ? m : to;
      let s = 0;
      for (let k = from; k < to; k++) s += gTerm(path[2 * k], path[2 * k + 1], path[2 * k + 2], path[2 * k + 3]);
      return s;
    }
    // Brownian action with diffusion Dv (default: the data diffusion, as in Eq. 9)
    function Sref(path, Dv) {
      Dv = Dv || D;
      let s = 0;
      for (let k = 0; k + 3 < path.length; k += 2) {
        const du = path[k + 2] - path[k], dh = path[k + 3] - path[k + 1];
        s += (du * du + dh * dh) / (4 * Dv * dt);
      }
      return s;
    }
    // Exact log p_data/p_ref against the wider reference, up to a context constant
    const logRatio = (path) => Sref(path, Dref) - S(path);
    function S(path) {
      let s = 0;
      for (let k = 0; k + 3 < path.length; k += 2) {
        drift(path[k], path[k + 1], bk);
        const ru = path[k + 2] - path[k] - bk[0] * dt, rh = path[k + 3] - path[k + 1] - bk[1] * dt;
        s += (ru * ru + rh * rh) / (4 * D * dt);
      }
      return s;
    }
    function aboveGround(path, from, to) {
      const m = path.length / 2;
      from = from || 0; to = to === undefined ? m : to;
      for (let k = from; k < to; k++) if (path[2 * k + 1] < ground_h(path[2 * k]) - p.below) return false;
      return true;
    }

    // Brownian bridge of the reference (b_ref = 0) between knots i and j of `path`, in place.
    function bridgeFill(path, i, j, R, Dv) {
      const sd1 = Math.sqrt(2 * (Dv || D) * dt);
      for (let k = i; k < j - 1; k++) {
        const rem = j - k, w = 1 / rem, sd = sd1 * Math.sqrt((rem - 1) / rem);
        path[2 * k + 2] = path[2 * k] + (path[2 * j] - path[2 * k]) * w + sd * R.normal();
        path[2 * k + 3] = path[2 * k + 1] + (path[2 * j + 1] - path[2 * k + 1]) * w + sd * R.normal();
      }
    }
    function bridge(a, b, N, R, Dv) {
      const path = new Float64Array(2 * (N + 1));
      path[0] = a[0]; path[1] = a[1]; path[2 * N] = b[0]; path[2 * N + 1] = b[1];
      bridgeFill(path, 0, N, R, Dv);
      return path;
    }
    // Reference conditioned on the same event as the data: endpoints, duration, stays above the curve.
    function refBridge(a, b, N, R, tries) {
      tries = tries || 20000;
      for (let t = 0; t < tries; t++) {
        const path = bridge(a, b, N, R, Dref);
        if (aboveGround(path)) return { path, tries: t + 1 };
      }
      return null;
    }

    // Path functionals for tilting and soft constraints (means over interior knots).
    const mk = (M, u, h) => {
      const su = M.su || M.s, sh = M.sh || M.s, du = (u - M.c[0]) / su, dh = (h - M.c[1]) / sh;
      return Math.exp(-0.5 * (du * du + dh * dh));
    };
    function Mval(path, M) {
      if (!M) return 0;
      const m = path.length / 2 - 1;
      let s = 0;
      for (let k = 1; k < m; k++) s += mk(M, path[2 * k], path[2 * k + 1]);
      return s / (m - 1);
    }
    function Cval(path, C) {
      if (!C) return 0;
      const m = path.length / 2 - 1;
      let s = 0;
      for (let k = 1; k < m; k++) {
        const du = path[2 * k] - C.c[0], dh = path[2 * k + 1] - C.c[1];
        const rho = Math.sqrt(du * du + dh * dh);
        if (rho < C.r) { const z = (C.r - rho) / C.r; s += z * z; }
      }
      return s / (m - 1);
    }

    // Metropolis-Hastings on pi ∝ p_ref exp(G + aM M - aC C) restricted to the event (Eq. 16-17).
    // Window proposals come from the reference bridge, so they cancel against p_ref.
    function mh(path, R, steps, o) {
      o = o || {};
      const m = path.length / 2 - 1, W = o.window || 16;
      const aM = o.aM || 0, aC = o.aC || 0, M = o.M, C = o.C;
      const prop = new Float64Array(path.length);
      let acc = 0;
      for (let s = 0; s < steps; s++) {
        const len = 2 + Math.floor(R.uni() * (W - 1));
        const i = Math.floor(R.uni() * (m - len + 1)), j = i + len;
        prop.set(path.subarray(2 * i, 2 * j + 2), 2 * i);
        bridgeFill(prop, i, j, R);
        if (!aboveGround(prop, i + 1, j)) continue;
        let dlog = Gpath(prop, i, j) - Gpath(path, i, j);
        if (aM || aC) {
          for (let k = Math.max(i + 1, 1); k < Math.min(j, m); k++) {
            if (aM) dlog += aM * (mk(M, prop[2 * k], prop[2 * k + 1]) - mk(M, path[2 * k], path[2 * k + 1])) / (m - 1);
            if (aC) {
              const q = (x, y) => { const r = Math.hypot(x - C.c[0], y - C.c[1]); return r < C.r ? ((C.r - r) / C.r) ** 2 : 0; };
              dlog -= aC * (q(prop[2 * k], prop[2 * k + 1]) - q(path[2 * k], path[2 * k + 1])) / (m - 1);
            }
          }
        }
        if (dlog >= 0 || R.uni() < Math.exp(dlog)) {
          path.set(prop.subarray(2 * i, 2 * j + 2), 2 * i);
          acc++;
        }
      }
      return acc / steps;
    }

    // Gradient of F = S - lM M + lC C with respect to the interior knots.
    function gradF(path, g, o) {
      const m = path.length / 2 - 1, lM = o.lM || 0, lC = o.lC || 0, M = o.M, C = o.C;
      const r = o._r || (o._r = new Float64Array(2 * m));
      for (let k = 0; k < m; k++) {
        drift(path[2 * k], path[2 * k + 1], bk);
        r[2 * k] = path[2 * k + 2] - path[2 * k] - bk[0] * dt;
        r[2 * k + 1] = path[2 * k + 3] - path[2 * k + 1] - bk[1] * dt;
      }
      const sc = 1 / (2 * D * dt);
      g.fill(0);
      for (let j = 1; j < m; j++) {
        jac(path[2 * j], path[2 * j + 1], J);
        const ru = r[2 * j], rh = r[2 * j + 1];
        g[2 * j] = sc * (r[2 * j - 2] - ru - dt * (J[0] * ru + J[2] * rh));
        g[2 * j + 1] = sc * (r[2 * j - 1] - rh - dt * (J[1] * ru + J[3] * rh));
        const u = path[2 * j], h = path[2 * j + 1];
        if (lM) {
          const su = M.su || M.s, sh = M.sh || M.s, e = mk(M, u, h);
          g[2 * j] += lM * e * (u - M.c[0]) / (su * su) / (m - 1);
          g[2 * j + 1] += lM * e * (h - M.c[1]) / (sh * sh) / (m - 1);
        }
        if (lC) {
          const du = u - C.c[0], dh = h - C.c[1], rho = Math.sqrt(du * du + dh * dh);
          if (rho < C.r && rho > 1e-9) {
            const f = -2 * (C.r - rho) / (C.r * C.r) / rho / (m - 1) * lC;
            g[2 * j] += f * du;
            g[2 * j + 1] += f * dh;
          }
        }
      }
      return g;
    }
    function F(path, o) {
      return S(path) - (o.lM || 0) * Mval(path, o.M) + (o.lC || 0) * Cval(path, o.C);
    }
    // Heavy-ball descent on F; o.vel carries momentum across calls so it can run a few steps per frame.
    function descend(path, iters, o) {
      const lr = (o.lr || 0.5) * D * dt, beta = o.beta === undefined ? 0.85 : o.beta;
      const g = o._g || (o._g = new Float64Array(path.length));
      const vel = o.vel || (o.vel = new Float64Array(path.length));
      for (let it = 0; it < iters; it++) {
        gradF(path, g, o);
        for (let i = 2; i < path.length - 2; i++) {
          vel[i] = beta * vel[i] - lr * g[i];
          path[i] += vel[i];
        }
      }
      return F(path, o);
    }

    const ends = () => {
      const ua = ground.a_px / L, ub = ground.b_px / L;
      return [[ua, ground_h(ua) + d], [ub, ground_h(ub) + d]];
    };
    // image-pixel coordinates of a state
    const toPx = (u, h) => [u * L, ground.y_ref - h * L];

    return {
      params: p, ground_h, drift, jac, V, gTerm, Gpath, S, Sref, logRatio, F, Mval, Cval, gradF,
      aboveGround, bridge, bridgeFill, refBridge, mh, descend, ends, toPx,
    };
  }

  return { make, rng, DEFAULTS };
});
