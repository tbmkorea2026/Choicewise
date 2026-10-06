'use strict';

const { esc, html, fmtDate, isoDate, fmtScore, scoreLabel } = require('../lib/utils');
const { icon } = require('../lib/icons');
const seo = require('../lib/seo');
const { layout } = require('./layout');
const c = require('./components');

const HOME_CRUMB = { name: 'Home', url: '/' };

/** Show full rows only in a 3-column grid (at least 3, at most 6 items). */
const fullRows = (list) => list.slice(0, Math.min(6, Math.max(3, Math.floor(list.length / 3) * 3)));

function sectionHead(title, { eyebrow, text, link, linkText, id } = {}) {
  return html`<div class="section-head">
    <div>
      ${eyebrow ? html`<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      <h2${id ? ` id="${id}"` : ''}>${esc(title)}</h2>
      ${text ? html`<p class="section-head__text">${esc(text)}</p>` : ''}
    </div>
    ${link ? html`<a class="link-arrow" href="${link}">${esc(linkText || 'View all')} ${icon('arrowRight', { size: 16 })}</a>` : ''}
  </div>`;
}

const PROCESS = [
  { icon: 'flask', title: 'Deep research', text: 'We shortlist the leading contenders using spec sheets, expert sources, long-term owner reports and hands-on evaluation where possible.' },
  { icon: 'scale', title: 'Weighted scoring', text: 'Each product is scored out of 10 on the criteria that matter for its category: performance, build, ease of use and value.' },
  { icon: 'ban', title: 'No paid rankings', text: 'Brands cannot buy a spot or a score. Affiliate commissions never influence which products we recommend.' },
  { icon: 'refresh', title: 'Always up to date', text: 'We revisit guides when new models launch or prices shift, so our picks reflect what you can actually buy today.' },
];

/* ======================= HOME ======================= */

function home(ctx) {
  const { site, content, categories, catMap } = ctx;
  const { reviews, roundups } = content;
  const featured = [...roundups.filter((r) => r.featured), ...roundups.filter((r) => !r.featured)].slice(0, 3);
  const productCount = new Set([
    ...reviews.map((r) => r.product.name),
    ...roundups.flatMap((r) => r.products.map((p) => p.name)),
  ]).size;

  const body = html`
<section class="hero">
  <div class="container hero__grid">
    <div class="hero__copy">
      <p class="eyebrow eyebrow--pill">${icon('badgeCheck', { size: 16 })} Independent reviews · Updated ${esc(ctx.month)} ${ctx.year}</p>
      <h1 class="hero__title">Buy smarter.<br><em>Choose wisely.</em></h1>
      <p class="hero__lead">We research, score and rank the products worth your money, so you can skip hours of tabs and buy with confidence.</p>
      <form class="hero-search" action="/search/" method="get" role="search">
        <label class="sr-only" for="hero-q">Search reviews and guides</label>
        ${icon('search', { size: 20 })}
        <input id="hero-q" name="q" type="search" placeholder="Search e.g. robot vacuum, VPN, earbuds" autocomplete="off">
        <button class="btn btn--primary" type="submit">Search</button>
      </form>
      ${roundups.length ? html`<div class="hero__popular"><span>Popular:</span>
        ${roundups.slice(0, 4).map((r) => html`<a class="chip" href="${r.url}">${esc(r.shortTitle)}</a>`)}
      </div>` : ''}
      <dl class="hero__stats">
        <div><dt>Products compared</dt><dd>${productCount}+</dd></div>
        <div><dt>Categories</dt><dd>${categories.length}</dd></div>
        <div><dt>Paid placements</dt><dd>0</dd></div>
      </dl>
    </div>
    ${featured.length ? html`<aside class="hero__panel" aria-labelledby="picks-title">
      <p class="hero__panel-title" id="picks-title">${icon('trophy', { size: 18 })} Editor's top picks</p>
      <ul class="pick-stack">
        ${featured.map((r) => {
          const p = r.products[0];
          const cat = catMap.get(r.category);
          return html`<li><a class="pick-stack__item" href="${r.url}">
            <img src="${esc(p.image)}" alt="" width="64" height="64" loading="eager">
            <span class="pick-stack__text">
              <small style="--hue:${cat.hue}">${esc(r.shortTitle)}</small>
              <strong>${esc(p.name)}</strong>
              <span class="pick-stack__badge">${icon('award', { size: 14 })} ${esc(p.badge || 'Best Overall')}</span>
            </span>
            ${p.rating ? c.scoreBadge(p.rating, { size: 'sm', showLabel: false }) : ''}
          </a></li>`;
        })}
      </ul>
      <a class="link-arrow" href="/best/">All best-of guides ${icon('arrowRight', { size: 16 })}</a>
    </aside>` : ''}
  </div>
</section>

<section class="trust" aria-label="Why trust ChoiceWise">
  <ul class="container trust__list">
    ${PROCESS.map((p) => html`<li>${icon(p.icon, { size: 22 })}<span>${esc(p.title)}</span></li>`)}
  </ul>
</section>

${roundups.length ? html`<section class="section">
  <div class="container">
    ${sectionHead('Best-of guides', { eyebrow: 'Top picks', text: 'Ranked shortlists of the best products in each category, with side-by-side comparisons.', link: '/best/', linkText: 'All guides' })}
    <div class="grid grid--3">${fullRows(roundups).map((r) => c.roundupCard(r, catMap.get(r.category)))}</div>
  </div>
</section>` : ''}

${reviews.length ? html`<section class="section section--alt">
  <div class="container">
    ${sectionHead('Latest reviews', { eyebrow: 'Recently published', text: 'In-depth, scored reviews of individual products.', link: '/reviews/', linkText: 'All reviews' })}
    <div class="grid grid--3">${fullRows(reviews).map((r) => c.reviewCard(r, catMap.get(r.category)))}</div>
  </div>
</section>` : ''}

<section class="section">
  <div class="container">
    ${sectionHead('Browse by category', { eyebrow: 'What we review', link: '/categories/', linkText: 'All categories' })}
    <ul class="cat-grid">
      ${categories.map((cat) => html`<li><a class="cat-tile" href="/category/${cat.slug}/" style="--hue:${cat.hue}">
        <span class="cat-tile__icon">${icon(cat.icon, { size: 24 })}</span>
        <span class="cat-tile__name">${esc(cat.name)}</span>
        <span class="cat-tile__desc">${esc(cat.description)}</span>
        <span class="cat-tile__count">${cat.count} guide${cat.count === 1 ? '' : 's'} ${icon('arrowRight', { size: 14 })}</span>
      </a></li>`)}
    </ul>
  </div>
</section>

<section class="section section--ink" aria-labelledby="process-title">
  <div class="container">
    ${sectionHead('How we review products', { eyebrow: 'Our process', id: 'process-title', text: 'Every review follows the same transparent methodology, so scores are comparable across products.', link: '/how-we-review/', linkText: 'Read our methodology' })}
    <ol class="process">
      ${PROCESS.map((p, i) => html`<li class="process__step">
        <span class="process__num">0${i + 1}</span>
        ${icon(p.icon, { size: 26, cls: 'process__icon' })}
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.text)}</p>
      </li>`)}
    </ol>
    <div class="scale" aria-label="Score scale">
      ${[[9.5, '9.5–10'], [9, '9.0–9.4'], [8.5, '8.5–8.9'], [8, '8.0–8.4'], [7, '7.0–7.9']].map(([s, range]) => html`<div class="scale__item"><span class="scale__range">${range}</span><span class="scale__label">${scoreLabel(s)}</span></div>`)}
    </div>
  </div>
</section>

<section class="section">
  <div class="container container--narrow">${c.faqList(site.homeFaq, { headingId: 'home-faq' })}</div>
</section>`;

  return layout(ctx, {
    title: site.name,
    description: site.description,
    url: '/',
    section: 'home',
    jsonld: [seo.organization(site), seo.website(site), seo.faqPage(site.homeFaq)],
  }, body);
}

/* ======================= REVIEW ======================= */

function review(ctx, r) {
  const { site, catMap, authorMap, content } = ctx;
  const cat = catMap.get(r.category);
  const author = authorMap.get(r.author);
  const p = r.product;
  const roundup = content.roundups.find((x) => x.category === r.category && x.products.some((q) => q.reviewUrl === r.url))
    || content.roundups.find((x) => x.category === r.category);
  const related = [
    ...content.reviews.filter((x) => x.category === r.category && x.slug !== r.slug),
    ...content.reviews.filter((x) => x.category !== r.category),
  ].slice(0, 3);

  const tocItems = [
    { id: 'verdict', text: 'Our verdict' },
    { id: 'pros-and-cons', text: 'Pros & cons' },
    ...r.headings.filter((h) => h.level === 2),
    ...(r.specs.length ? [{ id: 'specs', text: 'Specifications' }] : []),
    ...(r.faqs.length ? [{ id: 'faq', text: 'FAQ' }] : []),
  ];
  const crumbs = [HOME_CRUMB, { name: cat.name, url: `/category/${cat.slug}/` }, { name: 'Reviews', url: '/reviews/' }, { name: p.name }];

  const body = html`
<div class="page-head">
  <div class="container">
    ${c.breadcrumbs(crumbs)}
    <div class="page-head__tags">${c.categoryPill(cat)}<span class="tag">${icon('badgeCheck', { size: 14 })} In-depth review</span></div>
    <h1 class="page-head__title">${esc(r.title)}</h1>
    <p class="page-head__lead">${esc(r.description)}</p>
    ${c.byline(r, author)}
    ${c.disclosureNote()}
  </div>
</div>

<section class="container">
  <div class="product-hero" data-cta-anchor>
    <div class="product-hero__media"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="480" height="360" fetchpriority="high"></div>
    <div class="product-hero__info">
      ${p.brand ? html`<p class="product-hero__brand">${esc(p.brand)}</p>` : ''}
      <p class="product-hero__name">${esc(p.name)}</p>
      <div class="product-hero__rating">${c.stars(r.rating)} <span>${fmtScore(r.rating)}/10 · ${scoreLabel(r.rating)}</span></div>
      ${r.bestFor.length ? html`<ul class="best-for">${r.bestFor.map((b) => html`<li>${icon('check', { size: 14 })}${esc(b)}</li>`)}</ul>` : ''}
      <div class="product-hero__buy">
        ${p.price ? html`<p class="price"><span>Typical price</span><strong>${esc(p.price)}</strong></p>` : ''}
        ${c.ctaButton(p, { size: 'lg' })}
      </div>
      ${roundup ? html`<a class="link-arrow link-arrow--muted" href="${roundup.url}">Compare with alternatives in ${esc(roundup.shortTitle)} ${icon('arrowRight', { size: 16 })}</a>` : ''}
    </div>
    <div class="product-hero__score">${c.scoreBadge(r.rating, { size: 'lg' })}</div>
  </div>
</section>

<div class="container article-layout">
  <article class="article">
    <section class="verdict" aria-labelledby="verdict">
      <h2 id="verdict">${icon('award', { size: 22 })} Our verdict</h2>
      <p class="verdict__text">${esc(r.verdict)}</p>
      ${c.scoreBars(r.scores)}
    </section>

    <section aria-labelledby="pros-and-cons">
      <h2 id="pros-and-cons" class="article__h2">Pros &amp; cons</h2>
      ${c.prosCons(r.pros, r.cons)}
    </section>

    <div class="prose">${r.html}</div>

    ${r.specs.length ? html`<section aria-labelledby="specs">
      <h2 id="specs" class="article__h2">Specifications</h2>
      ${c.specsTable(r.specs)}
    </section>` : ''}

    ${c.faqList(r.faqs)}

    ${c.ctaBox(p, { title: `Ready to buy the ${p.name}?`, text: 'Prices change often. Check the latest price and availability with the retailer.' })}
    ${c.authorBox(author)}
  </article>

  <aside class="sidebar">
    <div class="sidebar__sticky">
      ${c.toc(tocItems)}
      ${p.goUrl ? html`<div class="side-cta">
        <img src="${esc(p.image)}" alt="" width="72" height="72" loading="lazy">
        <div><p class="side-cta__name">${esc(p.name)}</p>${c.stars(r.rating, { size: 'sm' })}</div>
        ${c.ctaButton(p, { block: true })}
      </div>` : ''}
    </div>
  </aside>
</div>

${related.length ? html`<section class="section section--alt">
  <div class="container">
    ${sectionHead('More reviews you might like', { link: `/category/${cat.slug}/`, linkText: `More in ${cat.short}` })}
    <div class="grid grid--3">${related.map((x) => c.reviewCard(x, catMap.get(x.category)))}</div>
  </div>
</section>` : ''}

${p.goUrl ? html`<div class="sticky-cta" data-sticky-cta aria-hidden="true">
  <div class="sticky-cta__info"><strong>${esc(p.name)}</strong>${c.stars(r.rating, { size: 'sm' })}</div>
  ${c.ctaButton(p, { label: p.price ? `${p.price} · View deal` : 'View deal' })}
</div>` : ''}`;

  return layout(ctx, {
    title: r.seoTitle,
    description: r.description,
    url: r.url,
    image: p.image.endsWith('.svg') ? null : p.image,
    type: 'article',
    published: r.date.toISOString(),
    modified: r.updated.toISOString(),
    section: 'reviews',
    bodyClass: 'has-sticky-cta',
    jsonld: [
      seo.organization(site),
      seo.breadcrumbs(site, crumbs),
      seo.reviewProduct(site, r, author),
      seo.faqPage(r.faqs),
    ],
  }, body);
}

/* ======================= ROUNDUP (BEST-OF) ======================= */

function pickSection(p, r) {
  const keySpecs = p.specs.slice(0, 4);
  return html`<section class="pick" id="pick-${p.rank}" aria-labelledby="pick-${p.rank}-name">
    <div class="pick__rank" aria-hidden="true">${p.rank}</div>
    <div class="pick__media">
      <img src="${esc(p.image)}" alt="${esc(p.name)}" width="320" height="240" loading="lazy" decoding="async">
      ${p.badge ? html`<span class="badge">${icon('award', { size: 14 })} ${esc(p.badge)}</span>` : ''}
    </div>
    <div class="pick__body">
      <div class="pick__head">
        <div>
          <p class="pick__eyebrow">#${p.rank}${p.badge ? ` · ${esc(p.badge)}` : ''}</p>
          <h3 id="pick-${p.rank}-name" class="pick__name">${esc(p.name)}</h3>
          ${p.rating ? html`<div class="pick__rating">${c.stars(p.rating, { size: 'sm' })}<span>${fmtScore(p.rating)}/10</span></div>` : ''}
        </div>
        ${p.rating ? c.scoreBadge(p.rating, { size: 'md' }) : ''}
      </div>
      ${p.summary ? html`<p class="pick__summary">${esc(p.summary)}</p>` : ''}
      ${p.bestFor ? html`<p class="pick__best">${icon('check', { size: 16 })}<span><strong>Best for:</strong> ${esc(p.bestFor)}</span></p>` : ''}
      ${c.prosCons(p.pros, p.cons, { compact: true })}
      ${keySpecs.length ? html`<dl class="key-specs">${keySpecs.map(([k, v]) => html`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)}</dl>` : ''}
      <div class="pick__actions">
        ${p.price ? html`<p class="price price--inline"><span>From</span><strong>${esc(p.price)}</strong></p>` : ''}
        ${c.ctaButton(p)}
        ${p.reviewUrl ? html`<a class="btn btn--ghost" href="${p.reviewUrl}">Read full review</a>` : ''}
      </div>
    </div>
  </section>`;
}

