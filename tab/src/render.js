/* HTML for tiles and categories, plus the first-paint cache. Everything user-supplied is escaped or sanitised here. */
(function (root) {
  const W = root.Wireframes || (typeof require === "function" ? require("./wireframes.js") : null);
  const M = root.Media || (typeof require === "function" ? require("./media.js") : null);
  const Pop = root.Popover || (typeof require === "function" ? require("./popover.js") : null);
  const G = root.Glyphs || (typeof require === "function" ? require("./glyphs.js") : null);
  const ACCENTS = ["blue", "red", "magenta", "green", "cyan", "orange", "yellow", "teal"];
  const KEY = "lovedgelab.cache.v1";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const accent = a => ACCENTS.indexOf(a) >= 0 ? a : "blue";
  const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };

  function tileIcon(t, media, favicons) {
    const letter = esc((t.label || "?").charAt(0).toUpperCase());
    if (t.icon === "none") return "";
    if (t.icon === "img" && media.ic && M.iconOk(media.ic[t.id])) return '<span class="tico"><img src="' + esc(media.ic[t.id]) + '" alt="" width="22" height="22"></span>';
    if (!favicons) return '<span class="tico">' + letter + "</span>";
    return '<span class="tico">' + letter + '<img src="' + esc(Pop.faviconUrl(t.url)) + '" alt="" width="22" height="22" decoding="async"></span>';
  }

  function tilesHtml(tiles, media, opts) {
    const m = media || {}, o = Object.assign({ favicons: true }, opts);
    return tiles.map(t => {
      const art = t.wf === "custom" ? (M.wfMarkup(m.wf && m.wf[t.id]) || W.svg("app")) : W.svg(t.wf);
      return '<a class="t" data-id="' + esc(t.id) + '" href="' + esc(t.url) + '" style="--c:var(--' + accent(t.accent) + ')">' + art +
        '<div class="cap">' + tileIcon(t, m, o.favicons) + '<div><div class="n">' + esc(t.label) + '</div><div class="h">' + esc(hostOf(t.url)) + "</div></div></div></a>";
    }).join("");
  }

  function catIcon(c, media) {
    if (c.icon === "img" && media.cat && M.iconOk(media.cat[c.name])) return '<img class="cimg" src="' + esc(media.cat[c.name]) + '" alt="" width="22" height="22">';
    const g = G.names.indexOf(c.icon) >= 0 ? c.icon : "folder";
    return '<svg class="ic"><use href="#i-' + g + '"/></svg>';
  }
  function catsHtml(cats, media) {
    const m = media || {};
    return cats.map((c, i) =>
      '<div class="cat" data-id="' + esc(c.id) + '" data-i="' + i + '" style="--c:var(--' + accent(c.accent) + ')" tabindex="0" role="button" aria-expanded="false">' +
        '<div class="ct"><span class="cico">' + catIcon(c, m) + "<b>" + (+c.count || 0) + "</b></span>" +
        '<span class="cn">' + esc(c.name) + '</span></div><div class="links" hidden></div></div>'
    ).join("");
  }

  const Cache = {
    read() { try { const c = JSON.parse(localStorage.getItem(KEY)); return c && c.v === 1 ? c : null; } catch (e) { return null; } },
    write(obj) { try { localStorage.setItem(KEY, JSON.stringify(Object.assign({ v: 1 }, obj))); } catch (e) { /* storage full or blocked */ } },
    patch(part) { const c = Cache.read(); if (c) Cache.write(Object.assign(c, part)); }
  };

  const api = { esc: esc, tilesHtml: tilesHtml, catsHtml: catsHtml, Cache: Cache };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.Render = api; root.Cache = Cache; }
})(typeof window !== "undefined" ? window : globalThis);
