#!/usr/bin/env node
'use strict';

/**
 * ChoiceWise static site generator.
 * Reads Markdown content + JSON data, renders HTML into ./dist, ready for Hostinger.
 *
 *   npm run build              production build
 *   node scripts/build.js --drafts   include draft: true content
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const CONTENT = path.join(ROOT, 'content');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');

const { loadContent, YEAR } = require('../src/lib/content');
const { renderMarkdown } = require('../src/lib/markdown');
const { PATHS } = require('../src/lib/icons');
const { esc, isoDate, fmtScore } = require('../src/lib/utils');
const components = require('../src/templates/components');
const pages = require('../src/templates/pages');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(SRC, 'data', file), 'utf8'));
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

function write(urlPath, contents) {
  const rel = urlPath.endsWith('/') ? path.join(urlPath, 'index.html') : urlPath;
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function hashFile(file) {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
}

function placeholderSvg(cat) {
  const h = cat.hue;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},55%,95%)"/><stop offset="1" stop-color="hsl(${h},50%,85%)"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#g)"/>
<circle cx="330" cy="40" r="110" fill="hsl(${h},60%,99%)" opacity=".45"/>
<circle cx="60" cy="280" r="80" fill="hsl(${h},50%,78%)" opacity=".35"/>
<g transform="translate(150 100) scale(4.1667)" fill="none" stroke="hsl(${h},45%,32%)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${PATHS[cat.icon] || PATHS.tag}</g>
</svg>`;
}

/** Escape a URL for use as a mod_rewrite substitution. */
function rewriteTarget(url) {
  return url.replace(/\s/g, '%20').replace(/([%$\\])/g, '\\$1');
}

