performance.mark("script-start");
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var catsEl = $("cats"), dailyEl = $("daily"), notesEl = $("notes"), viewEl = $("view");
  var store = Store.browserStore();
  var state = { settings: Settings.merge(undefined), media: { wf: {}, ic: {}, cat: {} }, cats: [], width: 1100, cols: 8, notesDirty: false };

  if (/[?&]embed\b/.test(location.search)) root.classList.add("embed");
  document.body.insertAdjacentHTML("afterbegin", Glyphs.sprite());

  /* ---- appearance: palette to custom properties, effects, header ---- */
  function applyAppearance(s) {
    var vars = Palette.vars(Palette.resolve(s.appearance.preset, s.appearance.colors));
    Object.keys(vars).forEach(function (k) { if (k !== "--scheme") root.style.setProperty(k, vars[k]); });
    root.style.colorScheme = vars["--scheme"];
    root.dataset.effects = s.appearance.effects;
    var hello = $("hello");
    hello.hidden = !s.behaviour.clock;
    if (s.behaviour.clock) tick();
  }
  function tick() {
    var d = new Date(), h = d.getHours();
    $("greet").textContent = h < 5 ? "Still up?" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    $("clock").textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  setInterval(function () { if (state.settings.behaviour.clock && document.visibilityState === "visible") tick(); }, 20000);

  function setCatCols() {
    state.cols = Layout.fitColumns(state.cats.length, state.width, 110, 12, state.settings.layout.maxCatsPerRow);
    catsEl.style.setProperty("--cols", state.cols);
  }
  function catById(id) { return state.cats.filter(function (c) { return c.id === id || c.name === id; })[0]; }

  /* Expand or collapse one tile in place; links are built on first expand. */
  var openEl = null;
  function toggle(el) {
    if (!el) return;
    var was = el.classList.contains("open");
    if (openEl) { openEl.classList.remove("open"); openEl.setAttribute("aria-expanded", "false"); openEl.querySelector(".links").hidden = true; }
    openEl = null;
    if (was) return;
    var box = el.querySelector(".links");
    if (!box.firstChild) box.innerHTML = Popover.listHtml(catById(el.dataset.id), { favicons: state.settings.behaviour.favicons });
    box.hidden = false;
    el.classList.add("open");
    el.setAttribute("aria-expanded", "true");
    openEl = el;
  }

  function paintCats(cats) {
    state.cats = cats;
    setCatCols();
    openEl = null;
    catsEl.innerHTML = Render.catsHtml(cats, state.media);
    $("noCats").hidden = cats.length > 0;
  }
  function paintTiles() {
    var tiles = state.settings.tiles;
    dailyEl.innerHTML = Render.tilesHtml(tiles, state.media, { favicons: state.settings.behaviour.favicons });
    dailyEl.style.setProperty("--cols", Layout.dailyCols(tiles.length));
    $("noTiles").hidden = tiles.length > 0;
  }
  /* a favicon that fails to load falls back to the letter underneath */
  document.addEventListener("error", function (e) { if (e.target.tagName === "IMG" && e.target.closest(".tico, .fav")) e.target.remove(); }, true);

  /* Notepad shows rendered markdown until focused; empty notes go straight to the editor. */
  function showNotes() {
    if (document.activeElement === notesEl) return;
    var has = notesEl.value.trim() !== "";
    viewEl.hidden = !has;
    notesEl.hidden = has;
    if (has) viewEl.innerHTML = Markdown.render(notesEl.value);
  }
  function editNotes() {
    viewEl.hidden = true;
    notesEl.hidden = false;
    notesEl.focus();
    notesEl.setSelectionRange(notesEl.value.length, notesEl.value.length);
  }

  /* ---- 1. synchronous first paint from the cache ---- */
  var cache = Cache.read();
  if (cache && !(cache.settings && cache.media && cache.cats)) cache = null;
  if (cache) {
    state.settings = cache.settings;
    state.media = cache.media;
    state.width = cache.width || state.width;
    applyAppearance(state.settings);
    paintTiles();
    paintCats(cache.cats);
    if (typeof cache.notes === "string") notesEl.value = cache.notes;
  } else {
    applyAppearance(state.settings);
    paintTiles();
    paintCats([]);
  }
  showNotes();
  performance.mark("cache-painted");

  /* ---- 2. async reconcile against stored settings and live bookmarks ---- */
  function getTree() {
    try { return chrome.bookmarks.getTree().catch(function () { return []; }); } catch (e) { return Promise.resolve([]); }
  }
  function adopt(loaded, cats) {
    var sh = Settings.hash([loaded.settings, loaded.media]), bh = Bookmarks.hash(cats);
    if (cache && cache.sh === sh && cache.bh === bh) return;
    state.settings = loaded.settings;
    state.media = loaded.media;
    applyAppearance(state.settings);
    paintTiles();
    paintCats(cats);
    cache = { sh: sh, bh: bh, width: state.width, settings: state.settings, media: state.media, cats: cats, notes: notesEl.value };
    Cache.write(cache);
  }
  function reconcile(live) {
    return Promise.all([store.load(), getTree()]).then(function (r) {
      adopt(r[0], Bookmarks.group(r[1], r[0].settings.categories));
      performance.mark("reconcile-done");
      if (live) return;
      return chrome.storage.local.get("notes").then(function (n) {
        if (!state.notesDirty && typeof n.notes === "string" && n.notes !== notesEl.value) {
          notesEl.value = n.notes;
          Cache.patch({ notes: n.notes });
          showNotes();
        }
      });
    }).catch(function (e) { console.error("LovedgeLab reconcile failed", e); }).then(showPerf);
  }
  reconcile();

  /* ---- live updates: bookmark changes, settings changes (from the options page or another device), previews ---- */
  var liveTimer = 0, stale = false;
  function liveRefresh() {
    clearTimeout(liveTimer);
    if (document.visibilityState === "hidden") { stale = true; return; }
    liveTimer = setTimeout(function () { stale = false; reconcile(true); }, 150);
  }
  try {
    var B = chrome.bookmarks;
    [B.onCreated, B.onRemoved, B.onChanged, B.onMoved, B.onChildrenReordered, B.onImportEnded].forEach(function (e) { if (e) e.addListener(liveRefresh); });
  } catch (e) { /* bookmarks API unavailable: static until next tab */ }
  try {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== "sync" && area !== "local") return;
      if (Object.keys(changes).some(function (k) { return /^(cfg|wf|ic|cc)\./.test(k); })) liveRefresh();
    });
  } catch (e) { /* storage events unavailable */ }
  document.addEventListener("visibilitychange", function () { if (stale && document.visibilityState === "visible") liveRefresh(); });
  /* the options page streams unsaved changes here so its preview is instant */
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || e.data.lovedge !== "preview") return;
    var clean = Store.unpack(Store.pack(Settings.merge(e.data.settings), e.data.media || {}));
    getTree().then(function (tree) { adopt(clean, Bookmarks.group(tree, clean.settings.categories)); });
  });

  /* ---- resize: recompute columns from ResizeObserver, never from layout reads ---- */
  if (window.ResizeObserver) {
    new ResizeObserver(function (entries) {
      var w = Math.round(entries[0].contentRect.width);
      if (w && Math.abs(w - state.width) > 4) {
        state.width = w;
        setCatCols();
        Cache.patch({ width: w });
      }
    }).observe(catsEl);
  }

  /* ---- links: optionally open in a new tab ---- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a.lr, a.t");
    if (a && state.settings.behaviour.newTab && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) { e.preventDefault(); chrome.tabs.create({ url: a.href }); }
  });
  /* ---- category expand ---- */
  catsEl.addEventListener("click", function (e) {
    if (e.target.closest(".links")) return;
    toggle(e.target.closest(".cat"));
  });
  catsEl.addEventListener("keydown", function (e) {
    if (e.target.classList.contains("cat") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(e.target); }
    else if (e.key === "Escape" && openEl) { var el = openEl; toggle(el); el.focus(); }
  });

  $("gear").addEventListener("click", function () { chrome.runtime.openOptionsPage(); });

  /* ---- notepad (local to this device) ---- */
  var saveTimer = 0, savedPill = $("saved");
  function saveNotes() {
    clearTimeout(saveTimer);
    if (!state.notesDirty) return;
    state.notesDirty = false;
    var v = notesEl.value;
    Cache.patch({ notes: v });
    chrome.storage.local.set({ notes: v }).then(function () {
      savedPill.classList.add("on");
      setTimeout(function () { savedPill.classList.remove("on"); }, 1200);
    });
  }
  notesEl.addEventListener("blur", function () { saveNotes(); showNotes(); });
  notesEl.addEventListener("keydown", function (e) { if (e.key === "Escape") notesEl.blur(); });
  viewEl.addEventListener("click", function (e) {
    if (e.target.closest("a")) return;
    var box = e.target.closest("input[type=checkbox]");
    if (box) {
      notesEl.value = Markdown.toggleTask(notesEl.value, +box.dataset.l);
      state.notesDirty = true;
      saveNotes();
      showNotes();
      return;
    }
    editNotes();
  });
  viewEl.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); editNotes(); } });
  notesEl.addEventListener("input", function () {
    state.notesDirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNotes, 400);
  });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") saveNotes(); });
  addEventListener("pagehide", saveNotes);

  /* ---- ?perf badge ---- */
  function showPerf() {
    if (!/[?&]perf\b/.test(location.search)) return;
    var out = [];
    performance.getEntriesByType("paint").forEach(function (p) { out.push(p.name + " " + p.startTime.toFixed(0) + "ms"); });
    performance.getEntriesByType("mark").forEach(function (m) { out.push(m.name + " " + m.startTime.toFixed(0) + "ms"); });
    var b = $("perf"); b.textContent = out.join("\n"); b.hidden = false;
  }
})();
