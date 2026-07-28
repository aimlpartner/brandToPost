/**
 * Sanitizer for model-generated visual-template HTML.
 *
 * Template `rawHtml` is produced by Gemini, and the grounding call that informs it
 * reads live web search results — so template markup is indirectly influenced by
 * third-party content and must be treated as untrusted. It reaches two dangerous
 * sinks:
 *
 *   1. `<iframe srcDoc>` previews in VisualTemplateLibrary / MasterFounder
 *   2. Puppeteer `page.setContent()` in POST /api/render-visual — server-side
 *      script execution inside our own network
 *
 * This is an ALLOWLIST sanitizer: unknown tags and attributes are removed rather
 * than matched against a list of known-bad strings. It is deliberately dependency
 * free and DOM free so the same module runs in the browser and inside the esbuild
 * CJS server bundle.
 *
 * Run it on the TEMPLATE, before placeholder substitution — that is where the
 * untrusted content is. Values substituted afterwards are ours, and go through
 * `escapeHtmlText` / `escapeHtmlAttr` / `safeUrlOrEmpty` instead.
 *
 * See docs/weekly-campaign-v2-plan.md §2c.
 */

/** Tags kept, with their attributes filtered. */
const ALLOWED_TAGS = new Set([
  "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "strong", "em", "b", "i", "u", "s", "small", "sub", "sup",
  "section", "article", "header", "footer", "main", "aside",
  "figure", "figcaption", "blockquote", "pre", "code", "mark", "time",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption",
  "img", "br", "hr", "wbr",
]);

/** Tags removed along with everything inside them. */
const DROP_SUBTREE = new Set([
  "script", "style", "iframe", "object", "embed", "applet", "noscript",
  "template", "slot", "svg", "math", "canvas", "portal", "dialog", "marquee",
  "form", "input", "button", "select", "textarea", "option", "optgroup",
  "label", "fieldset", "legend", "datalist", "output", "progress", "meter",
  "link", "meta", "base", "title",
  "audio", "video", "source", "track", "picture",
  "frame", "frameset", "noframes", "map", "area", "a",
]);

/**
 * Structural wrappers that get unwrapped (tag dropped, children kept) without
 * being reported — a model emitting a full document instead of a fragment is
 * sloppy, not hostile.
 */
const UNWRAP_QUIET = new Set(["html", "head", "body", "font", "center", "nobr"]);

/** Self-closing tags. */
const VOID_TAGS = new Set(["img", "br", "hr", "wbr"]);

const ALLOWED_ATTRS = new Set([
  "style", "src", "alt", "width", "height", "class", "id", "title",
  "role", "aria-hidden", "aria-label", "colspan", "rowspan",
]);

/** CSS constructs that can execute code or pull remote resources. */
const DANGEROUS_CSS = /expression\s*\(|javascript\s*:|vbscript\s*:|@import|behavior\s*:|-moz-binding|<\/?\w/i;

/** An untouched `{{PLACEHOLDER}}` — substituted later with a value we control. */
const PLACEHOLDER_ONLY = /^\{\{[A-Z0-9_]+\}\}$/;

export interface SanitizeResult {
  html: string;
  /** Human-readable list of what was stripped. Empty means the input was clean. */
  violations: string[];
}

/**
 * True for URLs safe to place in a `src`.
 *
 * `http:` is rejected on purpose: it is the reachable scheme for cloud metadata
 * and link-local addresses from inside the Puppeteer renderer, and every
 * legitimate source we emit is https, a data image, or same-origin relative.
 */
export function isSafeUrl(value: string): boolean {
  const v = (value || "").trim();
  if (!v) return false;
  if (PLACEHOLDER_ONLY.test(v)) return true;
  // Reject control characters, which are used to smuggle schemes past naive checks.
  if (/[\x00-\x1F\x7F]/.test(v)) return false;
  if (/^https:\/\/[^\s]+$/i.test(v)) return true;
  if (/^blob:/i.test(v)) return true;
  // Same-origin relative, but not protocol-relative "//evil.com".
  if (/^\/(?!\/)/.test(v)) return true;
  // Raster data URLs only — SVG can carry script.
  if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/=\s]+$/i.test(v)) return true;
  return false;
}

/** Replaces an unsafe URL with empty rather than dropping the element. */
export function safeUrlOrEmpty(value: string): string {
  return isSafeUrl(value) ? value : "";
}