function build({ includeDrafts = process.argv.includes('--drafts'), devReload = false, quiet = false } = {}) {
  const t0 = Date.now();
  const site = readJson('site.json');
  if (process.env.SITE_URL) site.url = process.env.SITE_URL;
  site.url = site.url.replace(/\/$/, '');
  const authors = readJson('authors.json');
  const categories = readJson('categories.json');

  const content = loadContent(CONTENT, { site, categories, authors, includeDrafts });

  // Render Markdown bodies (shortcodes need the components)
  for (const r of content.reviews) {
    const out = renderMarkdown(r.body, {
      siteUrl: site.url,
      shortcodes: {
        cta: (text) => components.ctaBox(r.product, { text: text || `Our ${fmtScore(r.rating)}/10 pick. Check today's price and availability.` }),
        proscons: () => components.prosCons(r.pros, r.cons),
      },
    });
    Object.assign(r, out);
  }
  for (const r of content.roundups) {
    const out = renderMarkdown(r.body, {
      siteUrl: site.url,
      shortcodes: {
        product: (rank) => {
          const p = r.products[Number(rank) - 1];
          return p ? components.ctaBox(p, { text: p.summary }) : '';
        },
      },
    });
    Object.assign(r, out);
    r.introHtml = r.intro ? renderMarkdown(r.intro, { siteUrl: site.url }).html : '';
  }
  for (const p of content.pages) Object.assign(p, renderMarkdown(p.body, { siteUrl: site.url }));

  // Category counts + lookup maps
  for (const cat of categories) {
    cat.count = content.reviews.filter((r) => r.category === cat.slug).length
      + content.roundups.filter((r) => r.category === cat.slug).length;
  }
  const catMap = new Map(categories.map((c) => [c.slug, c]));
  // Empty categories stay hidden (menu, home, sitemap, search) until they get their first article.
  const visibleCategories = categories.filter((c) => c.count > 0);
  const authorMap = new Map(authors.map((a) => [a.slug, a]));

  // Fresh dist
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
  copyDir(PUBLIC, DIST);

  for (const cat of categories) {
    write(`/assets/img/ph/${cat.slug}.svg`, placeholderSvg(cat));
  }

  const ctx = {
    site, categories: visibleCategories, catMap, authors, authorMap, content, devReload,
    year: YEAR,
    month: new Date().toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }),
    nav: [
      { key: 'best', name: 'Best Picks', url: '/best/' },
      { key: 'reviews', name: 'Reviews', url: '/reviews/' },
      { key: 'how-we-review', name: 'How We Review', url: '/how-we-review/' },
      { key: 'about', name: 'About', url: '/about/' },
    ],
    assets: {
      css: `/assets/css/main.css?v=${hashFile(path.join(SRC, 'assets/css/main.css'))}`,
      js: `/assets/js/main.js?v=${hashFile(path.join(SRC, 'assets/js/main.js'))}`,
    },
  };

  // Pages
  write('/', pages.home(ctx));
  write('/categories/', pages.categoriesIndex(ctx));
  write('/reviews/', pages.reviewsIndex(ctx));
  write('/best/', pages.bestIndex(ctx));
  write('/search/', pages.searchPage(ctx));
  write('/404.html', pages.notFound(ctx));
  for (const cat of visibleCategories) write(`/category/${cat.slug}/`, pages.category(ctx, cat));
  for (const r of content.reviews) write(r.url, pages.review(ctx, r));
  for (const r of content.roundups) write(r.url, pages.roundup(ctx, r));
  for (const p of content.pages) write(p.url, pages.staticPage(ctx, p));
  for (const a of authors) write(`/author/${a.slug}/`, pages.authorPage(ctx, a));

  // Affiliate redirects: HTML fallback pages + .htaccess rules
  const rules = [];
  for (const [id, { url }] of content.links) {
    write(`/go/${id}/`, pages.goRedirect(url));
    rules.push(`RewriteRule ^go/${id}/?$ ${rewriteTarget(url)} [R=302,L,NE]`);
  }
  const htaccessFile = path.join(DIST, '.htaccess');
  if (fs.existsSync(htaccessFile)) {
    const tpl = fs.readFileSync(htaccessFile, 'utf8');
    fs.writeFileSync(htaccessFile, tpl.replace('# {{GO_REDIRECTS}}', rules.join('\n') || '# (no affiliate links yet)'));
  }

  // Search index
  const index = [
    ...content.roundups.map((r) => ({
      t: r.title, u: r.url, d: r.description, c: catMap.get(r.category).name, k: 'Best-of guide',
      p: r.products.map((p) => p.name).join(' · '), i: r.products[0] ? r.products[0].image : '',
    })),
    ...content.reviews.map((r) => ({
      t: r.title, u: r.url, d: r.description, c: catMap.get(r.category).name, k: 'Review',
      p: [r.product.name, r.product.brand].filter(Boolean).join(' · '), s: fmtScore(r.rating), i: r.product.image,
    })),
    ...visibleCategories.map((cat) => ({ t: cat.name, u: `/category/${cat.slug}/`, d: cat.description, c: 'Category', k: 'Category', p: '' })),
  ];
  write('/search-index.json', JSON.stringify(index));

  // Sitemap
  const urls = [
    { loc: '/', lastmod: new Date() },
    { loc: '/best/' }, { loc: '/reviews/' }, { loc: '/categories/' },
    ...visibleCategories.map((cat) => ({ loc: `/category/${cat.slug}/` })),
    ...content.roundups.map((r) => ({ loc: r.url, lastmod: r.updated })),
    ...content.reviews.map((r) => ({ loc: r.url, lastmod: r.updated })),
    ...content.pages.map((p) => ({ loc: p.url, lastmod: p.updated })),
    ...authors.map((a) => ({ loc: `/author/${a.slug}/` })),
  ];
  write('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${site.url}${u.loc}</loc>${u.lastmod ? `<lastmod>${isoDate(u.lastmod)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);

  write('/robots.txt', `User-agent: *
Allow: /
Disallow: /go/
Disallow: /search/

Sitemap: ${site.url}/sitemap.xml
`);

  // RSS
  const feedItems = [...content.roundups, ...content.reviews].sort((a, b) => b.updated - a.updated).slice(0, 30);
  write('/feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(site.name)}</title>
  <link>${site.url}/</link>
  <description>${esc(site.description)}</description>
  <language>en</language>
  <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${feedItems.map((x) => `  <item>
    <title>${esc(x.title)}</title>
    <link>${site.url}${x.url}</link>
    <guid>${site.url}${x.url}</guid>
    <pubDate>${x.date.toUTCString()}</pubDate>
    <description>${esc(x.description)}</description>
  </item>`).join('\n')}
</channel>
</rss>
`);

  for (const w of content.warnings) console.warn(`⚠  ${w}`);
  if (!quiet) {
    console.log(`✔ Built ${content.roundups.length} guides, ${content.reviews.length} reviews, ${content.pages.length} pages, ${content.links.size} affiliate links → dist/ in ${Date.now() - t0} ms`);
  }
  return { content };
}

if (require.main === module) {
  try {
    build();
  } catch (err) {
    console.error(`✖ Build failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { build, DIST, ROOT };
