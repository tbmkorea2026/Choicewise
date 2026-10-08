'use strict';

const { esc, html, fmtDate, isoDate, fmtScore, scoreLabel, initials } = require('../lib/utils');
const { icon } = require('../lib/icons');
const { inlineMarkdown } = require('../lib/markdown');

/* ---------- Brand ---------- */

function logo(site) {
  return html`<a class="logo" href="/" aria-label="${esc(site.name)} home">
    <svg class="logo__mark" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="var(--brand)"/>
      <path d="M9 16.5l4.5 4.5L23 11.5" fill="none" stroke="var(--on-brand)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="logo__text">Wise<span>Choice</span>KR</span>
  </a>`;
}

/* ---------- Ratings ---------- */

function stars(score10, { size = 'md' } = {}) {
  const five = Math.max(0, Math.min(5, (Number(score10) || 0) / 2));
  const pct = (five / 5) * 100;
  return html`<span class="stars stars--${size}" style="--pct:${pct.toFixed(1)}%" role="img" aria-label="Rated ${five.toFixed(1)} out of 5 stars"></span>`;
}

function scoreBadge(score, { size = 'md', showLabel = true } = {}) {
  return html`<div class="score score--${size}" aria-label="Score ${fmtScore(score)} out of 10, ${scoreLabel(score)}">
    <span class="score__num" aria-hidden="true">${fmtScore(score)}</span>
    ${showLabel ? html`<span class="score__label" aria-hidden="true">${scoreLabel(score)}</span>` : ''}
  </div>`;
}

function scoreBars(scores) {
  if (!scores || !scores.length) return '';
  return html`<ul class="score-bars">
    ${scores.map((s) => html`<li class="score-bars__row">
      <span class="score-bars__label">${esc(s.label)}</span>
      <span class="score-bars__track" aria-hidden="true"><span class="score-bars__fill" style="--w:${Math.max(0, Math.min(100, s.value * 10))}%"></span></span>
      <span class="score-bars__value">${fmtScore(s.value)}</span>
    </li>`)}
  </ul>`;
}

/* ---------- Affiliate CTAs ---------- */

function ctaButton(product, { size = 'md', block = false, label } = {}) {
  if (!product.goUrl) return '';
  const text = label || product.ctaLabel;
  return html`<a class="btn btn--cta btn--${size}${block ? ' btn--block' : ''}" href="${product.goUrl}" rel="sponsored nofollow noopener" target="_blank" data-aff="${esc(product.linkId)}" data-product="${esc(product.name)}">
    <span>${esc(text)}</span>${icon('external', { size: 16 })}
  </a>`;
}

/**
 * Discount code with a copy button. `compact` drops the terms line (for cards and bars).
 * data-expires lets the browser hide the code if it expires between builds.
 */
