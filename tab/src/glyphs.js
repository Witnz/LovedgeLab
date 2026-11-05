/* Built-in category glyphs (24-unit line icons) as an SVG sprite. */
(function (root) {
  const G = {
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c3 2 9 2 12 0v-4.5"/>',
    package: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    terminal: '<path d="M4 6l6 6-6 6M12 18h8"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    heart: '<path d="M12 20.5 4 12.6A4.8 4.8 0 0 1 11 5.8l1 1 1-1A4.8 4.8 0 0 1 20 12.6z"/>',
    code: '<path d="M8 7 3 12l5 5M16 7l5 5-5 5"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H19v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5"/>',
    cloud: '<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5 4.8 4.8 0 0 1 17.5 18z"/>',
    gamepad: '<rect x="2.5" y="7" width="19" height="10" rx="5"/><path d="M7.5 10v4M5.5 12h4M15.5 11h.01M18 13h.01"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    shield: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6z"/>',
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M10 20v-5h4v5"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5l-9.9 9.9a2.1 2.1 0 0 1-3-3z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'
  };
  const names = Object.keys(G);
  const sprite = () => '<svg style="position:absolute;width:0;height:0" aria-hidden="true">' +
    names.map(n => '<symbol id="i-' + n + '" viewBox="0 0 24 24">' + G[n] + "</symbol>").join("") + "</svg>";
  const api = { names: names, sprite: sprite, inner: n => G[n] || G.folder };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Glyphs = api;
})(typeof window !== "undefined" ? window : globalThis);
