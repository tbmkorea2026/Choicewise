'use strict';

const { esc, html } = require('../lib/utils');
const { icon } = require('../lib/icons');
const seo = require('../lib/seo');
const { logo } = require('./components');

// Brand marks for the footer follow links (filled, 24×24).
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14A28 28 0 0 0 14.64 2C11.93 2 10 3.66 10 6.7v2.8H7v4h3V22h4z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><path d="M17.5 6.5h.01"/></svg>',
  pinterest: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"/></svg>',
};
const SOCIAL_NAMES = { youtube: 'YouTube' };

const FONTS ='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,600;6..72,700&display=swap';

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
      ${social.length ? html`<p class="site-footer__heading">Follow us</p>
      <ul class="social">${social.map(([k, v]) => {
        const name = SOCIAL_NAMES[k] || k[0].toUpperCase() + k.slice(1);
        return html`<li><a class="social__link social__link--${esc(k)}" href="${esc(v)}" rel="noopener" target="_blank" aria-label="${esc(name)}" title="${esc(name)}">${SOCIAL_ICONS[k] || esc(name)}</a></li>`;
      })}</ul>` : ''}
      ${site.email ? html`<p class="site-footer__contact">${icon('mail', { size: 18 })} Contact us: <a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>` : ''}
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
    <p class="site-footer__disclosure">${esc(site.name)} is reader-supported. When you buy through links on our site, we may earn an affiliate commission. <a href="/affiliate-disclosure/">Read our affiliate disclosure</a>.</p>
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
<link rel="preload" as="style" href="${FONTS}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${FONTS}"></noscript>
<style>${assets.cssInline}</style>
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
