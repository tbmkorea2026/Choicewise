'use strict';

const { marked } = require('marked');
const { slugify } = require('./utils');

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render Markdown to HTML with WiseChoice extras:
 *  - {{shortcode arg}} blocks (e.g. {{cta}}, {{product 2}}) replaced by components
 *  - [text](go:link-id) → cloaked affiliate link /go/link-id/
 *  - h2/h3 get stable ids; returns the list for the table of contents
 *  - tables are wrapped for horizontal scroll on mobile
 */
function renderMarkdown(source, { shortcodes = {}, siteUrl = '' } = {}) {
  const blocks = [];
  let src = String(source || '').replace(/\{\{\s*([a-zA-Z]+)(?:\s+([^}]*?))?\s*\}\}/g, (match, name, arg) => {
    const fn = shortcodes[name];
    if (!fn) return match;
    blocks.push(fn(arg ? arg.trim() : ''));
    return `\n\nCWBLOCK${blocks.length - 1}X\n\n`;
  });

  let out = marked.parse(src);
  out = out.replace(/<p>CWBLOCK(\d+)X<\/p>/g, (m, i) => blocks[Number(i)]);

  // Cloaked affiliate links
  out = out.replace(/<a href="go:([a-z0-9-]+)"/g,
    (m, id) => `<a href="/go/${id}/" rel="sponsored nofollow noopener" target="_blank" data-aff="${id}"`);

  // External links open in a new tab
  out = out.replace(/<a href="(https?:\/\/[^"]+)"/g, (m, href) => {
    if (siteUrl && href.startsWith(siteUrl)) return m;
    return `<a href="${href}" target="_blank" rel="noopener"`;
  });

  // Heading anchors
  const headings = [];
  const used = new Set();
  out = out.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (m, level, inner) => {
    const text = inner.replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    const base = slugify(text) || 'section';
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    headings.push({ level: Number(level), id, text });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });

  out = out.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');

  return { html: out, headings };
}

function inlineMarkdown(source) {
  return marked.parseInline(String(source || ''));
}

module.exports = { renderMarkdown, inlineMarkdown };
