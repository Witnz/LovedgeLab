(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var store = Store.browserStore();
  var s = Settings.merge(undefined), m = { wf: {}, ic: {}, cat: {} };
  var saveTimer = 0, statusTimer = 0, folders = [];

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function opts(list, cur, label) {
    return list.map(function (v) { return '<option value="' + esc(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(label ? label(v) : v) + "</option>"; }).join("");
  }
  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }
  function palette() { return Palette.resolve(s.appearance.preset, s.appearance.colors); }

  function status(msg, bad) {
    var el = $("status");
    el.textContent = msg;
    el.className = bad ? "err" : "";
    clearTimeout(statusTimer);
    if (!bad) statusTimer = setTimeout(function () { el.textContent = ""; }, 2500);
  }

  /* ---- apply: theme this page, feed the preview, schedule a save ---- */
  function paintPage() {
    var vars = Palette.vars(palette());
    Object.keys(vars).forEach(function (k) { if (k !== "--scheme") root.style.setProperty(k, vars[k]); });
    root.style.colorScheme = vars["--scheme"];
    var w = Palette.warnings(palette());
    $("warnings").hidden = !w.length;
    $("warnings").innerHTML = w.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  }
  function preview() {
    var f = $("preview");
    if (f.contentWindow) f.contentWindow.postMessage({ lovedge: "preview", settings: s, media: m }, location.origin);
  }
  function changed(now) {
    paintPage();
    preview();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, now ? 0 : 400);
  }
  function persist() {
    return store.save(s, m).then(function (bytes) { status("Saved"); meter(bytes); })
      .catch(function (e) { status(e.message || "Could not save.", true); });
  }
  function meter(bytes) {
    var q = store.QUOTA, pct = Math.min(100, Math.round(bytes / q * 100));
    $("meterFill").style.width = pct + "%";
    $("meterText").textContent = "Using " + (bytes / 1024).toFixed(1) + " KB of " + Math.round(q / 1024) + " KB sync storage (" + pct + "%).";
  }

  /* ---- colours ---- */
  function renderPresets() {
    $("presets").innerHTML = Object.keys(Palette.PRESETS).map(function (k) {
      var p = Palette.PRESETS[k];
      return '<button type="button" class="preset" role="radio" data-p="' + k + '" aria-checked="' + (s.appearance.preset === k) + '">' +
        '<span class="dots" style="background:' + p.bg + '">' + ["blue", "magenta", "cyan", "green", "orange", "red"].map(function (a) { return '<i style="background:' + p[a] + '"></i>'; }).join("") + "</span>" +
        "<span>" + esc(p.name) + "</span></button>";
    }).join("");
  }
  function renderSwatches() {
    var p = palette(), c = s.appearance.colors;
    $("swatches").innerHTML = Palette.TOKENS.map(function (t) {
      return '<label class="swatch"><input type="color" data-t="' + t + '" value="' + p[t] + '" aria-label="' + esc(Palette.LABELS[t]) + '"><span>' + esc(Palette.LABELS[t]) + "</span>" +
        '<button type="button" class="reset" data-r="' + t + '" title="Reset to the base value"' + (c[t] ? "" : " hidden") + ">reset</button></label>";
    }).join("");
  }
  $("presets").addEventListener("click", function (e) {
    var b = e.target.closest(".preset"); if (!b) return;
    s.appearance.preset = b.dataset.p; s.appearance.colors = {};
    renderPresets(); renderSwatches(); changed(true);
  });
  $("swatches").addEventListener("input", function (e) {
    var t = e.target.dataset.t; if (!t) return;
    s.appearance.colors[t] = e.target.value;
    e.target.parentNode.querySelector(".reset").hidden = false;
    changed();
  });
  $("swatches").addEventListener("click", function (e) {
    var b = e.target.closest(".reset"); if (!b) return;
    delete s.appearance.colors[b.dataset.r];
    renderSwatches(); changed(true);
  });
  $("shuffle").addEventListener("click", function () {
    var out = Palette.shuffleAccents(palette(), Date.now());
    Palette.ACCENT.forEach(function (a) { s.appearance.colors[a] = out[a]; });
    renderSwatches(); changed(true);
  });
  $("resetColors").addEventListener("click", function () { s.appearance.colors = {}; renderSwatches(); changed(true); });
  $("effects").addEventListener("change", function (e) { s.appearance.effects = e.target.value; changed(); });

  /* ---- quick sites ---- */
  function tileRow(t, i, n) {
    var wfList = Wireframes.IDS.concat(["custom"]);
    return '<div class="site" data-id="' + esc(t.id) + '">' +
      '<div class="srow"><span class="dot" style="background:var(--' + t.accent + ')"></span>' +
      '<input type="text" class="grow" data-a="label" value="' + esc(t.label) + '" maxlength="' + Settings.LIMITS.label + '" aria-label="Name">' +
      '<input type="url" class="url" data-a="url" value="' + esc(t.url) + '" aria-label="Address">' +
      '<select data-a="accent" aria-label="Accent colour">' + opts(Palette.ACCENT, t.accent, cap) + "</select></div>" +
      '<div class="srow"><label>Sketch <select data-a="wf">' + opts(wfList, t.wf, function (v) { return v === "custom" ? "My SVG" : Wireframes.NAMES[v]; }) + "</select></label>" +
      (t.wf === "custom" ? '<label class="btn">' + (m.wf[t.id] ? "Replace SVG" : "Upload SVG") + '<input type="file" data-a="wffile" accept=".svg,image/svg+xml" hidden></label>' : "") +
      '<label>Icon <select data-a="icon">' + opts(["fav", "img", "none"], t.icon, function (v) { return { fav: "Site favicon", img: "My image", none: "None" }[v]; }) + "</select></label>" +
      (t.icon === "img" ? '<label class="btn">' + (m.ic[t.id] ? "Replace image" : "Upload image") + '<input type="file" data-a="icfile" accept="image/*" hidden></label>' : "") +
      '<span class="spacer"><button type="button" data-a="up" aria-label="Move up"' + (i === 0 ? " disabled" : "") + '>&uarr;</button>' +
      '<button type="button" data-a="down" aria-label="Move down"' + (i === n - 1 ? " disabled" : "") + '>&darr;</button>' +
      '<button type="button" data-a="del" aria-label="Remove">&#10005;</button></span></div>' +
      '<div class="serr" hidden></div></div>';
  }
  function renderSites() {
    $("siteList").innerHTML = s.tiles.map(function (t, i) { return tileRow(t, i, s.tiles.length); }).join("") || '<p class="hint">No sites yet.</p>';
    $("siteCount").textContent = s.tiles.length + " of " + Settings.LIMITS.tiles;
    $("addSite").disabled = s.tiles.length >= Settings.LIMITS.tiles;
  }
  function tileOf(el) { var id = el.closest(".site").dataset.id; return s.tiles.filter(function (t) { return t.id === id; })[0]; }
  function siteError(el, msg) {
    var box = el.closest(".site").querySelector(".serr");
    box.hidden = !msg; box.textContent = msg || "";
  }
  $("siteList").addEventListener("change", function (e) {
    var a = e.target.dataset.a, t = tileOf(e.target); if (!a || !t) return;
    siteError(e.target, "");
    if (a === "label") t.label = e.target.value.trim().slice(0, Settings.LIMITS.label) || t.label;
    else if (a === "url") {
      var u = Settings.cleanUrl(e.target.value.trim());
      e.target.classList.toggle("bad", !u);
      if (!u) return siteError(e.target, "Enter a full address starting with https://");
      t.url = u; e.target.value = u;
    } else if (a === "accent") { t.accent = e.target.value; e.target.closest(".site").querySelector(".dot").style.background = "var(--" + t.accent + ")"; }
    else if (a === "wf") { t.wf = e.target.value; renderSites(); }
    else if (a === "icon") { t.icon = e.target.value; renderSites(); }
    else if (a === "wffile") {
      var f = e.target.files[0]; e.target.value = "";
      if (!f) return;
      return f.text().then(function (txt) {
        var r = Media.sanitizeSvg(txt);
        if (!r.ok) return siteError(e.target, r.error);
        m.wf[t.id] = r.svg; renderSites(); changed(true);
      });
    } else if (a === "icfile") {
      var g = e.target.files[0]; e.target.value = "";
      if (!g) return;
      return Media.fitIcon(g).then(function (url) { m.ic[t.id] = url; renderSites(); changed(true); })
        .catch(function (err) { siteError(e.target, err.message); });
    }
    changed();
  });
  $("siteList").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-a]"); if (!b) return;
    var t = tileOf(b), i = s.tiles.indexOf(t), a = b.dataset.a;
    if (a === "del") { s.tiles.splice(i, 1); delete m.wf[t.id]; delete m.ic[t.id]; }
    else { var j = a === "up" ? i - 1 : i + 1; if (j < 0 || j >= s.tiles.length) return; s.tiles[i] = s.tiles[j]; s.tiles[j] = t; }
    renderSites(); changed(true);
  });
  $("addSite").addEventListener("click", function () {
    if (s.tiles.length >= Settings.LIMITS.tiles) return;
    var n = s.tiles.length;
    s.tiles.push({ id: Settings.newTileId(), label: "New site", url: "https://example.com/", accent: Palette.ACCENT[n % 8], wf: Wireframes.IDS[n % Wireframes.IDS.length], icon: "fav" });
    renderSites(); changed(true);
    var inputs = $("siteList").querySelectorAll('input[data-a="label"]');
    if (inputs.length) { inputs[inputs.length - 1].focus(); inputs[inputs.length - 1].select(); }
  });

  /* ---- categories ---- */
  function renderCats() {
    var names = folders.slice();
    Object.keys(s.categories).forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); });
    $("catList").innerHTML = names.length ? names.map(function (n) {
      var o = s.categories[n] || {};
      return '<div class="cat" data-n="' + esc(n) + '"><input type="checkbox" data-a="vis" aria-label="Show ' + esc(n) + '"' + (o.hidden ? "" : " checked") + ">" +
        '<span class="nm">' + esc(n) + "</span>" +
        '<select data-a="icon" aria-label="Icon">' + opts(["auto"].concat(Glyphs.names, ["img"]), o.icon || "auto", function (v) { return v === "auto" ? "auto glyph" : v === "img" ? "my image" : v; }) + "</select>" +
        (o.icon === "img" ? '<label class="btn">' + (m.cat[n] ? "Replace" : "Upload") + '<input type="file" data-a="file" accept="image/*" hidden></label>' : "<span></span>") +
        '<select data-a="acc" aria-label="Accent"><option value="">auto colour</option>' + opts(Palette.ACCENT, o.accent, cap) + "</select></div>";
    }).join("") : '<p class="hint">No folders on your favourites bar yet.</p>';
  }
  $("catList").addEventListener("change", function (e) {
    var row = e.target.closest(".cat"), a = e.target.dataset.a; if (!row || !a) return;
    var n = row.dataset.n, o = s.categories[n] = s.categories[n] || {};
    if (a === "vis") { if (e.target.checked) delete o.hidden; else o.hidden = true; }
    else if (a === "icon") { if (e.target.value === "auto") delete o.icon; else o.icon = e.target.value; renderCats(); }
    else if (a === "acc") { if (e.target.value) o.accent = e.target.value; else delete o.accent; }
    else if (a === "file") {
      var f = e.target.files[0]; e.target.value = "";
      if (!f) return;
      return Media.fitIcon(f).then(function (url) { m.cat[n] = url; renderCats(); changed(true); }).catch(function (err) { status(err.message, true); });
    }
    changed();
  });

  /* ---- display ---- */
  function bind(id, fn) { $(id).addEventListener("change", function (e) { fn(e.target); changed(); }); }
  bind("maxCats", function (t) { s.layout.maxCatsPerRow = Math.min(12, Math.max(2, +t.value || 8)); });
  bind("clock", function (t) { s.behaviour.clock = t.checked; });
  bind("newTab", function (t) { s.behaviour.newTab = t.checked; });
  bind("favicons", function (t) { s.behaviour.favicons = t.checked; });

  /* ---- browser theme, export, import, reset ---- */
  function download(name, type, data) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: type }));
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  $("themeZip").addEventListener("click", function () { download("lovedgelab-theme.zip", "application/zip", ThemeGen.themeZip(palette())); });
  $("export").addEventListener("click", function () { download("lovedgelab-settings.json", "application/json", JSON.stringify({ lovedgelab: 1, settings: s, media: m }, null, 2)); });
  $("import").addEventListener("change", function (e) {
    var f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return status("That file is too large.", true);
    f.text().then(function (t) {
      var d; try { d = JSON.parse(t); } catch (err) { throw new Error("That file is not valid JSON."); }
      if (!d || d.lovedgelab !== 1) throw new Error("That is not a LovedgeLab export.");
      var clean = Store.unpack(Store.pack(Settings.merge(d.settings), d.media || {}));
      s = clean.settings; m = clean.media; renderAll(); changed(true);
    }).catch(function (err) { status(err.message, true); });
  });
  $("reset").addEventListener("click", function () {
    if (!confirm("Reset all LovedgeLab settings, sites and images to the defaults?")) return;
    s = Settings.merge(undefined); m = { wf: {}, ic: {}, cat: {} }; renderAll(); changed(true);
  });

  function renderAll() {
    renderPresets(); renderSwatches(); renderSites(); renderCats();
    $("effects").value = s.appearance.effects;
    $("maxCats").value = s.layout.maxCatsPerRow;
    $("clock").checked = s.behaviour.clock;
    $("newTab").checked = s.behaviour.newTab;
    $("favicons").checked = s.behaviour.favicons;
    paintPage();
  }

  /* scale the preview iframe to its frame */
  var pf = document.querySelector(".pframe");
  if (window.ResizeObserver && pf) new ResizeObserver(function (en) { pf.style.setProperty("--k", (en[0].contentRect.width / 1440).toFixed(4)); }).observe(pf);
  $("preview").addEventListener("load", preview);

  /* ---- boot ---- */
  store.load().then(function (loaded) {
    s = loaded.settings; m = loaded.media; renderAll();
    return Promise.all([store.usage().then(meter), Promise.resolve().then(function () { try { return chrome.bookmarks.getTree(); } catch (e) { return []; } })]);
  }).then(function (r) {
    folders = Bookmarks.folderNames(r[1]);
    renderCats();
  }).catch(function (e) { status(e.message || "Could not load settings.", true); });
})();
