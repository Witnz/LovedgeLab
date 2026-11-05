/* Generic wireframe templates for the quick-site tiles. Pure strings; 160x90 viewBox.
 * Classes: f = filled panel, s = stroke only, k = key element (accent), l = accent line. Colours come from the tile (currentColor). */
(function (root) {
  const r = (x, y, w, h, c, rx) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (rx != null ? ' rx="' + rx + '"' : "") + ' class="' + c + '"/>';
  const p = (d, c) => '<path d="' + d + '" class="' + c + '"/>';
  const o = (x, y, rad, c) => '<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" class="' + c + '"/>';
  /* text lines: widths drawn one under the other from (x, y) with a gap */
  const lines = (x, y, ws, gap, c) => p(ws.map((w, i) => "M" + x + " " + (y + i * gap) + "h" + w).join(""), c || "s");

  const chrome = r(0.5, 0.5, 159, 89, "f", 5) + p("M.5 7H159.5", "s") + o(4.5, 3.7, 0.9, "s") + o(8, 3.7, 0.9, "s") + o(11.5, 3.7, 0.9, "s") + r(20, 1.7, 90, 3.6, "s", 1.8);

  const T = {
    /* sidebar app: nav on the left, stat cards and a table */
    app: () => chrome + p("M33 7V89", "s") + r(6, 12, 18, 2, "k", 1) + lines(6, 21, [22, 18, 24, 16, 20], 7) + o(8, 82, 2.4, "f") + lines(13, 82, [14], 0) +
      r(38, 12, 26, 2.4, "k", 1.2) + [0, 1, 2, 3].map(i => r(38 + i * 30.5, 18, 27.5, 16, "f", 2) + r(41 + i * 30.5, 21, 10, 2, "k", 1) + lines(41 + i * 30.5, 28, [18], 0)).join("") +
      [0, 1, 2, 3, 4, 5].map(i => p("M38 " + (42 + i * 7.8) + "H155", "s") + o(41.5, 46 + i * 7.8, 1.6, "f") + lines(46, 46 + i * 7.8, [20 + (i * 7) % 18], 0) + lines(100, 46 + i * 7.8, [14 + (i * 5) % 10], 0)).join(""),
    /* dashboard: top nav, three chart cards, wide list */
    dash: () => chrome + r(6, 11, 14, 2.4, "k", 1.2) + [[26, 12], [42, 10], [56, 10], [70, 14]].map(a => r(a[0], 10.7, a[1], 3, "s", 1.5)).join("") +
      r(6, 18, 46, 30, "f", 3) + [0, 1, 2, 3, 4, 5, 6].map(i => r(10 + i * 5.6, 44 - [8, 14, 10, 20, 16, 22, 12][i], 3.6, [8, 14, 10, 20, 16, 22, 12][i], i === 5 ? "k" : "s", 0.6)).join("") +
      r(57, 18, 46, 30, "f", 3) + p("M61 42 71 34 78 38 88 26 99 30", "l") + o(88, 26, 1.4, "k") +
      r(108, 18, 46, 30, "f", 3) + o(131, 33, 11, "s") + p("M131 22A11 11 0 0 1 142 33", "l") + r(6, 53, 148, 31, "f", 3) +
      [0, 1, 2, 3].map(i => o(12, 59 + i * 7, 1.8, i === 0 ? "k" : "s") + lines(17, 59 + i * 7, [38 + (i * 13) % 30], 0) + lines(120, 59 + i * 7, [24], 0)).join(""),
    /* list view: filter bar and rows with avatars and tags */
    list: () => chrome + r(6, 11, 60, 5, "s", 2.5) + r(120, 11, 34, 5, "k", 2.5) + p("M6 20H154", "s") +
      [0, 1, 2, 3, 4, 5, 6, 7].map(i => o(10, 26 + i * 8.2, 2.6, i === 0 ? "k" : "f") + lines(16, 25 + i * 8.2, [42 + (i * 11) % 36], 0) + lines(16, 28 + i * 8.2, [26 + (i * 7) % 20], 0) + r(128, 24 + i * 8.2, 22, 4, i % 3 === 0 ? "k" : "s", 2)).join(""),
    /* documentation: nav, article with code block, table of contents */
    docs: () => chrome + p("M38 7V89M124 7V89", "s") + r(6, 12, 16, 2, "k", 1) + lines(6, 20, [24, 20, 26, 18, 22, 16], 6.5) +
      r(44, 12, 50, 3.4, "k", 1.2) + lines(44, 22, [74, 70, 76, 40], 4.4) + r(44, 42, 74, 16, "f", 2) + lines(48, 47, [30, 44, 24], 4) + lines(44, 64, [72, 76, 60, 70, 46], 4.4) +
      r(130, 12, 14, 2, "k", 1) + lines(130, 20, [18, 22, 16, 20], 6),
    /* code host: tab bar, file tree, numbered source */
    code: () => chrome + r(6, 10, 26, 6, "f", 1.5) + r(34, 10, 22, 6, "s", 1.5) + p("M40 7V89", "s") + [0, 1, 2, 3, 4, 5, 6].map(i => r(6 + (i % 3 === 1 ? 5 : 0), 21 + i * 8, 3, 3, i === 0 ? "k" : "s", 0.6) + lines(12 + (i % 3 === 1 ? 5 : 0), 22.5 + i * 8, [14 + (i * 5) % 12], 0)).join("") +
      [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => lines(46, 21 + i * 7, [2], 0) + lines(54 + (i % 4 === 1 || i % 4 === 2 ? 6 : 0), 21 + i * 7, [30 + (i * 17) % 50], 0, i % 3 === 0 ? "l" : "s")).join(""),
    /* mail: folders, message list, reading pane */
    mail: () => chrome + p("M30 7V89M80 7V89", "s") + r(5, 12, 20, 5, "k", 2) + lines(6, 25, [18, 14, 16, 12], 7) +
      [0, 1, 2, 3, 4, 5].map(i => o(36, 16 + i * 12.5, 1.5, i === 1 ? "k" : "s") + lines(41, 15 + i * 12.5, [26 + (i * 9) % 14], 0) + lines(41, 19 + i * 12.5, [32 - (i * 5) % 10], 0) + p("M33 " + (22.5 + i * 12.5) + "H77", "s")).join("") +
      r(86, 12, 40, 3, "k", 1.2) + o(88, 25, 3, "f") + lines(94, 24, [24], 0) + lines(94, 28, [16], 0) + lines(86, 38, [66, 70, 62, 68, 40], 5.4),
    /* social feed: centre column of cards between two rails */
    feed: () => chrome + lines(8, 14, [20, 16, 22, 14, 18], 8) + lines(132, 14, [20, 24, 18], 8) +
      [0, 1].map(i => r(40, 11 + i * 40, 80, 36, "f", 3) + o(47, 18 + i * 40, 3.4, i === 0 ? "k" : "s") + lines(54, 16.5 + i * 40, [26], 0) + lines(54, 20.5 + i * 40, [16], 0) + r(44, 25 + i * 40, 72, 18, "s", 2)).join(""),
    /* kanban board: four columns of cards */
    board: () => chrome + [0, 1, 2, 3].map(i => r(5 + i * 38, 11, 35, 73, "f", 3) + r(9 + i * 38, 15, 14, 2.4, i === 1 ? "k" : "s", 1.2) +
      [0, 1, 2].slice(0, 3 - (i % 2)).map(j => r(9 + i * 38, 22 + j * 20, 27, 16, "s", 2) + lines(12 + i * 38, 27 + j * 20, [20 - (j * 4)], 0) + lines(12 + i * 38, 32 + j * 20, [14], 0)).join("")).join("")
  };

  const IDS = Object.keys(T);
  const NAMES = { app: "Sidebar app", dash: "Dashboard", list: "List view", docs: "Documentation", code: "Code host", mail: "Mail", feed: "Feed", board: "Board" };
  const api = {
    IDS: IDS, NAMES: NAMES,
    inner: id => (T[id] || T.app)(),
    svg: id => '<svg class="wf" viewBox="0 0 160 90" aria-hidden="true">' + (T[id] || T.app)() + "</svg>"
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Wireframes = api;
})(typeof window !== "undefined" ? window : globalThis);
