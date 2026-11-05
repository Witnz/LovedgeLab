/* Colour engine: presets, user overrides, derived tokens, contrast. Pure; no DOM. */
(function (root) {
  const SURFACE = ["bg", "bgDark", "surf", "hl", "fg", "fgDark"];
  const ACCENT = ["blue", "magenta", "cyan", "green", "orange", "red", "yellow", "teal"];
  const TOKENS = SURFACE.concat(ACCENT);
  const LABELS = { bg: "Background", bgDark: "Deep background", surf: "Panels", hl: "Highlights", fg: "Text", fgDark: "Secondary text",
    blue: "Blue", magenta: "Magenta", cyan: "Cyan", green: "Green", orange: "Orange", red: "Red", yellow: "Yellow", teal: "Teal" };

  const PRESETS = {
    night: { name: "Night", dark: true, bg: "#1a1b26", bgDark: "#16161e", surf: "#24283b", hl: "#292e42", fg: "#c0caf5", fgDark: "#a9b1d6",
      blue: "#7aa2f7", magenta: "#bb9af7", cyan: "#7dcfff", green: "#9ece6a", orange: "#ff9e64", red: "#f7768e", yellow: "#e0af68", teal: "#73daca" },
    storm: { name: "Storm", dark: true, bg: "#24283b", bgDark: "#1f2335", surf: "#2a2f45", hl: "#2f3549", fg: "#c0caf5", fgDark: "#a9b1d6",
      blue: "#7aa2f7", magenta: "#bb9af7", cyan: "#7dcfff", green: "#9ece6a", orange: "#ff9e64", red: "#f7768e", yellow: "#e0af68", teal: "#73daca" },
    moon: { name: "Moon", dark: true, bg: "#222436", bgDark: "#1e2030", surf: "#2a2d45", hl: "#2f334d", fg: "#c8d3f5", fgDark: "#a9b8e8",
      blue: "#82aaff", magenta: "#c099ff", cyan: "#86e1fc", green: "#c3e88d", orange: "#ff966c", red: "#ff757f", yellow: "#ffc777", teal: "#4fd6be" },
    day: { name: "Day", dark: false, bg: "#e1e2e7", bgDark: "#d0d5e3", surf: "#e9e9ed", hl: "#c4c8da", fg: "#3760bf", fgDark: "#6172b0",
      blue: "#2e7de9", magenta: "#9854f1", cyan: "#007197", green: "#587539", orange: "#b15c00", red: "#f52a65", yellow: "#8c6c3e", teal: "#118c74" }
  };
  const DEFAULT_PRESET = "night";

  const HEX = /^#[0-9a-f]{6}$/i;
  function isHex(v) { return typeof v === "string" && HEX.test(v); }

  /* preset values with the user's valid overrides on top; unknown presets fall back to night */
  function resolve(preset, overrides) {
    const base = PRESETS[preset] || PRESETS[DEFAULT_PRESET];
    const out = { dark: base.dark };
    for (const t of TOKENS) out[t] = base[t];
    if (overrides && typeof overrides === "object") for (const t of TOKENS) if (isHex(overrides[t])) out[t] = overrides[t].toLowerCase();
    return out;
  }

  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function lum(hex) {
    const c = rgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    const x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y);
    return (hi + 0.05) / (lo + 0.05);
  }
  /* text colour for glyphs drawn on an accent fill: whichever of the two reads best */
  function ink(accentHex, darkInk, lightInk) {
    return contrast(accentHex, darkInk) >= contrast(accentHex, lightInk) ? darkInk : lightInk;
  }

  /* CSS custom properties for a resolved palette */
  function vars(p) {
    const v = {
      "--bg": p.bg, "--bg-dark": p.bgDark, "--surf": p.surf, "--hl": p.hl, "--fg": p.fg, "--fg-dark": p.fgDark,
      "--mute": p.fgDark, "--gutter": mix(p.fgDark, p.bg, 0.28), "--sel": mix(p.blue, p.bg, 0.22),
      "--purple": p.magenta, "--scheme": p.dark ? "dark" : "light",
      "--shadow": p.dark ? "rgba(0,0,0,.30)" : "rgba(40,50,90,.16)"
    };
    for (const a of ACCENT) v["--" + a] = p[a];
    const avg = ACCENT.reduce((s, a) => s + lum(p[a]), 0) / ACCENT.length;
    v["--ink"] = avg > 0.25 ? "#16161e" : "#f5f6fa";
    return v;
  }
  function mix(a, b, t) {
    const x = rgb(a), y = rgb(b);
    const m = x.map((c, i) => Math.round(c * t + y[i] * (1 - t)));
    return "#" + m.map(c => c.toString(16).padStart(2, "0")).join("");
  }

  /* problems worth telling the user about while they edit colours */
  function warnings(p) {
    const w = [];
    if (contrast(p.fg, p.bg) < 4.5) w.push("Text on the background is hard to read (contrast " + contrast(p.fg, p.bg).toFixed(1) + ":1, aim for 4.5).");
    if (contrast(p.fgDark, p.bg) < 3) w.push("Secondary text is faint (contrast " + contrast(p.fgDark, p.bg).toFixed(1) + ":1).");
    if (contrast(p.fg, p.surf) < 4.5) w.push("Text on panels is hard to read (contrast " + contrast(p.fg, p.surf).toFixed(1) + ":1).");
    return w;
  }

  /* shuffle which accent colour sits in which slot (deterministic for a given seed) */
  function shuffleAccents(p, seed) {
    const vals = ACCENT.map(a => p[a]);
    let s = (seed >>> 0) || 1;
    for (let i = vals.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      const t = vals[i]; vals[i] = vals[j]; vals[j] = t;
    }
    const out = {};
    ACCENT.forEach((a, i) => { out[a] = vals[i]; });
    return out;
  }

  const api = { SURFACE, ACCENT, TOKENS, LABELS, PRESETS, DEFAULT_PRESET, isHex, resolve, vars, contrast, ink, warnings, shuffleAccents, mix };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Palette = api;
})(typeof window !== "undefined" ? window : globalThis);
