'use strict';

const { stripHtml } = require('./utils');

function abs(site, url) {
  if (!url) return site.url;
  if (/^https?:\/\//.test(url)) return url;
  return site.url.replace(/\/$/, '') + url;
}

function organization(site) {
  const sameAs = Object.values(site.social || {}).filter(Boolean);
  return {
    '@type': 'Organization',
    '@id': abs(site, '/#organization'),
    name: site.name,
    url: abs(site, '/'),
    logo: { '@type': 'ImageObject', url: abs(site, '/assets/img/logo-512.png') },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

function website(site) {
  return {
    '@type': 'WebSite',
    '@id': abs(site, '/#website'),
    name: site.name,
    url: abs(site, '/'),
    publisher: { '@id': abs(site, '/#organization') },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: abs(site, '/search/?q={search_term_string}') },
      'query-input': 'required name=search_term_string',
    },
  };
}

function breadcrumbs(site, crumbs) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name, ...(c.url ? { item: abs(site, c.url) } : {}),
    })),
  };
}

function faqPage(faqs) {
  if (!faqs || !faqs.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: stripHtml(f.q),
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.a) },
    })),
  };
}

function person(site, author) {
  return { '@type': author.slug === site.defaultAuthor ? 'Organization' : 'Person', name: author.name, url: abs(site, `/author/${author.slug}/`) };
}

function reviewProduct(site, review, author) {
  const p = review.product;
  return {
    '@type': 'Product',
    name: p.name,
    ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
    image: abs(site, p.image),
    description: review.description,
    review: {
      '@type': 'Review',
      name: review.title,
      author: person(site, author),
      datePublished: review.date.toISOString(),
      reviewBody: review.verdict || review.description,
      publisher: { '@id': abs(site, '/#organization') },
      reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 10, worstRating: 0 },
      ...(review.pros.length ? { positiveNotes: notes(review.pros) } : {}),
      ...(review.cons.length ? { negativeNotes: notes(review.cons) } : {}),
    },
  };
}

function notes(list) {
  return {
    '@type': 'ItemList',
    itemListElement: list.map((n, i) => ({ '@type': 'ListItem', position: i + 1, name: stripHtml(n) })),
  };
}

function article(site, item, author, image) {
  return {
    '@type': 'Article',
    headline: item.title,
    description: item.description,
    image: abs(site, image),
    datePublished: item.date.toISOString(),
    dateModified: item.updated.toISOString(),
    author: person(site, author),
    publisher: { '@id': abs(site, '/#organization') },
    mainEntityOfPage: abs(site, item.url),
  };
}

function itemList(site, roundup) {
  return {
    '@type': 'ItemList',
    name: roundup.title,
    numberOfItems: roundup.products.length,
    itemListElement: roundup.products.map((p) => ({
      '@type': 'ListItem',
      position: p.rank,
      name: p.name,
      url: abs(site, `${roundup.url}#pick-${p.rank}`),
    })),
  };
}

function graph(nodes) {
  const list = nodes.filter(Boolean);
  if (!list.length) return '';
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': list }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

module.exports = { abs, organization, website, breadcrumbs, faqPage, reviewProduct, article, itemList, graph };
