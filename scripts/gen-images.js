#!/usr/bin/env node
'use strict';

/**
 * Generates brand PNGs (logo, apple-touch-icon, default social image) with zero dependencies.
 * Run once: node scripts/gen-images.js  — outputs into src/assets/img/.
 * Replace og-default.png with a designed 1200×630 image whenever you like.
 *
 * SUPERSEDED: the current W-tick brand images are rendered from brand/src/*.html
 * (logo-512, touch-icon, og). Running this script would overwrite them with the old
 * tick-in-square design, so it now refuses unless called with --force.
 */
if (!process.argv.includes('--force')) {
  console.error('gen-images.js is superseded by brand/src (see header). Pass --force to run anyway.');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'src', 'assets', 'img');
const BRAND = [11, 107, 79];
const BRAND_DARK = [8, 60, 46];
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5);
      const i = y * (w * 4 + 1) + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const clamp = (v) => Math.max(0, Math.min(1, v));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function roundRectCoverage(x, y, x0, y0, size, r) {
  const cx = Math.min(Math.max(x, x0 + r), x0 + size - r);
  const cy = Math.min(Math.max(y, y0 + r), y0 + size - r);
  const d = Math.hypot(x - cx, y - cy) - r;
  return clamp(0.5 - d);
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** The WiseChoiceKR mark (rounded square + check), defined on a 32-unit grid. */
function markLayer(x, y, ox, oy, size) {
  const s = size / 32;
  const bg = roundRectCoverage(x, y, ox, oy, size, 9 * s);
  const ux = (x - ox) / s, uy = (y - oy) / s;
  const d = Math.min(segDist(ux, uy, 9, 16.5, 13.5, 21), segDist(ux, uy, 13.5, 21, 23, 11.5));
  const check = clamp((1.6 - d) * s + 0.5);
  return { bg, check };
}

function icon(size) {
  return png(size, size, (x, y) => {
    const { bg, check } = markLayer(x, y, 0, 0, size);
    const col = mix(BRAND, WHITE, check);
    return [...col, Math.round(bg * 255)];
  });
}

function og() {
  const W = 1200, H = 630, M = 240;
  const ox = (W - M) / 2, oy = (H - M) / 2;
  return png(W, H, (x, y) => {
    const t = (x / W) * 0.6 + (y / H) * 0.4;
    let col = mix(BRAND_DARK, BRAND, t);
    const glow = clamp(1 - Math.hypot(x - W * 0.8, y - H * 0.1) / 520) * 0.18;
    col = mix(col, WHITE, glow);
    const { bg, check } = markLayer(x, y, ox, oy, M);
    if (bg > 0) {
      const markCol = mix(WHITE, BRAND, check);
      col = mix(col, markCol, bg);
    }
    return [...col, 255];
  });
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'logo-512.png'), icon(512));
fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), icon(180));
fs.writeFileSync(path.join(OUT, 'og-default.png'), og());
console.log('✔ Generated logo-512.png, apple-touch-icon.png and og-default.png in src/assets/img/');