function roundup(ctx, r) {
  const { site, catMap, authorMap, content } = ctx;
  const cat = catMap.get(r.category);
  const author = authorMap.get(r.author);
  const top = r.products.slice(0, 3);
  const related = content.roundups.filter((x) => x.slug !== r.slug).slice(0, 3);
  const crumbs = [HOME_CRUMB, { name: cat.name, url: `/category/${cat.slug}/` }, { name: 'Best-of Guides', url: '/best/' }, { name: r.shortTitle }];

  const tocItems = [
    { id: 'top-picks', text: 'Top picks at a glance' },
    { id: 'comparison', text: 'Comparison table' },
    ...r.products.map((p) => ({ id: `pick-${p.rank}`, text: `${p.rank}. ${p.name}`, level: 3 })),
    ...r.headings.filter((h) => h.level === 2),
    ...(r.faqs.length ? [{ id: 'faq', text: 'FAQ' }] : []),
  ];

  const body = html`
<div class="page-head">
  <div class="container">
    ${c.breadcrumbs(crumbs)}
    <div class="page-head__tags">${c.categoryPill(cat)}<span class="tag">${icon('trophy', { size: 14 })} Best-of guide</span></div>
    <h1 class="page-head__title">${esc(r.title)}</h1>
    <p class="page-head__lead">${esc(r.description)}</p>
    ${c.byline(r, author)}
    ${c.disclosureNote()}
  </div>
</div>

<section class="container" aria-labelledby="top-picks">
  <h2 id="top-picks" class="sr-only">Top picks at a glance</h2>
  <ol class="quick-picks">
    ${top.map((p) => html`<li class="quick-pick${p.rank === 1 ? ' quick-pick--winner' : ''}">
      ${p.badge ? html`<span class="quick-pick__badge">${icon(p.rank === 1 ? 'trophy' : 'award', { size: 14 })} ${esc(p.badge)}</span>` : ''}
      <img src="${esc(p.image)}" alt="" width="200" height="150" ${p.rank === 1 ? 'fetchpriority="high"' : 'loading="lazy"'}>
      <p class="quick-pick__name"><a href="#pick-${p.rank}">${esc(p.name)}</a></p>
      ${p.rating ? html`<div class="quick-pick__rating">${c.stars(p.rating, { size: 'sm' })}<strong>${fmtScore(p.rating)}</strong></div>` : ''}
      ${p.bestFor ? html`<p class="quick-pick__best">${esc(p.bestFor)}</p>` : ''}
      ${c.ctaButton(p, { block: true })}
    </li>`)}
  </ol>
</section>

<div class="container article-layout">
  <article class="article">
    ${r.introHtml ? html`<div class="prose prose--intro">${r.introHtml}</div>` : ''}

    <section aria-labelledby="comparison">
      <h2 id="comparison" class="article__h2">Comparison table</h2>
      <div class="table-wrap"><table class="compare">
        <thead><tr><th scope="col">Product</th><th scope="col">Best for</th><th scope="col">Score</th><th scope="col"><span class="sr-only">Buy</span></th></tr></thead>
        <tbody>
          ${r.products.map((p) => html`<tr>
            <th scope="row"><a class="compare__product" href="#pick-${p.rank}"><span class="compare__rank">${p.rank}</span><img src="${esc(p.image)}" alt="" width="48" height="48" loading="lazy"><span>${esc(p.name)}${p.badge ? html`<small>${esc(p.badge)}</small>` : ''}</span></a></th>
            <td>${esc(p.bestFor)}</td>
            <td><span class="compare__score">${p.rating ? fmtScore(p.rating) : '–'}</span></td>
            <td>${c.ctaButton(p, { size: 'sm', label: p.price ? p.price : 'View deal' })}</td>
          </tr>`)}
        </tbody>
      </table></div>
    </section>

    <section class="picks" aria-label="Detailed reviews">
      ${r.products.map((p) => pickSection(p, r))}
    </section>

    <div class="prose">${r.html}</div>

    ${c.faqList(r.faqs)}
    ${c.authorBox(author)}
  </article>

  <aside class="sidebar">
    <div class="sidebar__sticky">
      ${c.toc(tocItems)}
      ${r.products[0] && r.products[0].goUrl ? html`<div class="side-cta">
        <img src="${esc(r.products[0].image)}" alt="" width="72" height="72" loading="lazy">
        <div><p class="side-cta__eyebrow">Our top pick</p><p class="side-cta__name">${esc(r.products[0].name)}</p></div>
        ${c.ctaButton(r.products[0], { block: true })}
      </div>` : ''}
    </div>
  </aside>
</div>

${related.length ? html`<section class="section section--alt">
  <div class="container">
    ${sectionHead('More best-of guides', { link: '/best/', linkText: 'All guides' })}
    <div class="grid grid--3">${related.map((x) => c.roundupCard(x, catMap.get(x.category)))}</div>
  </div>
</section>` : ''}`;

  return layout(ctx, {
    title: r.seoTitle,
    description: r.description,
    url: r.url,
    type: 'article',
    published: r.date.toISOString(),
    modified: r.updated.toISOString(),
    section: 'best',
    jsonld: [
      seo.organization(site),
      seo.breadcrumbs(site, crumbs),
      seo.article(site, r, author, r.products[0] && !r.products[0].image.endsWith('.svg') ? r.products[0].image : '/assets/img/og-default.png'),
      seo.itemList(site, r),
      seo.faqPage(r.faqs),
    ],
  }, body);
}

