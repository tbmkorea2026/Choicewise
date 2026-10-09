#!/usr/bin/env node
'use strict';

/**
 * YouTube Shorts generator: slides (headless Chrome) + AI voice (Microsoft Edge neural TTS) → 1080×1920 MP4.
 *   cd brand/video && node short.js shorts/<name>.json
 * Output: brand/video/out/<name>.mp4 (+ <name>-thumb.png). Needs FFmpeg (winget Gyan.FFmpeg) and `npm install` here.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const ROOT = path.join(__dirname, '..', '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STAGE = path.join(os.tmpdir(), 'wcshort');
const MARK = 'M30 54 L46 98 L62 66 L76 98 L110 42';
const W = 1080;
const H = 1920;
const FPS = 30;

function findFfmpeg() {
  const base = path.join(os.homedir(), 'AppData/Local/Microsoft/WinGet/Packages');
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base).filter((n) => n.startsWith('Gyan.FFmpeg'))) {
      for (const sub of fs.readdirSync(path.join(base, d))) {
        const bin = path.join(base, d, sub, 'bin');
        if (fs.existsSync(path.join(bin, 'ffmpeg.exe'))) return bin;
      }
    }
  }
  return '';
}
const FFBIN = findFfmpeg();
const ffmpeg = (args) => execFileSync(path.join(FFBIN, 'ffmpeg.exe'), ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
const duration = (file) => parseFloat(execFileSync(path.join(FFBIN, 'ffprobe.exe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,600;1,6..72,600&display=block');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{font-family:Inter,sans-serif;color:#fff;background:linear-gradient(160deg,#063d2e 0%,#04281e 60%,#031d16 100%);position:relative;display:flex;flex-direction:column;padding:130px 110px 420px}
.wm{position:absolute;opacity:.05;right:-160px;bottom:120px}
.top{display:flex;align-items:center;gap:16px}
.brand{font-family:Newsreader,serif;font-weight:600;font-size:44px}
.brand em{font-style:italic;color:#f5a524}
.step{margin-left:auto;font-weight:700;font-size:30px;color:#f5c56b;letter-spacing:.08em}
.kicker{display:inline-block;background:#f5a524;color:#04281e;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;font-size:30px;padding:14px 30px;margin-top:70px;align-self:flex-start}
.kicker.warn{background:#ff6b5a;color:#fff}
.title{font-family:Newsreader,serif;font-weight:600;line-height:1.06;letter-spacing:-.01em;margin-top:34px}
.cards{display:flex;gap:28px;flex:1;margin:56px 0 0;min-height:0}
.card{flex:1;background:#fff;border-radius:36px;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:24px}
.card img{max-width:100%;max-height:100%;object-fit:contain;min-height:0;flex:1}
.card span{color:#04281e;font-weight:800;font-size:34px;margin-top:12px}
.bullets{list-style:none;margin-top:56px;display:grid;gap:26px}
.bullets li{font-size:46px;font-weight:600;line-height:1.25;padding-left:64px;position:relative;color:#eef7f2}
.bullets li:before{content:"";position:absolute;left:0;top:14px;width:34px;height:34px;border-radius:50%;background:#f5a524}
.bullets.warn li:before{background:#ff6b5a}
.bullets b{color:#f5c56b}
.url{position:absolute;left:110px;right:110px;bottom:330px;font-weight:800;font-size:40px;letter-spacing:.06em;color:#f5c56b;text-align:center}`;

const logo = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 140 140"><circle cx="70" cy="70" r="70" fill="#f5a524"/><path d="${MARK}" fill="none" stroke="#04281e" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const wm = `<svg class="wm" width="760" height="760" viewBox="0 0 140 140"><path d="${MARK}" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function slide(s, i, n, imgs) {
  const warn = s.tone === 'warn';
  const cards = imgs.length
    ? `<div class="cards">${imgs.map((src, k) => `<div class="card"><img src="${src}">${s.labels && s.labels[k] ? `<span>${esc(s.labels[k])}</span>` : ''}</div>`).join('')}</div>`
    : '';
  const bullets = s.bullets ? `<ul class="bullets${warn ? ' warn' : ''}">${s.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>` : '';
  return `<!doctype html><meta charset="utf-8"><style>${CSS}</style><body>${wm}
<div class="top">${logo(70)}<span class="brand">Wise<em>Choice</em>KR</span><span class="step">${i + 1}/${n}</span></div>
${s.kicker ? `<span class="kicker${warn ? ' warn' : ''}">${esc(s.kicker)}</span>` : ''}
<div class="title" style="font-size:${s.titleSize || 92}px">${s.title || ''}</div>
${bullets}${cards}
${s.url ? `<div class="url">${esc(s.url)}</div>` : ''}</body>`;
}

function render(htmlFile, out) {
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--user-data-dir=${path.join(STAGE, 'prof')}`,
    '--force-device-scale-factor=1', '--virtual-time-budget=8000',
    `--window-size=${W},${H}`, `--screenshot=${out}`, 'file:///' + htmlFile.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });
}

async function speak(tts, text, outFile, rate) {
  const dir = path.join(STAGE, 'tts-' + path.basename(outFile, '.mp3'));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const { audioFilePath } = await tts.toFile(dir, esc(text), { rate });
  fs.copyFileSync(audioFilePath, outFile);
}

(async () => {
  if (!FFBIN) throw new Error('FFmpeg not found (winget install Gyan.FFmpeg)');
  const cfgFile = path.resolve(process.argv[2] || '');
  const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  const name = path.basename(cfgFile, '.json');
  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  fs.rmSync(STAGE, { recursive: true, force: true });
  fs.mkdirSync(STAGE, { recursive: true });

  const tts = new MsEdgeTTS();
  await tts.setMetadata(cfg.voice || 'en-US-AndrewNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const clips = [];
  const n = cfg.scenes.length;
  for (let i = 0; i < n; i++) {
    const s = cfg.scenes[i];
    const imgs = (s.images || []).map((p) => {
      const src = path.join(ROOT, 'src', p.replace(/^\//, ''));
      fs.copyFileSync(src, path.join(STAGE, path.basename(src)));
      return path.basename(src);
    });
    const html = path.join(STAGE, `s${i}.html`);
    fs.writeFileSync(html, slide(s, i, n, imgs));
    const png = path.join(STAGE, `s${i}.png`);
    render(html, png);
    if (i === 0) fs.copyFileSync(png, path.join(outDir, `${name}-thumb.png`));

    const mp3 = path.join(STAGE, `s${i}.mp3`);
    await speak(tts, s.say, mp3, cfg.rate || '+6%');
    const dur = duration(mp3) + (s.pause ?? 0.45);
    const frames = Math.ceil(dur * FPS);
    const clip = path.join(STAGE, `s${i}.mp4`);
    // Slow push-in so still slides don't feel static.
    ffmpeg([
      '-loop', '1', '-i', png, '-i', mp3,
      '-filter_complex', `[0:v]scale=${W * 2}:${H * 2},zoompan=z='min(zoom+0.0005,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},format=yuv420p[v];[1:a]apad,atrim=0:${dur.toFixed(3)},aresample=44100[a]`,
      '-map', '[v]', '-map', '[a]', '-t', dur.toFixed(3),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-ac', '2', clip,
    ]);
    clips.push(clip);
    console.log(`scene ${i + 1}/${n}: ${dur.toFixed(1)}s`);
  }
  tts.close();

  const list = path.join(STAGE, 'list.txt');
  fs.writeFileSync(list, clips.map((c) => `file '${c.replace(/\\/g, '/')}'`).join('\n'));
  const out = path.join(outDir, `${name}.mp4`);
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  console.log(`✔ ${path.relative(ROOT, out)} (${duration(out).toFixed(1)}s)`);
})().catch((e) => { console.error('✖', e.message); process.exit(1); });
