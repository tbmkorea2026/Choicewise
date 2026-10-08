'use strict';

const { esc, html } = require('../lib/utils');
const { icon } = require('../lib/icons');
const seo = require('../lib/seo');
const { logo } = require('./components');

const FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,600;6..72,700&display=swap';

function header(ctx) {
  const { site, categories, nav } = ctx;
  return html`<header class="site-header" data-header>
  <div class="container site-header__inner">
    ${logo(site)}
    <nav class="main-nav" id="main-nav" aria-label="Main">
      <ul class="main-nav__list">
        <li class="main-nav__item main-nav__item--drop">
          <button class="main-nav__link main-nav__trigger" type="button" aria-expanded="false" aria-controls="cat-menu" data-dropdown>
            Categories ${icon('chevronDown', { size: 16 })}
          </button>
          <div class="mega" id="cat-menu" hidden>
            <ul class="mega__grid">
              ${categories.map((c) => html`<li><a class="mega__link" href="/category/${c.slug}/" style="--hue:${c.hue}">
                <span class="mega__icon">${icon(c.icon, { size: 20 })}</span>
                <span><strong>${esc(c.name)}</strong><small>${c.count} guide${c.count === 1 ? '' : 's'}</small></span>
              </a></li>`)}
            </ul>
            <a class="mega__all" href="/categories/">All categories ${icon('arrowRight', { size: 16 })}</a>
          </div>
        </li>
        ${nav.map((n) => html`<li class="main-nav__item"><a class="main-nav__link" href="${n.url}"${ctx.section === n.key ? ' aria-current="page"' : ''}>${esc(n.name)}</a></li>`)}
      </ul>
    </nav>
    <div class="site-header__actions">
      <button class="icon-btn" type="button" data-search-open aria-label="Search reviews" title="Search (press /)">${icon('search')}</button>
      <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle dark mode">${icon('moon', { cls: 'icon-moon' })}${icon('sun', { cls: 'icon-sun' })}</button>
      <button class="icon-btn nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="main-nav" aria-label="Open menu">${icon('menu', { cls: 'icon-open' })}${icon('x', { cls: 'icon-close' })}</button>
    </div>
  </div>
</header>`;
}

function newsletter(site, preview) {
  const n = site.newsletter || {};
  // Hidden in production until a provider form action is configured; shown in dev as a preview.
  if (!n.enabled || (!n.action && !preview)) return '';
  return html`<section class="newsletter" aria-labelledby="nl-title">
  <div class="container newsletter__inner">
    <div>
      <h2 id="nl-title" class="newsletter__title">${esc(n.heading)}</h2>
      <p class="newsletter__text">${esc(n.text)}</p>
    </div>
    <form class="newsletter__form" ${n.action ? `action="${esc(n.action)}" method="post"` : 'data-newsletter-demo'} novalidate>
      <label for="nl-email" class="newsletter__label">Email address</label>
      <div class="newsletter__row">
        <input id="nl-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required>
        <button class="btn btn--primary" type="submit">Subscribe</button>
      </div>
      <p class="newsletter__msg" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>`;
}

function footer(ctx) {
  const { site, categories, year } = ctx;
  const social = Object.entries(site.social || {}).filter(([, v]) => v);
  return html`${newsletter(site, ctx.devReload)}
<footer class="site-footer">
  <div class="container site-footer__grid">
    <div class="site-footer__brand">
      ${logo(site)}
      <p>${esc(site.description)}</p>
      ${social.length ? html`<ul class="social">${social.map(([k, v]) => html`<li><a href="${esc(v)}" rel="noopener" target="_blank">${esc(k[0].toUpperCase() + k.slice(1))}</a></li>`)}</ul>` : ''}
    </div>
    <div>
      <p class="site-footer__heading">Categories</p>
      <ul>${categories.map((c) => html`<li><a href="/category/${c.slug}/">${esc(c.name)}</a></li>`)}</ul>
    </div>
    <div>
      <p class="site-footer__heading">Explore</p>
      <ul>
        <li><a href="/best/">Best-of Guides</a></li>
        <li><a href="/reviews/">All Reviews</a></li>
        <li><a href="/categories/">All Categories</a></li>
        <li><a href="/search/">Search</a></li>
      </ul>
    </div>
    <div>
      <p class="site-footer__heading">Company</p>
      <ul>
        <li><a href="/about/">About Us</a></li>
        <li><a href="/how-we-review/">How We Review</a></li>
        <li><a href="/affiliate-disclosure/">Affiliate Disclosure</a></li>
        <li><a href="/privacy-policy/">Privacy Policy</a></li>
        <li><a href="/terms/">Terms of Use</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
    </div>
  </div>
  <div class="container site-footer__bottom">
    <p>© ${year} ${esc(site.name)}. All rights reserved.</p>
    <p class="site-footer__disclosure">${esc(site.name)} is reader-supported. When you buy through links on our site, we may earn an affiliate commission. <a href="/affiliate-disclosure/">Learn more</a>.</p>
  </div>
</footer>`;
}

function searchDialog() {
  return html`<dialog class="search-dialog" data-search-dialog aria-label="Search">
  <form class="search-dialog__form" action="/search/" method="get" role="search">
    ${icon('search', { size: 22 })}
    <label class="sr-only" for="sd-input">Search reviews and guides</label>
    <input id="sd-input" name="q" type="search" placeholder="Search products, reviews, guides…" autocomplete="off" data-search-input>
    <button class="icon-btn" type="button" data-search-close aria-label="Close search">${icon('x')}</button>
  </form>
  <div class="search-dialog__results" data-search-results aria-live="polite"></div>
  <p class="search-dialog__hint"><kbd>Enter</kbd> to see all results · <kbd>Esc</kbd> to close</p>
</dialog>`;
}

/**
 * page: { title, description, url, image, type ('website'|'article'), noindex, jsonld: [], bodyClass, section }
 */
function layout(ctx, page, body) {
  const { site, assets } = ctx;
  const fullTitle = page.url === '/' ? `${site.name} — ${site.tagline}` : `${page.title} | ${site.name}`;
  const canonical = seo.abs(site, page.url);
  const image = seo.abs(site, page.image || '/assets/img/og-default.png');
  const ga = site.analytics && site.analytics.ga4;

  return html`<!doctype html>
<html lang="${site.locale || 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(page.description || site.description)}">
<link rel="canonical" href="${canonical}">
${page.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:type" content="${page.type || 'website'}">
<meta property="og:title" content="${esc(page.title || site.name)}">
<meta property="og:description" content="${esc(page.description || site.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
${site.verification?.pinterest ? html`<meta name="p:domain_verify" content="${esc(site.verification.pinterest)}">` : ''}
${page.published ? html`<meta property="article:published_time" content="${page.published}">` : ''}
${page.modified ? html`<meta property="article:modified_time" content="${page.modified}">` : ''}
<meta name="theme-color" content="#0b6b4f" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0e131b" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)}" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${assets.css}">
<script>(function(){try{var t=localStorage.getItem('cw-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}})();</script>
${ga ? html`<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ga)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(ga)}');</script>` : ''}
${seo.graph(page.jsonld || [])}
</head>
<body class="${page.bodyClass || ''}">
<a class="skip-link" href="#main">Skip to content</a>
${header({ ...ctx, section: page.section })}
<main id="main">
${body}
</main>
${footer(ctx)}
${searchDialog()}
<script src="${assets.js}" defer></script>
${ctx.devReload ? '<script>new EventSource("/__reload").onmessage=function(){location.reload()}</script>' : ''}
</body>
</html>`;
}

module.exports = { layout };
