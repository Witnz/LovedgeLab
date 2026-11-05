/* Turns the favourites bar into category tiles. Pure; takes the chrome.bookmarks tree. */
(function (root) {
  const ACCENTS = ["blue", "red", "magenta", "green", "cyan", "orange", "yellow", "teal"];
  const GLYPH_BY_NAME = { mail: "mail", email: "mail", code: "code", dev: "code", development: "code", books: "book", reading: "book", learning: "cap", school: "cap",
    tools: "wrench", utilities: "wrench", games: "gamepad", music: "music", video: "film", videos: "film", media: "film", photos: "camera", cloud: "cloud",
    security: "shield", news: "globe", home: "home", shopping: "package", terminal: "terminal", cli: "terminal" };

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }
  const safe = url => /^https?:\/\//i.test(url || "");
  function link(n) {
    if (!safe(n.url)) return null;
    const host = hostOf(n.url);
    return { title: (n.title || "").trim() || host, url: n.url, host: host };
  }
  function findBar(tree) {
    const top = (tree && tree[0] && tree[0].children) || [];
    return top.find(c => /fav(ou)?rites bar|bookmarks bar/i.test(c.title || "")) || top.find(c => c.children) || null;
  }
  function collect(node, path, groups) {
    const direct = [];
    for (const ch of node.children || []) {
      if (ch.children) collect(ch, path ? path + " / " + ch.title : ch.title, groups);
      else { const l = link(ch); if (l) direct.push(l); }
    }
    if (direct.length) groups.push({ title: path, links: direct });
  }

  /* categories: [{ id, name, count, groups, accent, icon }]; loose links on the bar are ignored */
  function group(tree, categories) {
    const bar = findBar(tree), cats = [], ov = categories || {};
    let i = 0;
    for (const ch of (bar && bar.children) || []) {
      if (!ch.children) continue;
      const groups = [];
      collect(ch, "", groups);
      groups.sort((a, b) => (a.title === "" ? -1 : b.title === "" ? 1 : 0));
      const count = groups.reduce((s, g) => s + g.links.length, 0);
      if (!count) continue;
      const o = ov[ch.title] || {};
      if (o.hidden) continue;
      cats.push({ id: "c" + i, name: ch.title, count: count, groups: groups,
        accent: o.accent || ACCENTS[i % ACCENTS.length],
        icon: o.icon || GLYPH_BY_NAME[ch.title.toLowerCase().replace(/[^a-z]/g, "")] || "folder" });
      i++;
    }
    return cats;
  }

  /* every folder name on the bar, hidden ones included (for the options page) */
  function folderNames(tree) {
    const bar = findBar(tree);
    return ((bar && bar.children) || []).filter(c => c.children).map(c => c.title);
  }

  function hash(cats) {
    const str = JSON.stringify(cats.map(c => [c.name, c.count, c.accent, c.icon, c.groups.map(g => g.links.map(l => l.url).join(" ")).join("|")]));
    let h = 5381;
    for (let k = 0; k < str.length; k++) h = ((h << 5) + h + str.charCodeAt(k)) | 0;
    return (h >>> 0).toString(36);
  }

  const api = { group: group, folderNames: folderNames, hash: hash, hostOf: hostOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Bookmarks = api;
})(typeof window !== "undefined" ? window : globalThis);