/* ======================= LISTING PAGES ======================= */

function listingHead(title, lead, crumbs, extra = '') {
  return html`<div class="page-head page-head--listing">
    <div class="container">
      ${c.breadcrumbs(crumbs)}
      ${extra}
      <h1 class="page-head__title">${esc(title)}</h1>
      ${lead ? html`<p class="page-head__lead">${esc(lead)}</p>` : ''}
    </div>
  </div>`;
}

function category(ctx, cat) {
  const { site, content, categories, catMap } = ctx;
  const roundups = content.roundups.filter((r) => r.category === cat.slug);
  const reviews = content.reviews.filter((r) => r.category === cat.slug);
  const crumbs = [HOME_CRUMB, { name: 'Categories', url: '/categories/' }, { name: cat.name }];

  const body = html`
${listingHead(cat.name, cat.description, crumbs, html`<span class="cat-hero-icon" style="--hue:${cat.hue}">${icon(cat.icon, { size: 28 })}</span>`)}
<section class="section section--tight">
  <div class="container">
    ${sectionHead(`Best-of guides in ${cat.name}`, { eyebrow: 'Top picks' })}
    ${roundups.length ? html`<div class="grid grid--3">${roundups.map((r) => c.roundupCard(r, cat))}</div>`
      : c.emptyState('Our team is researching the best picks in this category. Check back soon.')}
  </div>
</section>
<section class="section section--alt">
  <div class="container">
    ${sectionHead(`${cat.short} reviews`, { eyebrow: 'In-depth reviews' })}
    ${reviews.length ? html`<div class="grid grid--3">${reviews.map((r) => c.reviewCard(r, cat))}</div>`
      : c.emptyState('New in-depth reviews for this category are on the way.')}
  </div>
</section>
<section class="section">
  <div class="container">
    ${sectionHead('Explore other categories')}
    <ul class="chip-row">${categories.filter((x) => x.slug !== cat.slug).map((x) => html`<li>${c.categoryPill(x)}</li>`)}</ul>
  </div>
</section>`;

  return layout(ctx, {
    title: `${cat.name} Reviews & Best-of Guides`,
    description: cat.description,
    url: `/category/${cat.slug}/`,
    section: 'categories',
    jsonld: [seo.organization(site), seo.breadcrumbs(site, crumbs)],
  }, body);
}

