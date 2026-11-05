(function (root) {
  function esc(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const q = /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/.source;
  const words = s => new Set(s.split(" "));
  const JSK = words("const let var function return if else for while do switch case break continue new class extends import export from default async await try catch finally throw typeof instanceof in of this super static get set yield void delete interface type enum implements public private readonly as");
  const SHK = words("if then else elif fi for while do done case esac in function return exit break continue local export set unset echo cd read source alias");
  const PSK = words("if else elseif foreach for while do switch function param begin process end return break continue try catch finally throw in class using exit");
  const PYK = words("def class return if elif else for while in not and or is import from as with try except finally raise pass break continue lambda yield async await global None self");
  const CONST = words("true false null undefined NaN Infinity True False None $true $false $null");

  /* Per family: comment pattern, extra string pattern, keywords, word pattern, extra tokens */
  const F = {
    js: { c: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/.source, s: q + "|`(?:\\\\.|[^`\\\\])*`?", k: JSK, w: "[A-Za-z_$][\\w$]*", json: true },
    sh: { c: /#.*/.source, s: q, k: SHK, w: "[A-Za-z_][\\w-]*", v: "\\$\\{?\\w+\\}?" },
    ps: { c: /#.*|<#[\s\S]*?(?:#>|$)/.source, s: q, k: PSK, w: "[A-Za-z_][\\w-]*", v: "\\$\\w+(?::\\w+)?", ps: true },
    py: { c: /#.*/.source, s: '"""[\\s\\S]*?(?:"""|$)|' + q, k: PYK, w: "[A-Za-z_]\\w*" },
    css: { c: /\/\*[\s\S]*?(?:\*\/|$)/.source, s: q, k: words("@media @import @font-face @keyframes"), w: "@?[A-Za-z_-][\\w-]*", hex: true, css: true },
    html: { c: /<!--[\s\S]*?(?:-->|$)/.source, s: q, k: words(""), w: "</?[A-Za-z][\\w:-]*|[A-Za-z_:][\\w:.-]*", html: true },
    yaml: { c: /#.*/.source, s: q, k: words(""), w: "[A-Za-z_][\\w.-]*", yaml: true }
  };
  const ALIAS = { js: "js", javascript: "js", ts: "js", typescript: "js", jsx: "js", tsx: "js", json: "js", jsonc: "js",
    sh: "sh", bash: "sh", shell: "sh", zsh: "sh", ps: "ps", ps1: "ps", powershell: "ps", pwsh: "ps",
    py: "py", python: "py", css: "css", html: "html", xml: "html", svg: "html", yaml: "yaml", yml: "yaml" };
  const cache = {}, LA = /\s*(.?)/y;

  function build(f) {
    const parts = [f.c, f.s, f.hex ? "#[0-9a-fA-F]{3,8}\\b|\\b\\d[\\w.]*" : "\\b\\d[\\w.]*", f.v || "(?!)", f.w, "[{}()\\[\\];,.]|[=+*/%<>!&|^~?:\\-]+"];
    return new RegExp(parts.map(p => "(" + p + ")").join("|"), "g");
  }
  const span = (c, t) => '<span class="' + c + '">' + esc(t) + "</span>";

  function code(lang, text) {
    const key = ALIAS[String(lang || "").toLowerCase()];
    if (!key) return null;
    const f = F[key], re = cache[key] || (cache[key] = build(f));
    re.lastIndex = 0;
    text = String(text);
    let out = "", last = 0, m;
    while ((m = re.exec(text))) {
      if (m[0] === "") { re.lastIndex++; continue; }
      out += esc(text.slice(last, m.index));
      last = re.lastIndex;
      const t = m[0], next = text.slice(last).match(/^\s*(.?)/)[1];
      let c;
      if (m[1]) c = "c";
      else if (m[2]) c = f.json && next === ":" ? "p" : "s";
      else if (m[3]) c = "n";
      else if (m[4]) c = "v";
      else if (m[5]) {
        if (f.html && t[0] === "<") c = "t";
        else if (f.html && next === "=") c = "a";
        else if (CONST.has(t)) c = "n";
        else if (f.k.has(t)) c = "k";
        else if (f.css && next === ":") c = "p";
        else if (f.yaml && next === ":") c = "p";
        else if (f.ps && /^[A-Z][a-z]+-[A-Z]/.test(t)) c = "f";
        else if (next === "(") c = "f";
        else c = "";
      } else c = /^[{}()\[\];,.]$/.test(t) ? "u" : "o";
      out += c ? span(c, t) : esc(t);
    }
    return out + esc(text.slice(last));
  }

  const api = { code: code };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Highlight = api;
})(typeof window !== "undefined" ? window : globalThis);
