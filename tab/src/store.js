/* Persistence over chrome.storage.sync (falls back to local). The settings JSON is split across 6000-char
 * chunks because one sync item holds 8192 bytes; media (custom wireframes, icons) gets one item each. */
(function (root) {
  const S = root.Settings || (typeof require === "function" ? require("./settings.js") : null);
  const M = root.Media || (typeof require === "function" ? require("./media.js") : null);
  const CHUNK = 6000;
  const QUOTA = 102400;      /* bytes in total across storage.sync */
  const MAX_ITEMS = 512;

  /* keys: cfg.n = chunk count, cfg.0.. = chunks, wf.<tileId> = svg, ic.<tileId> = icon, cc.<hash> = category icon */
  const catKey = name => "cc." + S.hash(String(name));
  const isStoreKey = k => /^(cfg\.|wf\.|ic\.|cc\.)/.test(k);

  function pack(settings, media) {
    const json = JSON.stringify(settings), items = {};
    const n = Math.max(1, Math.ceil(json.length / CHUNK));
    items["cfg.n"] = n;
    for (let i = 0; i < n; i++) items["cfg." + i] = json.slice(i * CHUNK, (i + 1) * CHUNK);
    const tiles = {};
    settings.tiles.forEach(t => { tiles[t.id] = t; });
    for (const id of Object.keys(media.wf || {})) if (tiles[id] && tiles[id].wf === "custom" && M.sanitizeSvg(media.wf[id]).ok) items["wf." + id] = media.wf[id];
    for (const id of Object.keys(media.ic || {})) if (tiles[id] && tiles[id].icon === "img" && M.iconOk(media.ic[id])) items["ic." + id] = media.ic[id];
    for (const name of Object.keys(media.cat || {})) {
      const o = settings.categories[name];
      if (o && o.icon === "img" && M.iconOk(media.cat[name])) items[catKey(name)] = media.cat[name];
    }
    return items;
  }

  function unpack(all) {
    let settings = null;
    const n = all && all["cfg.n"];
    if (Number.isInteger(n) && n > 0 && n < 100) {
      let json = "";
      for (let i = 0; i < n; i++) json += typeof all["cfg." + i] === "string" ? all["cfg." + i] : "";
      try { settings = JSON.parse(json); } catch (e) { settings = null; }
    }
    settings = S.merge(settings);
    const media = { wf: {}, ic: {}, cat: {} };
    for (const t of settings.tiles) {
      if (t.wf === "custom" && typeof all["wf." + t.id] === "string") { const r = M.sanitizeSvg(all["wf." + t.id]); if (r.ok) media.wf[t.id] = r.svg; }
      if (t.icon === "img" && M.iconOk(all["ic." + t.id])) media.ic[t.id] = all["ic." + t.id];
    }
    for (const name of Object.keys(settings.categories)) if (settings.categories[name].icon === "img" && M.iconOk(all[catKey(name)])) media.cat[name] = all[catKey(name)];
    return { settings: settings, media: media };
  }

  const bytes = items => Object.keys(items).reduce((s, k) => s + k.length + JSON.stringify(items[k]).length, 0);

  function make(area) {
    return {
      load: async () => unpack(await area.get(null)),
      /* writes the new items, then removes keys that are no longer used */
      save: async function (settings, media) {
        const items = pack(settings, media);
        if (Object.keys(items).length > MAX_ITEMS) throw new Error("Too many items for sync storage.");
        const total = bytes(items);
        if (total > QUOTA) throw new Error("Over the sync storage limit (" + total + " of " + QUOTA + " bytes). Remove a custom image.");
        const all = await area.get(null);
        const stale = Object.keys(all).filter(k => isStoreKey(k) && !(k in items));
        await area.set(items);
        if (stale.length) await area.remove(stale);
        return total;
      },
      usage: async () => {
        const all = await area.get(null);
        return bytes(Object.keys(all).filter(isStoreKey).reduce((o, k) => (o[k] = all[k], o), {}));
      }
    };
  }

  /* browser: prefer sync, fall back to local when sync is unavailable or errors */
  function browserStore() {
    const sync = chrome.storage.sync, local = chrome.storage.local;
    const s = make(sync), l = make(local);
    return {
      load: async () => { try { return await s.load(); } catch (e) { return l.load(); } },
      save: async (a, b) => { try { return await s.save(a, b); } catch (err) { if (/limit|Too many/.test(err.message)) throw err; return l.save(a, b); } },
      usage: async () => { try { return await s.usage(); } catch (e) { return 0; } },
      QUOTA: QUOTA
    };
  }

  const api = { make: make, pack: pack, unpack: unpack, browserStore: browserStore, catKey: catKey, QUOTA: QUOTA, CHUNK: CHUNK };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Store = api;
})(typeof window !== "undefined" ? window : globalThis);