function categoriesIndex(ctx) {
  const { site, categories } = ctx;
  const crumbs = [HOME_CRUMB, { name: 'Categories' }];
  const body = html`
${listingHead('All categories', 'Pick a category to see our best-of rankings and in-depth reviews.', crumbs)}
<section class="section section--tight"><div class="container">
  <ul class="cat-grid">
    ${categories.map((cat) => html`<li><a class="cat-tile" href="/category/${cat.slug}/" style="--hue:${cat.hue}">
      <span class="cat-tile__icon">${icon(cat.icon, { size: 24 })}</span>
      <span class="cat-tile__name">${esc(cat.name)}</span>
      <span class="cat-tile__desc">${esc(cat.description)}</span>
      <span class="cat-tile__count">${cat.count} guide${cat.count === 1 ? '' : 's'} ${icon('arrowRight', { size: 14 })}</span>
    </a></li>`)}
  </ul>
</div></section>`;
  return layout(ctx, { title: 'All Categories', description: 'Browse ChoiceWise reviews and best-of guides by category.', url: '/categories/', section: 'categories', jsonld: [seo.breadcrumbs(site, crumbs)] }, body);
}

function reviewsIndex(ctx) {
  const { site, content, catMap, categories } = ctx;
  const crumbs = [HOME_CRUMB, { name: 'Reviews' }];
  const used = categories.filter((cat) => content.reviews.some((r) => r.category === cat.slug));
  const body = html`
${listingHead('All product reviews', 'In-depth, scored reviews of individual products. Filter by category or browse the latest.', crumbs)}
<section class="section section--tight"><div class="container">
  ${used.length > 1 ? html`<div class="filter" role="group" aria-label="Filter by category" data-filter>
    <button type="button" class="chip is-active" data-filter-value="all" aria-pressed="true">All</button>
    ${used.map((cat) => html`<button type="button" class="chip" data-filter-value="${cat.slug}" aria-pressed="false">${esc(cat.short)}</button>`)}
  </div>` : ''}
  ${content.reviews.length ? html`<div class="grid grid--3" data-filter-list>
    ${content.reviews.map((r) => html`<div data-cat="${r.category}">${c.reviewCard(r, catMap.get(r.category))}</div>`)}
  </div>` : c.emptyState('Reviews are coming soon.')}
</div></section>`;
  return layout(ctx, { title: 'All Product Reviews', description: 'Browse every in-depth product review published on ChoiceWise.', url: '/reviews/', section: 'reviews', jsonld: [seo.breadcrumbs(site, crumbs)] }, body);
}

