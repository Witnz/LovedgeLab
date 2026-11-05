(function (root) {
  const hl = root.Highlight || (typeof require === "function" ? require("./hl.js") : null);
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Inline markup on already-escaped text. Code spans are lifted out first so their content stays literal.
  function inline(raw) {
    const codes = [];
    let s = esc(raw).replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return "\u0000" + (codes.length - 1) + "\u0000"; });
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^\w])_([^_\s][^_]*?)_(?![\w])/g, "$1<em>$2</em>");
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => "<code>" + codes[+i] + "</code>");
  }

  const SPECIAL = /^(#{1,3}\s|>|```|\s*([-*+]|\d+\.)\s|(-{3,}|\*{3,})\s*$)/;

  function render(text) {
    if (text == null || !String(text).trim()) return "";
    const lines = String(text).split("\n");
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      let m;
      if (/^```/.test(line)) {
        const buf = [], lang = line.slice(3).trim().split(/\s/)[0].replace(/[^\w-]/g, "");
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        const src = buf.join("\n"), hi = hl && lang ? hl.code(lang, src) : null;
        out.push(hi == null ? "<pre><code>" + esc(src) + "</code></pre>" : '<pre><code class="lang-' + lang + '">' + hi + "</code></pre>");
      } else if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) {
        const n = m[1].length;
        out.push("<h" + n + ">" + inline(m[2]) + "</h" + n + ">");
        i++;
      } else if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
        out.push("<hr>");
        i++;
      } else if (/^>/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>/.test(lines[i])) buf.push(inline(lines[i++].replace(/^>\s?/, "")));
        out.push("<blockquote>" + buf.join("<br>") + "</blockquote>");
      } else if ((m = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(line))) {
        const ordered = /\d/.test(m[2]);
        const tag = ordered ? "ol" : "ul";
        const items = [];
        while (i < lines.length && (m = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(lines[i])) && /\d/.test(m[2]) === ordered) {
          const t = /^\[( |x|X)\]\s+(.*)$/.exec(m[3]);
          const ind = m[1].length >= 2 ? ' class="in"' : "";
          if (t) {
            items.push("<li" + (ind ? ' class="task in"' : ' class="task"') + '><input type="checkbox" data-l="' + i + '"' +
              (t[1] === " " ? "" : " checked") + "><span>" + inline(t[2]) + "</span></li>");
          } else items.push("<li" + ind + ">" + inline(m[3]) + "</li>");
          i++;
        }
        out.push("<" + tag + ">" + items.join("") + "</" + tag + ">");
      } else if (!line.trim()) {
        i++;
      } else {
        const buf = [];
        while (i < lines.length && lines[i].trim() && (buf.length === 0 || !SPECIAL.test(lines[i]))) buf.push(inline(lines[i++]));
        out.push("<p>" + buf.join("<br>") + "</p>");
      }
    }
    return out.join("");
  }

  function toggleTask(text, line) {
    const lines = String(text).split("\n");
    if (!(line >= 0 && line < lines.length)) return text;
    lines[line] = lines[line].replace(/^(\s*(?:[-*+]|\d+\.)\s+)\[( |x|X)\]/, (m, pre, st) => pre + (st === " " ? "[x]" : "[ ]"));
    return lines.join("\n");
  }

  const api = { render: render, toggleTask: toggleTask };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Markdown = api;
})(typeof window !== "undefined" ? window : globalThis);