function coupon(product, { compact = false } = {}) {
  const c = product.coupon;
  if (!c || !product.goUrl) return '';
  const verified = c.verified ? new Date(`${c.verified}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';
  const notes = [c.terms, c.expires ? `Expires ${fmtDate(c.expires)}` : '', verified ? `Verified ${verified}` : ''].filter(Boolean);
  return html`<div class="coupon${compact ? ' coupon--compact' : ''}" data-coupon${c.expires ? ` data-expires="${esc(c.expires)}"` : ''}>
    <span class="coupon__label">${icon('tag', { size: 16 })}${esc(c.discount || 'Discount code')}</span>
    <button class="coupon__code" type="button" data-copy="${esc(c.code)}" aria-label="Copy discount code ${esc(c.code)}">
      <span class="coupon__value">${esc(c.code)}</span><span class="coupon__copy" aria-hidden="true">Copy</span>
    </button>
    ${!compact && notes.length ? html`<span class="coupon__terms">${esc(notes.join(' · '))}</span>` : ''}
  </div>`;
}

function ctaBox(product, { title, text } = {}) {
  if (!product.goUrl) return '';
  return html`<aside class="cta-box">
    <img class="cta-box__img" src="${esc(product.image)}" alt="" width="96" height="96" loading="lazy" decoding="async">
    <div class="cta-box__body">
      <p class="cta-box__title">${esc(title || product.name)}</p>
      ${text ? html`<p class="cta-box__text">${esc(text)}</p>` : ''}
      ${product.price ? html`<p class="cta-box__price">From <strong>${esc(product.price)}</strong></p>` : ''}
      ${coupon(product, { compact: true })}
    </div>
    ${ctaButton(product)}
  </aside>`;
}

/* ---------- Lists ---------- */

function prosCons(pros, cons, { compact = false } = {}) {
  if (!(pros && pros.length) && !(cons && cons.length)) return '';
  return html`<div class="pros-cons${compact ? ' pros-cons--compact' : ''}">
    ${pros && pros.length ? html`<div class="pros-cons__col pros-cons__col--pro">
      <p class="pros-cons__title">${icon('thumbsUp', { size: 18 })} Pros</p>
      <ul>${pros.map((p) => html`<li>${icon('check', { size: 18, cls: 'pros-cons__mark' })}<span>${inlineMarkdown(p)}</span></li>`)}</ul>
    </div>` : ''}
    ${cons && cons.length ? html`<div class="pros-cons__col pros-cons__col--con">
      <p class="pros-cons__title">${icon('thumbsDown', { size: 18 })} Cons</p>
      <ul>${cons.map((c) => html`<li>${icon('minus', { size: 18, cls: 'pros-cons__mark' })}<span>${inlineMarkdown(c)}</span></li>`)}</ul>
    </div>` : ''}
  </div>`;
}

function specsTable(specs, { caption } = {}) {
  if (!specs || !specs.length) return '';
  return html`<div class="table-wrap"><table class="specs">
    ${caption ? html`<caption>${esc(caption)}</caption>` : ''}
    <tbody>${specs.map(([k, v]) => html`<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`)}</tbody>
  </table></div>`;
}

function faqList(faqs, { headingId = 'faq', title = 'Frequently asked questions' } = {}) {
  if (!faqs || !faqs.length) return '';
  return html`<section class="faq" aria-labelledby="${headingId}">
    <h2 id="${headingId}">${esc(title)}</h2>
    ${faqs.map((f, i) => html`<details class="faq__item"${i === 0 ? ' open' : ''}>
      <summary><span>${esc(f.q)}</span>${icon('chevronDown', { size: 20, cls: 'faq__chev' })}</summary>
      <div class="faq__answer">${inlineMarkdown(f.a)}</div>
    </details>`)}
  </section>`;
}

/* ---------- Navigation helpers ---------- */

function breadcrumbs(crumbs) {
  return html`<nav class="crumbs" aria-label="Breadcrumb"><ol>
    ${crumbs.map((c, i) => {
      const last = i === crumbs.length - 1;
      return html`<li>${last || !c.url ? html`<span${last ? ' aria-current="page"' : ''}>${esc(c.name)}</span>` : html`<a href="${c.url}">${esc(c.name)}</a>`}${!last ? icon('chevronRight', { size: 14 }) : ''}</li>`;
    })}
  </ol></nav>`;
}

function toc(items, { title = 'On this page' } = {}) {
  if (!items || items.length < 2) return '';
  return html`<nav class="toc" aria-label="Table of contents">
    <p class="toc__title">${icon('list', { size: 16 })} ${esc(title)}</p>
    <ol>${items.map((h) => html`<li class="toc__item toc__item--${h.level || 2}"><a href="#${h.id}">${esc(h.text)}</a></li>`)}</ol>
  </nav>`;
}

/* ---------- People & meta ---------- */

function avatar(author, size = 40) {
  if (author.image) return html`<img class="avatar" src="${esc(author.image)}" alt="" width="${size}" height="${size}" loading="lazy">`;
  return html`<span class="avatar avatar--initials" style="--s:${size}px" aria-hidden="true">${esc(initials(author.name) || 'CW')}</span>`;
}

function byline(item, author) {
  return html`<div class="byline">
    ${avatar(author, 40)}
    <div class="byline__text">
      <span>By <a href="/author/${author.slug}/">${esc(author.name)}</a></span>
      <span class="byline__meta">
        <span>${icon('calendar', { size: 14 })} Updated <time datetime="${isoDate(item.updated)}">${fmtDate(item.updated)}</time></span>
        <span>${icon('clock', { size: 14 })} ${item.readTime} min read</span>
      </span>
    </div>
  </div>`;
}

function authorBox(author) {
  return html`<aside class="author-box" aria-label="About the author">
    ${avatar(author, 64)}
    <div>
      <p class="author-box__eyebrow">Written by</p>
      <p class="author-box__name"><a href="/author/${author.slug}/">${esc(author.name)}</a> <span>· ${esc(author.role)}</span></p>
      <p class="author-box__bio">${esc(author.bio)}</p>
    </div>
  </aside>`;
}

function disclosureNote() {
  return html`<p class="disclosure">${icon('info', { size: 16 })}
    <span>Our picks are based on independent research, and brands can't pay for a spot. We may earn a commission when you buy through links on this page, at no extra cost to you. <a href="/affiliate-disclosure/">Learn more</a></span>
  </p>`;
}

function categoryPill(cat) {
  return html`<a class="pill" href="/category/${cat.slug}/" style="--hue:${cat.hue}">${icon(cat.icon, { size: 14 })}${esc(cat.short || cat.name)}</a>`;
}

/* ---------- Cards ---------- */

function reviewCard(r, cat) {
  return html`<article class="card card--review">
    <a class="card__media" href="${r.url}" tabindex="-1" aria-hidden="true">
      <img src="${esc(r.product.image)}" alt="" width="400" height="300" loading="lazy" decoding="async">
      <span class="card__score">${fmtScore(r.rating)}</span>
    </a>
    <div class="card__body">
      <div class="card__meta">${cat ? categoryPill(cat) : ''}<span class="card__type">Review</span></div>
      <h3 class="card__title"><a href="${r.url}">${esc(r.title)}</a></h3>
      <p class="card__desc">${esc(r.description)}</p>
      <div class="card__foot">
        ${stars(r.rating, { size: 'sm' })}
        <time datetime="${isoDate(r.updated)}">${fmtDate(r.updated)}</time>
      </div>
    </div>
  </article>`;
}

function roundupCard(r, cat) {
  const top = r.products.slice(0, 3);
  return html`<article class="card card--roundup">
    <div class="card__body">
      <div class="card__meta">${cat ? categoryPill(cat) : ''}<span class="card__type">${r.products.length === 2 ? html`${icon('scale', { size: 14 })} Comparison` : html`${icon('trophy', { size: 14 })} Top ${r.products.length}`}</span></div>
      <h3 class="card__title"><a href="${r.url}">${esc(r.title)}</a></h3>
      <ol class="mini-rank">
        ${top.map((p) => html`<li>
          <span class="mini-rank__pos">${p.rank}</span>
          <span class="mini-rank__name">${esc(p.name)}${p.badge ? html`<small>${esc(p.badge)}</small>` : ''}</span>
          ${p.rating ? html`<span class="mini-rank__score">${fmtScore(p.rating)}</span>` : ''}
        </li>`)}
      </ol>
      <div class="card__foot">
        <a class="link-arrow" href="${r.url}">See full ranking ${icon('arrowRight', { size: 16 })}</a>
        <time datetime="${isoDate(r.updated)}">${fmtDate(r.updated)}</time>
      </div>
    </div>
  </article>`;
}

function emptyState(text) {
  return html`<div class="empty">${icon('flask', { size: 28 })}<p>${esc(text)}</p></div>`;
}

module.exports = {
  logo, stars, scoreBadge, scoreBars, ctaButton, coupon, ctaBox, prosCons, specsTable, faqList,
  breadcrumbs, toc, avatar, byline, authorBox, disclosureNote, categoryPill, reviewCard,
  roundupCard, emptyState,
};
