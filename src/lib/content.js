'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { slugify, toDate, readingTime } = require('./utils');

const YEAR = String(new Date().getUTCFullYear());
const MONTH = new Date().toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });

/** Replace {{year}} / {{month}} tokens so evergreen titles stay current on every build. */
function tokens(text) {
  return String(text)
    .replace(/\{\{\s*year\s*\}\}/g, YEAR)
    .replace(/\{\{\s*month\s*\}\}/g, MONTH);
}

function readMarkdownDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((file) => {
      const raw = tokens(fs.readFileSync(path.join(dir, file), 'utf8'));
      const { data, content } = matter(raw);
      return { file: path.join(dir, file), slug: data.slug || slugify(file.replace(/\.md$/, '')), data, body: content };
    });
}

class LinkRegistry {
  constructor() { this.links = new Map(); this.warnings = []; }

  /** Register an affiliate URL and return its cloaked /go/ path. */
  add(id, url, source) {
    if (!url) return '';
    const key = slugify(id);
    const existing = this.links.get(key);
    if (existing && existing.url !== url) {
      this.warnings.push(`Link id "${key}" points to two different URLs (${existing.source} and ${source}). Using the first.`);
    } else if (!existing) {
      this.links.set(key, { url, source });
    }
    return `/go/${key}/`;
  }
}

function asList(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function asSpecs(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((s) => (Array.isArray(s) ? s : [s.label, s.value]));
  return Object.entries(v);
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; }
}

function isoDay(v) {
  if (!v) return '';
  return v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
}

/**
 * Pick the coupon for a product: a product-level `coupon:` in front matter wins
 * (`coupon: false` hides one), otherwise a coupon from src/data/coupons.json whose
 * `store` matches the affiliate link's domain. Expired coupons are dropped at build
 * time, and the browser hides any that expire between builds.
 */
function resolveCoupon(product, coupons, today) {
  if (product.coupon === false || !product.link) return null;
  const host = hostOf(product.link);
  const c = product.coupon
    || coupons.find((x) => x.code && host && (host === x.store || host.endsWith(`.${x.store}`)));
  if (!c || !c.code) return null;
  const expires = isoDay(c.expires);
  if (expires && expires < today) return null;
  return {
    code: String(c.code),
    discount: c.discount || '',
    terms: c.terms || '',
    expires,
    verified: isoDay(c.verified),
  };
}

function normalizeProduct(p, { category, registry, source, fallbackLabel, coupons = [], today = '' }) {
  const product = p || {};
  const linkId = product.linkId || slugify(product.name);
  return {
    name: product.name || 'Untitled product',
    brand: product.brand || '',
    image: product.image || `/assets/img/ph/${category}.svg`,
    hasImage: Boolean(product.image),
    price: product.price || '',
    merchant: product.merchant || '',
    ctaLabel: product.ctaLabel || (product.merchant ? `Check Price on ${product.merchant}` : fallbackLabel),
    goUrl: registry.add(linkId, product.link, source),
    linkId,
    rating: Number(product.rating) || null,
    badge: product.badge || '',
    summary: product.summary || '',
    bestFor: product.bestFor || '',
    pros: asList(product.pros),
    cons: asList(product.cons),
    specs: asSpecs(product.specs),
    review: product.review || '',
    coupon: resolveCoupon(product, coupons, today),
  };
}

