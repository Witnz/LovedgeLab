/* Settings model: defaults, validation, merge, hash. Pure; no DOM, no storage. */
(function (root) {
  const P = root.Palette || (typeof require === "function" ? require("./palette.js") : null);
  const WF = root.Wireframes || (typeof require === "function" ? require("./wireframes.js") : null);
  const GLYPHS = ["folder", "mail", "flame", "cap", "package", "disc", "film", "terminal", "keyboard", "star", "heart", "code", "book", "cloud", "gamepad", "music", "shield", "home", "wrench", "globe", "camera"];
  const LIMITS = { tiles: 12, categories: 60, label: 40, url: 300 };

  const DEFAULTS = {
    v: 1,
    appearance: { preset: "night", colors: {}, effects: "full" },
    layout: { maxCatsPerRow: 8 },
    behaviour: { newTab: false, favicons: true, clock: true },
    tiles: [
      { id: "github", label: "GitHub", url: "https://github.com/", accent: "cyan", wf: "code", icon: "fav" },
      { id: "outlook", label: "Outlook", url: "https://outlook.office.com/", accent: "blue", wf: "mail", icon: "fav" },
      { id: "wiki", label: "Wikipedia", url: "https://www.wikipedia.org/", accent: "green", wf: "docs", icon: "fav" },
      { id: "learn", label: "Microsoft Learn", url: "https://learn.microsoft.com/", accent: "magenta", wf: "app", icon: "fav" }
    ],
    categories: {}
  };

  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  const pick = (v, list, def) => list.indexOf(v) >= 0 ? v : def;
  const bool = (v, def) => typeof v === "boolean" ? v : def;

  function cleanUrl(u) {
    if (typeof u !== "string" || u.length > LIMITS.url) return null;
    try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch (e) { return null; }
  }
  function cleanTile(t, seen) {
    if (!isObj(t)) return null;
    const url = cleanUrl(t.url);
    if (!url) return null;
    let id = typeof t.id === "string" && /^[a-z0-9]{1,16}$/.test(t.id) ? t.id : "t" + Math.random().toString(36).slice(2, 8);
    while (seen[id]) id += "x";
    seen[id] = true;
    const label = (typeof t.label === "string" ? t.label.trim() : "").slice(0, LIMITS.label) || new URL(url).hostname.replace(/^www\./, "");
    return { id: id, label: label, url: url, accent: pick(t.accent, P.ACCENT, "blue"),
      wf: t.wf === "custom" || WF.IDS.indexOf(t.wf) >= 0 ? t.wf : "app", icon: pick(t.icon, ["fav", "none", "img"], "fav") };
  }
  function cleanCategories(c) {
    const out = {};
    if (!isObj(c)) return out;
    let n = 0;
    for (const name of Object.keys(c)) {
      if (n >= LIMITS.categories || name.length > 80 || !isObj(c[name])) continue;
      const o = {}, s = c[name];
      if (typeof s.hidden === "boolean" && s.hidden) o.hidden = true;
      if (P.ACCENT.indexOf(s.accent) >= 0) o.accent = s.accent;
      if (s.icon === "img" || GLYPHS.indexOf(s.icon) >= 0) o.icon = s.icon;
      out[name] = o;
      n++;
    }
    return out;
  }

  function merge(stored) {
    const s = isObj(stored) && typeof stored.v === "number" && stored.v <= DEFAULTS.v ? stored : null;
    const a = (s && s.appearance) || {}, l = (s && s.layout) || {}, b = (s && s.behaviour) || {};
    const colors = {};
    if (isObj(a.colors)) for (const t of P.TOKENS) if (P.isHex(a.colors[t])) colors[t] = a.colors[t].toLowerCase();
    let tiles;
    if (s && Array.isArray(s.tiles)) {
      const seen = {};
      tiles = s.tiles.slice(0, LIMITS.tiles).map(t => cleanTile(t, seen)).filter(Boolean);
    } else tiles = DEFAULTS.tiles.map(t => Object.assign({}, t));
    const cols = Number.isFinite(l.maxCatsPerRow) ? Math.min(12, Math.max(2, Math.round(l.maxCatsPerRow))) : DEFAULTS.layout.maxCatsPerRow;
    return {
      v: DEFAULTS.v,
      appearance: { preset: pick(a.preset, Object.keys(P.PRESETS), "night"), colors: colors, effects: pick(a.effects, ["full", "lite", "off"], "full") },
      layout: { maxCatsPerRow: cols },
      behaviour: { newTab: bool(b.newTab, false), favicons: bool(b.favicons, true), clock: bool(b.clock, true) },
      tiles: tiles,
      categories: cleanCategories(s && s.categories)
    };
  }

  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (isObj(v)) return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}";
    return JSON.stringify(v);
  }
  function hash(v) {
    const str = stable(v);
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function newTileId() { return "t" + Math.random().toString(36).slice(2, 8); }

  const api = { DEFAULTS, GLYPHS, LIMITS, merge, hash, stable, cleanUrl, newTileId };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Settings = api;
})(typeof window !== "undefined" ? window : globalThis);
