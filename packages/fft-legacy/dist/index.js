function g(t, n) {
  return [t[0] + n[0], t[1] + n[1]];
}
function h(t, n) {
  return [t[0] - n[0], t[1] - n[1]];
}
function d(t, n) {
  return [
    t[0] * n[0] - t[1] * n[1],
    t[0] * n[1] + t[1] * n[0]
  ];
}
function m(t) {
  return Math.sqrt(t[0] ** 2 + t[1] ** 2);
}
const f = {};
function i(t, n) {
  const o = -2 * Math.PI * (t / n);
  return f[n] ??= {}, f[n][t] ??= [Math.cos(o), Math.sin(o)], f[n][t];
}
function _(t) {
  return t.map(m).slice(0, t.length / 2);
}
function y(t, n) {
  const o = n / t.length;
  return t.slice(0, t.length / 2).map((r, s) => s * o);
}
const x = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  exponent: i,
  fftFreq: y,
  fftMag: _
}, Symbol.toStringTag, { value: "Module" }));
function p(t) {
  const n = t.length, o = [];
  if (n === 1) {
    const e = t[0];
    return [Array.isArray(e) ? [e[0], e[1]] : [e, 0]];
  }
  const r = (e, c) => c % 2 === 0, s = (e, c) => c % 2 === 1, u = p(t.filter(r)), l = p(t.filter(s));
  for (let e = 0; e < n / 2; e++) {
    const c = u[e], a = d(i(e, n), l[e]);
    o[e] = g(c, a), o[e + n / 2] = h(c, a);
  }
  return o;
}
function M(t) {
  const n = t.length, o = [];
  for (let r = 0; r < n; r++) {
    let s = [0, 0];
    for (let u = 0; u < n; u++) {
      const l = typeof t[u] == "number" ? [t[u], 0] : t[u], e = i(r * u, n);
      s = g(s, d(l, e));
    }
    o[r] = s;
  }
  return o;
}
function X(t) {
  const n = t.map(([r, s]) => [s, r]), o = M(n);
  return o.map(([r, s]) => [s / o.length, r / o.length]);
}
export {
  M as dft,
  p as fft,
  X as ifft,
  x as util
};
