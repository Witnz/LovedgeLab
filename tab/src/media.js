/* User media: SVG sanitiser (wireframes), image data-URL validation and icon fitting (icons). */
(function (root) {
  const MAX_SVG = 6000;       /* chars; one storage.sync item holds 8192 bytes including its key */
  const MAX_ICON = 6000;      /* chars of data URL */
  const ELEMENTS = ["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "defs", "clippath", "lineargradient", "radialgradient", "stop"];
  const ATTRS = ["viewbox", "d", "x", "y", "width", "height", "rx", "ry", "cx", "cy", "r", "x1", "y1", "x2", "y2", "points", "transform",
    "class", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-opacity", "fill-opacity", "opacity", "fill-rule",
    "clip-rule", "id", "clip-path", "offset", "stop-color", "stop-opacity", "gradientunits", "gradienttransform", "stroke-dasharray"];
  const PAINT = /^(none|currentcolor|#[0-9a-f]{3,8}|url\(#[\w-]+\)|rgba?\([\d\s.,%]+\)|[a-z]{3,20})$/i;
  const NUM = /^[\d\s.,eE+\-%#a-zA-Z()]*$/;
  const CLASSES = /^(f|s|k|l)( (f|s|k|l))*$/;

  const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=\/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>/g;
  const ATTR = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;

  function round(v) { return v.replace(/-?\d*\.\d+/g, n => String(Math.round(parseFloat(n) * 10) / 10)); }

  /* Returns { ok, svg, error }. Keeps an allow-list of shapes and attributes; drops everything else, including all text. */
  function sanitizeSvg(input) {
    if (typeof input !== "string") return { ok: false, error: "No SVG text." };
    if (input.length > 400000) return { ok: false, error: "That SVG is too large." };
    const src = input.replace(/<!--[\s\S]*?-->/g, "").replace(/<\?[\s\S]*?\?>/g, "").replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<(script|style|foreignObject|metadata|title|desc|text)\b[\s\S]*?<\/\1\s*>/gi, "");
    const out = [];
    const stack = [];
    let sawRoot = false, view = null, m;
    TAG.lastIndex = 0;
    while ((m = TAG.exec(src))) {
      const closing = m[1] === "/", name = m[2].toLowerCase(), self = m[4] === "/";
      if (ELEMENTS.indexOf(name) < 0) { continue; }
      if (closing) {
        if (stack.length && stack[stack.length - 1] === name) { stack.pop(); out.push("</" + name + ">"); }
        continue;
      }
      let attrs = "", a;
      ATTR.lastIndex = 0;
      const raw = m[3] || "";
      while ((a = ATTR.exec(raw))) {
        const key = a[1].toLowerCase();
        let val = a[2] != null ? a[2] : a[3];
        if (val == null || ATTRS.indexOf(key) < 0) continue;
        val = val.trim();
        if (/javascript:|data:|<|>|&|\\/i.test(val)) continue;
        if (key === "class" && !CLASSES.test(val)) continue;
        if (key === "fill" || key === "stroke" || key === "stop-color") { if (!PAINT.test(val)) continue; }
        else if (key === "clip-path") { if (!/^url\(#[\w-]+\)$/.test(val)) continue; }
        else if (key === "id") { if (!/^[\w-]{1,24}$/.test(val)) continue; }
        else if (!NUM.test(val)) continue;
        if (name === "svg" && (key === "width" || key === "height")) continue;
        if (key === "viewbox") view = val;
        attrs += " " + (key === "viewbox" ? "viewBox" : key) + '="' + round(val) + '"';
      }
      if (name === "svg") {
        if (sawRoot) continue;
        sawRoot = true;
        if (!view || !/^-?[\d.]+[\s,]+-?[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+$/.test(view)) return { ok: false, error: "The SVG needs a viewBox." };
        out.push('<svg xmlns="http://www.w3.org/2000/svg"' + attrs + ">");
        stack.push("svg");
        if (self) { stack.pop(); out.push("</svg>"); }
        continue;
      }
      if (!sawRoot) continue;
      if (self) out.push("<" + name + attrs + "/>");
      else { out.push("<" + name + attrs + ">"); stack.push(name); }
    }
    if (!sawRoot) return { ok: false, error: "That file is not an SVG." };
    while (stack.length) out.push("</" + stack.pop() + ">");
    const svg = out.join("");
    if (svg.length > MAX_SVG) return { ok: false, error: "Too detailed (" + svg.length + " of " + MAX_SVG + " characters). Simplify the drawing and try again." };
    if (!/<(path|rect|circle|ellipse|line|polyline|polygon)\b/.test(svg)) return { ok: false, error: "The SVG has no drawable shapes." };
    return { ok: true, svg: svg };
  }

  /* Wireframe SVG for a tile: custom artwork is drawn inside the same 16:9 frame as the templates. */
  function wfMarkup(svg) {
    const r = typeof svg === "string" ? sanitizeSvg(svg) : { ok: false };
    return r.ok ? r.svg.replace("<svg ", '<svg class="wf" aria-hidden="true" ') : "";
  }

  const DATA_URL = /^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+\/=]+$/;
  function iconOk(u) { return typeof u === "string" && u.length <= MAX_ICON + 40 && DATA_URL.test(u); }

  /* ---- browser only: raster an uploaded image to a small square data URL ---- */
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that image.")); };
      img.src = url;
    });
  }
  async function fitIcon(file) {
    if (!file || file.size > 5 * 1024 * 1024) throw new Error("Pick an image under 5 MB.");
    const img = await loadImage(file);
    const w = img.naturalWidth || 64, h = img.naturalHeight || 64;
    for (const size of [96, 80, 64, 48, 32]) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      g.imageSmoothingQuality = "high";
      const k = Math.min(size / w, size / h);
      g.drawImage(img, (size - w * k) / 2, (size - h * k) / 2, w * k, h * k);
      for (const [type, q] of [["image/webp", 0.85], ["image/webp", 0.6], ["image/png", undefined]]) {
        const u = c.toDataURL(type, q);
        if (u.indexOf("data:" + type) === 0 && u.length <= MAX_ICON) return u;
      }
    }
    throw new Error("That image is too detailed to store in sync. Try a simpler logo.");
  }

  const api = { MAX_SVG: MAX_SVG, MAX_ICON: MAX_ICON, sanitizeSvg: sanitizeSvg, wfMarkup: wfMarkup, iconOk: iconOk, fitIcon: fitIcon };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Media = api;
})(typeof window !== "undefined" ? window : globalThis);
