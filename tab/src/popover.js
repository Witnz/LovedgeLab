(function (root) {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function faviconUrl(pageUrl, base) {
    const b = base || (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL("/_favicon/") : "/_favicon/");
    return b + "?pageUrl=" + encodeURIComponent(pageUrl) + "&size=16";
  }
  function row(l, favicons) {
    const letter = esc((l.title || l.host || "?").charAt(0).toUpperCase());
    const img = favicons ? '<img src="' + esc(faviconUrl(l.url)) + '" width="16" height="16" alt="" decoding="async">' : "";
    return '<a class="lr" href="' + esc(l.url) + '" title="' + esc(l.title + " - " + l.host) + '"><span class="fav">' + letter + img + '</span>' +
      '<span class="nm">' + esc(l.title) + '</span></a>';
  }
  /* Names only, one per row, grouped under sub-headings; CSS elides long names at the tile width. */
  function listHtml(cat, opts) {
    const o = Object.assign({ favicons: true }, opts);
    if (!cat || !cat.groups || !cat.groups.length) return '<div class="lr">No links</div>';
    let out = "";
    for (const g of cat.groups) {
      if (!g.links.length) continue;
      if (g.title) out += '<div class="lg">' + esc(g.title) + '</div>';
      out += g.links.map(l => row(l, o.favicons)).join("");
    }
    return out;
  }
  const api = { listHtml: listHtml, faviconUrl: faviconUrl };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Popover = api;
})(typeof window !== "undefined" ? window : globalThis);
