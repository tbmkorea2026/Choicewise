#!/usr/bin/env node
'use strict';

/**
 * Scaffold a new article as a draft.
 *
 *   npm run new review "Dyson V15 Detect" -- --category home-kitchen
 *   npm run new best "Best Air Purifiers" -- --category home-kitchen
 */

const fs = require('fs');
const path = require('path');
const { slugify } = require('../src/lib/utils');

const ROOT = path.resolve(__dirname, '..');
const categories = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/categories.json'), 'utf8')).map((c) => c.slug);

const args = process.argv.slice(2);
const type = args[0];
const name = args[1];
const catIdx = args.indexOf('--category');
const category = catIdx > -1 ? args[catIdx + 1] : '';
const today = new Date().toISOString().slice(0, 10);

function usage(msg) {
  if (msg) console.error(`✖ ${msg}\n`);
  console.log('Usage:\n  npm run new review "Product Name" -- --category <slug>\n  npm run new best "Best Things" -- --category <slug>\n');
  console.log(`Categories: ${categories.join(', ')}`);
  process.exit(1);
}

if (!['review', 'best'].includes(type) || !name) usage();
if (!categories.includes(category)) usage(`Unknown or missing --category "${category || ''}"`);

const review = `---
title: "${name} Review: <one-line verdict>"
description: "<150–160 characters: who it's for, the key strength, and the score.>"
category: ${category}
author: editorial-team
date: ${today}
updated: ${today}
draft: true
rating: 8.8
product:
  name: "${name}"
  brand: ""
  image: ""              # /assets/img/products/your-image.webp (4:3 ratio works best)
  price: "$0"
  merchant: "Amazon"
  link: "https://example.com/your-affiliate-link"
  linkId: ${slugify(name)}   # cloaked URL becomes /go/${slugify(name)}/
bestFor:
  - "Who should buy this"
scores:
  Performance: 9.0
  Build Quality: 8.5
  Ease of Use: 9.0
  Value: 8.5
verdict: "<2–3 sentence bottom line.>"
pros:
  - ""
cons:
  - ""
specs:
  Dimensions: ""
  Weight: ""
  Warranty: ""
faqs:
  - q: ""
    a: ""
---

## Overview

Write the introduction here.

{{cta}}

## Performance

## Design and build quality

## Is it worth it?
`;

const best = `---
title: "The 5 ${name.replace(/^best\s+/i, 'Best ')} of {{year}}"
description: "<150–160 characters summarising the ranking and who it helps.>"
category: ${category}
author: editorial-team
date: ${today}
updated: ${today}
draft: true
featured: false
intro: |
  Short introduction shown above the comparison table (1–2 paragraphs).
products:
  - name: "Product One"
    badge: "Best Overall"
    rating: 9.4
    price: "$0"
    merchant: "Amazon"
    link: "https://example.com/affiliate-1"
    image: ""
    bestFor: "Most people"
    summary: "Why it wins in one or two sentences."
    pros: [""]
    cons: [""]
    specs:
      Key spec: ""
  - name: "Product Two"
    badge: "Best Value"
    rating: 9.0
    price: "$0"
    merchant: "Amazon"
    link: "https://example.com/affiliate-2"
    bestFor: "Budget buyers"
    summary: ""
    pros: [""]
    cons: [""]
faqs:
  - q: ""
    a: ""
---

## How we chose

## Buying guide
`;

const dir = path.join(ROOT, 'content', type === 'review' ? 'reviews' : 'best');
const slug = type === 'review' ? `${slugify(name)}-review` : slugify(name);
const file = path.join(dir, `${slug}.md`);
if (fs.existsSync(file)) usage(`${path.relative(ROOT, file)} already exists`);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(file, type === 'review' ? review : best);
console.log(`✔ Created ${path.relative(ROOT, file)} (draft: true — visible in npm run dev, hidden from production until you remove it)`);