/** "The 5 Best Robot Vacuums of 2026: Tested" → "Best Robot Vacuums" */
function shortTitleOf(title) {
  return String(title || '')
    .split(/[:(—|]/)[0]
    .replace(/^the\s+(\d+\s+)?/i, '')
    .replace(/\s+(of|in|for)\s+\d{4}.*$/i, '')
    .replace(/\s+\d{4}$/, '')
    .trim();
}

function validate(item, required) {
  const missing = required.filter((k) => item.data[k] === undefined || item.data[k] === '');
  if (missing.length) throw new Error(`${path.basename(item.file)} is missing required field(s): ${missing.join(', ')}`);
}

function loadContent(rootDir, { site, categories, authors, coupons = [], includeDrafts = false }) {
  const registry = new LinkRegistry();
  const today = new Date().toISOString().slice(0, 10);
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const authorSlugs = new Set(authors.map((a) => a.slug));
  const ctaLabel = site.defaultCtaLabel || 'Check Price';
  // Drop drafts before normalising so their affiliate links never reach production.
  const isPublished = (item) => includeDrafts || !item.data.draft;

  const common = (item, type, base) => {
    const d = item.data;
    if (!categorySlugs.has(d.category)) {
      throw new Error(`${path.basename(item.file)}: unknown category "${d.category}". Use one of: ${[...categorySlugs].join(', ')}`);
    }
    const author = d.author && authorSlugs.has(d.author) ? d.author : site.defaultAuthor;
    const date = toDate(d.date) || new Date();
    return {
      type,
      slug: item.slug,
      url: `/${base}/${item.slug}/`,
      title: d.title,
      shortTitle: d.shortTitle || shortTitleOf(d.title),
      seoTitle: d.seoTitle || d.title,
      description: d.description || '',
      category: d.category,
      author,
      date,
      updated: toDate(d.updated) || date,
      featured: Boolean(d.featured),
      draft: Boolean(d.draft),
      faqs: asList(d.faqs),
      body: item.body,
      readTime: readingTime(item.body),
      source: item.file,
    };
  };

  const reviews = readMarkdownDir(path.join(rootDir, 'reviews')).filter(isPublished).map((item) => {
    validate(item, ['title', 'category', 'product', 'rating']);
    const base = common(item, 'review', 'reviews');
    const d = item.data;
    return {
      ...base,
      product: normalizeProduct({ ...d.product, rating: d.rating }, { category: d.category, registry, source: item.file, fallbackLabel: ctaLabel, coupons, today }),
      rating: Number(d.rating),
      scores: Object.entries(d.scores || {}).map(([label, value]) => ({ label, value: Number(value) })),
      verdict: d.verdict || '',
      bestFor: asList(d.bestFor),
      pros: asList(d.pros),
      cons: asList(d.cons),
      specs: asSpecs(d.specs),
    };
  });

  const roundups = readMarkdownDir(path.join(rootDir, 'best')).filter(isPublished).map((item) => {
    validate(item, ['title', 'category', 'products']);
    const base = common(item, 'roundup', 'best');
    const d = item.data;
    const products = asList(d.products).map((p, i) => ({
      rank: i + 1,
      ...normalizeProduct(p, { category: d.category, registry, source: item.file, fallbackLabel: ctaLabel, coupons, today }),
    }));
    return {
      ...base,
      intro: d.intro || '',
      products,
      criteria: asList(d.criteria),
    };
  });

  const pages = readMarkdownDir(path.join(rootDir, 'pages')).map((item) => ({
    type: 'page',
    slug: item.slug,
    url: `/${item.slug}/`,
    title: item.data.title,
    seoTitle: item.data.seoTitle || item.data.title,
    description: item.data.description || '',
    updated: toDate(item.data.updated),
    body: item.body,
    source: item.file,
  }));

  const keep = (x) => includeDrafts || !x.draft;
  const byDate = (a, b) => b.updated - a.updated;

  // Link products inside roundups to their full reviews (by explicit slug or matching name).
  const reviewByName = new Map(reviews.map((r) => [slugify(r.product.name), r]));
  const reviewBySlug = new Map(reviews.map((r) => [r.slug, r]));
  for (const r of roundups) {
    for (const p of r.products) {
      const rev = reviewBySlug.get(p.review) || reviewByName.get(slugify(p.name));
      p.reviewUrl = rev && keep(rev) ? rev.url : '';
    }
  }

  return {
    reviews: reviews.filter(keep).sort(byDate),
    roundups: roundups.filter(keep).sort(byDate),
    pages,
    links: registry.links,
    warnings: registry.warnings,
  };
}

module.exports = { loadContent, YEAR };
