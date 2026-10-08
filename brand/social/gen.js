#!/usr/bin/env node
'use strict';

/**
 * Social post image generator (Instagram/Facebook square + Pinterest vertical).
 *   node brand/social/gen.js brand/social/<brand>.json
 * Renders with headless Chrome. Chrome can't read the app's virtualized Roaming
 * path, so pages and images are staged in %TEMP%\wcsocial and PNGs copied back.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STAGE = path.join(os.tmpdir(), 'wcsocial');
const MARK = 'M30 54 L46 98 L62 66 L76 98 L110 42';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,600;1,6..72,600&display=block');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden}
body{font-family:Inter,sans-serif;color:#fff;background:linear-gradient(150deg,#063d2e 0%,#04281e 60%,#031d16 100%);position:relative;display:flex;flex-direction:column}
.wm{position:absolute;opacity:.05}
.top{display:flex;align-items:center;gap:14px}
.brand{font-family:Newsreader,serif;font-weight:600;letter-spacing:-.01em}
.brand em{font-style:italic;color:#f5a524}
.kicker{display:inline-block;background:#f5a524;color:#04281e;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:999px}
.title{font-family:Newsreader,serif;font-weight:600;line-height:1.08;letter-spacing:-.01em}
.card{background:#fff;border-radius:28px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.card img{max-width:88%;max-height:88%;object-fit:contain}
.chips{display:flex;flex-wrap:wrap;gap:12px}
.chip{border:2px solid rgba(255,255,255,.22);border-radius:999px;font-weight:600;color:#e8f3ee}
.chip b{color:#f5a524}
.url{font-weight:700;letter-spacing:.06em;color:#f5c56b}`;

function logo(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 140 140"><circle cx="70" cy="70" r="70" fill="#f5a524"/><path d="${MARK}" fill="none" stroke="#04281e" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function watermark(style, size) {
  return `<svg class="wm" style="${style}" width="${size}" height="${size}" viewBox="0 0 140 140"><path d="${MARK}" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const chips = (list, fs) => `<div class="chips">${list.map((c) => `<span class="chip" style="font-size:${fs}px;padding:${Math.round(fs * 0.45)}px ${Math.round(fs * 0.9)}px">${c}</span>`).join('')}</div>`;

function square(p, img) {
  return `<!doctype html><meta charset="utf-8"><style>${CSS}</style>
<body style="padding:64px">${watermark('right:-120px;bottom:-140px', 620)}
<div class="top">${logo(54)}<span class="brand" style="font-size:34px">Wise<em>Choice</em>KR</span></div>
<div style="margin-top:34px"><span class="kicker" style="font-size:22px;padding:10px 22px">${esc(p.kicker)}</span></div>
<div class="title" style="font-size:${p.titleSize || 62}px;margin-top:22px">${p.title}</div>
<div class="card" style="flex:1;margin:34px 0 28px">${img ? `<img src="${img}">` : ''}</div>
${chips(p.chips, 26)}
<div class="url" style="font-size:22px;margin-top:22px">WISECHOICEKR.COM</div></body>`;
}

function vertical(p, img) {
  return `<!doctype html><meta charset="utf-8"><style>${CSS}</style>
<body style="padding:70px 64px">${watermark('right:-140px;top:-120px', 640)}
<div class="top">${logo(60)}<span class="brand" style="font-size:38px">Wise<em>Choice</em>KR</span></div>
<div style="margin-top:44px"><span class="kicker" style="font-size:24px;padding:11px 24px">${esc(p.kicker)}</span></div>
<div class="title" style="font-size:${p.pinTitleSize || 74}px;margin-top:26px">${p.title}</div>
<div class="card" style="flex:1;margin:44px 0 36px">${img ? `<img src="${img}">` : ''}</div>
${chips(p.chips, 28)}
<div class="url" style="font-size:26px;margin-top:30px">READ THE FULL REVIEW · WISECHOICEKR.COM</div></body>`;
}

function render(htmlFile, w, h, out) {
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--user-data-dir=${path.join(STAGE, 'prof')}`,
    '--force-device-scale-factor=1', '--virtual-time-budget=8000',
    `--window-size=${w},${h}`, `--screenshot=${out}`, 'file:///' + htmlFile.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });
}

const cfgFile = path.resolve(process.argv[2] || '');
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const outDir = path.join(path.dirname(cfgFile), cfg.slug);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(STAGE, { recursive: true });

for (const p of cfg.posts) {
  let img = '';
  if (p.image) {
    const src = path.join(ROOT, 'src', p.image.replace(/^\//, ''));
    img = path.basename(src);
    fs.copyFileSync(src, path.join(STAGE, img));
  }
  for (const [kind, w, h, tpl] of [['ig', 1080, 1080, square], ['pin', 1000, 1500, vertical]]) {
    const page = tpl(p, img);
    const htmlFile = path.join(STAGE, `${p.id}-${kind}.html`);
    fs.writeFileSync(htmlFile, page);
    const tmpOut = path.join(STAGE, `${p.id}-${kind}.png`);
    render(htmlFile, w, h, tmpOut);
    fs.copyFileSync(tmpOut, path.join(outDir, `${cfg.slug}-${p.id}-${kind}.png`));
    console.log('ok', `${cfg.slug}-${p.id}-${kind}.png`);
  }
}