/** Escapes a value being substituted into text position. */
export function escapeHtmlText(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escapes a value being substituted into a double-quoted attribute. */
export function escapeHtmlAttr(value: string): string {
  return String(value ?? "")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeStyle(value: string): { style: string; changed: boolean } {
  const original = value;
  // Strip comments first — they are used to break up dangerous keywords.
  let s = value.replace(/\/\*[\s\S]*?\*\//g, "");

  s = s
    .split(";")
    .filter((decl) => !DANGEROUS_CSS.test(decl))
    .join(";");

  // Any url() must resolve to something we allow.
  s = s.replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi, (match, _q, url) =>
    isSafeUrl(url) ? match : "none",
  );

  return { style: s, changed: s !== original };
}

function filterAttributes(
  attrSource: string,
  tag: string,
): { attrs: string; violations: string[] } {
  const violations: string[] = [];
  const parts: string[] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(attrSource)) !== null) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";

    // Event handlers first — they are the primary XSS vector.
    if (name.startsWith("on")) {
      violations.push(`<${tag}> dropped event handler "${name}"`);
      continue;
    }
    if (!ALLOWED_ATTRS.has(name)) {
      violations.push(`<${tag}> dropped attribute "${name}"`);
      continue;
    }
    if (name === "src") {
      if (!isSafeUrl(value)) {
        violations.push(`<${tag}> dropped unsafe src "${value.slice(0, 60)}"`);
        continue;
      }
    }
    if (name === "style") {
      const { style, changed } = sanitizeStyle(value);
      if (changed) violations.push(`<${tag}> sanitized style declaration`);
      parts.push(` style="${escapeHtmlAttr(style)}"`);
      continue;
    }
    parts.push(` ${name}="${escapeHtmlAttr(value)}"`);
  }

  return { attrs: parts.join(""), violations };
}

export function sanitizeTemplateHtml(input: string): SanitizeResult {
  const violations: string[] = [];
  if (!input) return { html: "", violations };

  // Comments, doctypes and processing instructions can all conceal markup.
  let src = input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<![^>]*>/g, "")
    .replace(/<\?[\s\S]*?\?>/g, "");

  const out: string[] = [];
  const dropStack: string[] = [];
  let i = 0;

  while (i < src.length) {
    const lt = src.indexOf("<", i);
    if (lt === -1) {
      if (dropStack.length === 0) out.push(src.slice(i));
      break;
    }
    if (lt > i && dropStack.length === 0) out.push(src.slice(i, lt));

    // Walk to the closing ">", ignoring ones inside quoted attribute values.
    let j = lt + 1;
    let quote = "";
    while (j < src.length) {
      const c = src[j];
      if (quote) {
        if (c === quote) quote = "";
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === ">") {
        break;
      }
      j++;
    }
    // Unterminated tag — discard the rest rather than guess at it.
    if (j >= src.length) {
      violations.push("discarded unterminated tag");
      break;
    }

    const raw = src.slice(lt + 1, j);
    i = j + 1;

    const isClose = raw.startsWith("/");
    const body = isClose ? raw.slice(1) : raw;
    const nameMatch = body.match(/^([a-zA-Z][a-zA-Z0-9-]*)/);
    if (!nameMatch) continue;
    const name = nameMatch[1].toLowerCase();
    const selfClosed = /\/\s*$/.test(raw);

    // Inside a dropped subtree: emit nothing, just track nesting depth.
    if (dropStack.length > 0) {
      if (isClose) {
        const top = dropStack.lastIndexOf(name);
        if (top !== -1) dropStack.length = top;
      } else if (DROP_SUBTREE.has(name) && !selfClosed && !VOID_TAGS.has(name)) {
        dropStack.push(name);
      }
      continue;
    }

    if (DROP_SUBTREE.has(name)) {
      if (!isClose) {
        violations.push(`removed <${name}> and its contents`);
        if (!selfClosed && !VOID_TAGS.has(name)) dropStack.push(name);
      }
      continue;
    }

    if (!ALLOWED_TAGS.has(name)) {
      if (!UNWRAP_QUIET.has(name) && !isClose) {
        violations.push(`unwrapped unknown tag <${name}>`);
      }
      continue;
    }

    if (isClose) {
      if (!VOID_TAGS.has(name)) out.push(`</${name}>`);
      continue;
    }

    const { attrs, violations: attrViolations } = filterAttributes(
      body.slice(nameMatch[1].length),
      name,
    );
    violations.push(...attrViolations);

    out.push(VOID_TAGS.has(name) ? `<${name}${attrs} />` : `<${name}${attrs}>`);
  }

  return { html: out.join(""), violations };
}

/**
 * Content-Security-Policy for the rendered document.
 *
 * Puppeteer's `page.evaluate` runs over the DevTools protocol and is not subject
 * to page CSP, so `script-src 'none'` blocks template script without breaking the
 * font/image readiness checks in /api/render-visual.
 *
 * `style-src 'unsafe-inline'` is unavoidable — every template is built from inline
 * styles by design.
 */
export const TEMPLATE_CSP = [
  "default-src 'none'",
  "img-src https: data: blob:",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com data:",
  "script-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "connect-src 'none'",
].join("; ");

export const TEMPLATE_CSP_META = `<meta http-equiv="Content-Security-Policy" content="${TEMPLATE_CSP}">`;
