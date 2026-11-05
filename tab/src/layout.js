(function (root) {
  function fitColumns(n, w, minTile, gap, maxCols) {
    if (!(n > 0)) return 1;
    const width = Number.isFinite(w) ? w : minTile;
    const fit = Math.max(1, Math.min(maxCols, Math.floor((width + gap) / (minTile + gap))));
    const rows = Math.ceil(n / fit);
    return Math.max(1, Math.ceil(n / rows));
  }
  function dailyCols(n) {
    return Math.min(4, Math.max(2, Math.ceil((n > 0 ? n : 0) / 2)));
  }
  const api = { fitColumns, dailyCols };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Layout = api;
})(typeof window !== "undefined" ? window : globalThis);
