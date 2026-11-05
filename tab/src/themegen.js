/* Builds a matching browser-theme package from the current palette: manifest + a tiny stored (uncompressed) zip writer. */
(function (root) {
  const P = root.Palette || (typeof require === "function" ? require("./palette.js") : null);

  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  function manifest(p, name) {
    return {
      manifest_version: 3,
      name: name || "LovedgeLab Theme",
      version: "1.0.0",
      description: "Browser colours matching your LovedgeLab start page.",
      theme: {
        colors: {
          frame: rgb(p.bgDark), frame_inactive: rgb(p.bg), toolbar: rgb(p.bg),
          tab_text: rgb(p.fg), tab_background_text: rgb(p.fgDark), bookmark_text: rgb(p.fg), toolbar_button_icon: rgb(p.fgDark),
          omnibox_background: rgb(p.bgDark), omnibox_text: rgb(p.fg), toolbar_field_border: rgb(P.mix(p.fgDark, p.bg, 0.28)),
          ntp_background: rgb(p.bg), ntp_text: rgb(p.fg), button_background: rgb(p.surf)
        }
      }
    };
  }

  let table = null;
  function crc32(buf) {
    if (!table) { table = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; } }
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  const utf8 = s => typeof TextEncoder !== "undefined" ? new TextEncoder().encode(s) : Uint8Array.from(Buffer.from(s, "utf8"));

  /* entries: [{ name, data: string | Uint8Array }] */
  function zip(entries) {
    const parts = [], central = [];
    let offset = 0;
    const u16 = v => [v & 255, (v >> 8) & 255], u32 = v => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
    for (const e of entries) {
      const name = utf8(e.name), data = typeof e.data === "string" ? utf8(e.data) : e.data, crc = crc32(data);
      const head = [0x50, 0x4b, 3, 4, 20, 0, 0, 8, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), 0, 0];
      parts.push(Uint8Array.from(head), name, data);
      central.push(Uint8Array.from([0x50, 0x4b, 1, 2, 20, 0, 20, 0, 0, 8, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(data.length), ...u32(data.length),
        ...u16(name.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(offset)]), name);
      offset += head.length + name.length + data.length;
    }
    const cdSize = central.reduce((s, a) => s + a.length, 0);
    const end = Uint8Array.from([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(entries.length), ...u16(entries.length), ...u32(cdSize), ...u32(offset), 0, 0]);
    const all = parts.concat(central, [end]);
    const out = new Uint8Array(all.reduce((s, a) => s + a.length, 0));
    let at = 0;
    for (const a of all) { out.set(a, at); at += a.length; }
    return out;
  }

  function themeZip(p, name) {
    return zip([{ name: "manifest.json", data: JSON.stringify(manifest(p, name), null, 2) }]);
  }

  const api = { manifest: manifest, crc32: crc32, zip: zip, themeZip: themeZip };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ThemeGen = api;
})(typeof window !== "undefined" ? window : globalThis);