function bestIndex(ctx) {
  const { site, content, catMap } = ctx;
  const crumbs = [HOME_CRUMB, { name: 'Best-of Guides' }];
  const body = html`
${listingHead('Best-of guides', 'Ranked shortlists of the best products in every category, with comparison tables and buying advice.', crumbs)}
<section class="section section--tight"><div class="container">
  ${content.roundups.length ? html`<div class="grid grid--3">${content.roundups.map((r) => c.roundupCard(r, catMap.get(r.category)))}</div>`
    : c.emptyState('Best-of guides are coming soon.')}
</div></section>`;
  return layout(ctx, { title: 'Best-of Guides & Top Picks', description: 'Ranked best-of guides with side-by-side comparisons across every ChoiceWise category.', url: '/best/', section: 'best', jsonld: [seo.breadcrumbs(site, crumbs)] }, body);
}

function authorPage(ctx, author) {
  const { site, content, catMap } = ctx;
  const items = [...content.roundups, ...content.reviews].filter((x) => x.author === author.slug).sort((a, b) => b.updated - a.updated);
  const crumbs = [HOME_CRUMB, { name: 'Authors' }, { name: author.name }];
  const body = html`
<div class="page-head page-head--listing"><div class="container">
  ${c.breadcrumbs(crumbs)}
  <div class="author-hero">${c.avatar(author, 88)}<div>
    <h1 class="page-head__title">${esc(author.name)}</h1>
    <p class="author-hero__role">${esc(author.role)}</p>
    <p class="page-head__lead">${esc(author.bio)}</p>
  </div></div>
</div></div>
<section class="section section--tight"><div class="container">
  ${sectionHead(`Articles by ${author.name}`)}
  ${items.length ? html`<div class="grid grid--3">${items.map((x) => (x.type === 'review' ? c.reviewCard(x, catMap.get(x.category)) : c.roundupCard(x, catMap.get(x.category))))}</div>`
    : c.emptyState('No articles yet.')}
</div></section>`;
  return layout(ctx, {
    title: `${author.name}, ${author.role}`,
    description: author.bio,
    url: `/author/${author.slug}/`,
    jsonld: [seo.breadcrumbs(site, crumbs), { '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: author.name, jobTitle: author.role, description: author.bio } }],
  }, body);
}

function staticPage(ctx, page) {
  const { site } = ctx;
  const crumbs = [HOME_CRUMB, { name: page.title }];
  const body = html`
${listingHead(page.title, page.description, crumbs)}
<div class="container container--narrow section section--tight">
  ${page.updated ? html`<p class="muted small">Last updated <time datetime="${isoDate(page.updated)}">${fmtDate(page.updated)}</time></p>` : ''}
  <div class="prose">${page.html}</div>
</div>`;
  return layout(ctx, { title: page.seoTitle, description: page.description, url: page.url, section: page.slug, jsonld: [seo.breadcrumbs(site, crumbs)] }, body);
}

function searchPage(ctx) {
  const crumbs = [HOME_CRUMB, { name: 'Search' }];
  const body = html`
${listingHead('Search', 'Find reviews, best-of guides and products.', crumbs)}
<section class="section section--tight"><div class="container container--narrow">
  <form class="hero-search hero-search--page" action="/search/" method="get" role="search">
    <label class="sr-only" for="sp-q">Search</label>
    ${icon('search', { size: 20 })}
    <input id="sp-q" name="q" type="search" placeholder="Search products, reviews, guides…" autocomplete="off" data-search-page-input>
    <button class="btn btn--primary" type="submit">Search</button>
  </form>
  <p class="search-summary" data-search-summary aria-live="polite"></p>
  <div class="search-results" data-search-page-results></div>
</div></section>`;
  return layout(ctx, { title: 'Search', description: 'Search ChoiceWise reviews and guides.', url: '/search/', noindex: true }, body);
}

function notFound(ctx) {
  const { content, catMap } = ctx;
  const body = html`
<section class="section notfound"><div class="container container--narrow">
  <p class="notfound__code">404</p>
  <h1 class="page-head__title">We couldn't find that page</h1>
  <p class="page-head__lead">The page may have moved or the link may be outdated. Try searching, or start with one of our most popular guides.</p>
  <form class="hero-search hero-search--page" action="/search/" method="get" role="search">
    <label class="sr-only" for="nf-q">Search</label>${icon('search', { size: 20 })}
    <input id="nf-q" name="q" type="search" placeholder="Search reviews and guides">
    <button class="btn btn--primary" type="submit">Search</button>
  </form>
</div></section>
${content.roundups.length ? html`<section class="section section--alt"><div class="container">
  ${sectionHead('Popular guides')}
  <div class="grid grid--3">${content.roundups.slice(0, 3).map((r) => c.roundupCard(r, catMap.get(r.category)))}</div>
</div></section>` : ''}`;
  return layout(ctx, { title: 'Page not found', description: 'Page not found.', url: '/404.html', noindex: true }, body);
}

function goRedirect(url) {
  const safe = esc(url);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><meta name="referrer" content="strict-origin-when-cross-origin"><title>Redirecting…</title><meta http-equiv="refresh" content="0;url=${safe}"><script>location.replace(${JSON.stringify(url).replace(/</g, '\\u003c')})</script></head><body><p>Redirecting to the retailer… <a href="${safe}" rel="sponsored nofollow">Continue</a></p></body></html>`;
}

module.exports = { home, review, roundup, category, categoriesIndex, reviewsIndex, bestIndex, authorPage, staticPage, searchPage, notFound, goRedirect };
