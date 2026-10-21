#!/usr/bin/env node
'use strict';

/**
 * Upload and schedule a Short through the YouTube Data API (no extra npm packages).
 *   cd brand/video
 *   node yt-upload.js auth                                        one-time sign-in (opens the browser)
 *   node yt-upload.js shorts/<name>.json --at "2026-10-24 19:00"  upload out/<name>.mp4, public at that KST time
 *   node yt-upload.js shorts/<name>.json --private                upload as private, no schedule
 *   node yt-upload.js shorts/<name>.json --at "..." --dry-run     print what would be sent, upload nothing
 *   node yt-upload.js scheduled                                   list videos waiting for their publish time
 * Needs brand/video/.youtube/client_secret.json (OAuth "Desktop app" client from Google Cloud).
 * Tokens go to brand/video/.youtube/token.json. That folder is gitignored: never commit it.
 * Until the API project passes Google's audit, YouTube locks API uploads to private, so a schedule won't go public.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { execFile } = require('child_process');

const DIR = path.join(__dirname, '.youtube');
const SECRET = path.join(DIR, 'client_secret.json');
const TOKEN = path.join(DIR, 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'];
const API = 'https://www.googleapis.com/youtube/v3';
const CATEGORY = '22'; // People & Blogs

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function readClient() {
  if (!fs.existsSync(SECRET)) fail(`Missing ${SECRET}. Download the OAuth client JSON (Desktop app) from Google Cloud and save it there.`);
  const j = JSON.parse(fs.readFileSync(SECRET, 'utf8'));
  const c = j.installed || j.web;
  if (!c) fail('client_secret.json must be an OAuth client of type "Desktop app".');
  return c;
}

async function postForm(url, params) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) });
  const body = await res.json();
  if (!res.ok) fail(`${url} → ${res.status} ${JSON.stringify(body)}`);
  return body;
}

// ---- auth: installed-app loopback flow with PKCE ----
async function auth() {
  const c = readClient();
  const verifier = crypto.randomBytes(48).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname !== '/') return res.end();
      const ok = u.searchParams.get('state') === state && u.searchParams.get('code');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(ok ? '<h2>WiseChoiceKR: signed in. You can close this tab.</h2>' : '<h2>Sign-in failed. Check the terminal.</h2>');
      server.close();
      ok ? resolve(ok) : reject(new Error(u.searchParams.get('error') || 'state mismatch'));
    });
    server.listen(0, '127.0.0.1', () => {
      const redirect = `http://127.0.0.1:${server.address().port}`;
      const url = `${c.auth_uri}?${new URLSearchParams({
        client_id: c.client_id,
        redirect_uri: redirect,
        response_type: 'code',
        scope: SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      })}`;
      console.log('Sign in with the account that owns @WiseChoiceKR (contact@wisechoicekr.com):\n' + url);
      execFile('cmd', ['/c', 'start', '', url.replace(/&/g, '^&')]);
      auth.redirect = redirect;
    });
  });

  const tok = await postForm(c.token_uri, {
    code,
    client_id: c.client_id,
    client_secret: c.client_secret,
    redirect_uri: auth.redirect,
    grant_type: 'authorization_code',
    code_verifier: verifier,
  });
  if (!tok.refresh_token) fail('No refresh token returned. Remove the app at myaccount.google.com/permissions and run auth again.');
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(TOKEN, JSON.stringify({ refresh_token: tok.refresh_token }, null, 2));
  const me = await api('GET', '/channels?part=snippet&mine=true', null, tok.access_token);
  const ch = me.items && me.items[0];
  console.log(`✓ Signed in. Channel: ${ch ? `${ch.snippet.title} (${ch.id})` : 'none found'}`);
}

async function accessToken() {
  if (!fs.existsSync(TOKEN)) fail('Not signed in. Run: node yt-upload.js auth');
  const c = readClient();
  const { refresh_token } = JSON.parse(fs.readFileSync(TOKEN, 'utf8'));
  const tok = await postForm(c.token_uri, { refresh_token, client_id: c.client_id, client_secret: c.client_secret, grant_type: 'refresh_token' });
  return tok.access_token;
}

async function api(method, p, body, token) {
  const res = await fetch(API + p, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`${method} ${p} → ${res.status} ${JSON.stringify(j.error || j)}`);
    err.status = res.status;
    throw err;
  }
  return j;
}

// ---- upload ----
function parseAt(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(s || '');
  if (!m) fail('--at must look like "2026-10-24 19:00" (KST).');
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+09:00`;
  if (new Date(iso) <= new Date(Date.now() + 15 * 60 * 1000)) fail(`--at ${s} KST is not at least 15 minutes in the future.`);
  return new Date(iso).toISOString();
}

function buildMeta(spec, publishAt) {
  const yt = spec.youtube || {};
  const title = String(yt.title || '').trim();
  const description = String(yt.description || '').trim();
  if (!title) fail('youtube.title is empty in the JSON.');
  if (title.length > 100) fail(`youtube.title is ${title.length} chars (max 100).`);
  if (/[<>]/.test(title + description)) fail('YouTube rejects "<" and ">" in the title/description.');
  if (description.length > 5000) fail('youtube.description is over 5000 chars.');
  if (!/AI voice/i.test(description)) console.warn('! The description has no "Narrated with an AI voice." line.');
  return {
    snippet: { title, description, categoryId: CATEGORY, defaultLanguage: 'en', defaultAudioLanguage: 'en' },
    status: {
      privacyStatus: 'private',
      ...(publishAt ? { publishAt } : {}),
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: true, // AI voice
    },
    paidProductPlacementDetails: { hasPaidProductPlacement: true }, // affiliate links
  };
}

async function startUpload(meta, size, token) {
  const parts = Object.keys(meta).join(',');
  const res = await fetch(`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=${parts}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': String(size),
    },
    body: JSON.stringify(meta),
  });
  if (!res.ok) {
    const err = new Error(`start upload → ${res.status} ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  return res.headers.get('location');
}

async function upload(jsonPath, args) {
  const specFile = path.resolve(jsonPath);
  if (!fs.existsSync(specFile)) fail(`Not found: ${jsonPath}`);
  const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  const name = path.basename(specFile, '.json');
  const video = path.join(__dirname, 'out', `${name}.mp4`);
  if (!fs.existsSync(video)) fail(`Not rendered yet: ${video}. Run: node short.js ${jsonPath}`);

  const atIdx = args.indexOf('--at');
  const publishAt = atIdx >= 0 ? parseAt(args[atIdx + 1]) : null;
  if (!publishAt && !args.includes('--private')) fail('Pass --at "YYYY-MM-DD HH:MM" (KST) or --private.');
  let meta = buildMeta(spec, publishAt);
  const size = fs.statSync(video).size;

  if (args.includes('--dry-run')) {
    console.log(JSON.stringify({ video, sizeMB: +(size / 1e6).toFixed(1), meta }, null, 2));
    return;
  }

  const token = await accessToken();
  let session;
  try {
    session = await startUpload(meta, size, token);
  } catch (e) {
    if (e.status !== 400) throw e;
    // Fall back if the API refuses the paid-promotion part; then tick it in Studio by hand.
    console.warn(`! ${e.message}\n! Retrying without paidProductPlacementDetails: tick "paid promotion" in Studio afterwards.`);
    const { paidProductPlacementDetails, ...rest } = meta;
    meta = rest;
    session = await startUpload(meta, size, token);
  }

  console.log(`Uploading ${path.basename(video)} (${(size / 1e6).toFixed(1)} MB)…`);
  const res = await fetch(session, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'video/mp4', 'Content-Length': String(size) },
    body: fs.readFileSync(video),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) fail(`upload → ${res.status} ${JSON.stringify(out)}`);

  const st = out.status || {};
  console.log(`✓ Uploaded: https://youtube.com/shorts/${out.id}`);
  console.log(`  privacy=${st.privacyStatus} publishAt=${st.publishAt || '-'} madeForKids=${st.selfDeclaredMadeForKids}`);
  if (publishAt && !st.publishAt) console.warn('! YouTube dropped the schedule. If the project is not audited yet, the video stays private: set the time in Studio.');
  if (out.status && out.status.uploadStatus === 'rejected') console.warn(`! Rejected: ${out.status.rejectionReason}`);
}

// ---- scheduled: list uploads still waiting for their publish time ----
async function scheduled() {
  const token = await accessToken();
  const ch = await api('GET', '/channels?part=contentDetails&mine=true', null, token);
  const uploads = ch.items[0].contentDetails.relatedPlaylists.uploads;
  const pl = await api('GET', `/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}`, null, token);
  const ids = pl.items.map((i) => i.contentDetails.videoId).join(',');
  if (!ids) return console.log('No uploads.');
  const v = await api('GET', `/videos?part=snippet,status&id=${ids}`, null, token);
  const rows = v.items
    .filter((x) => x.status.publishAt && new Date(x.status.publishAt) > new Date())
    .sort((a, b) => a.status.publishAt.localeCompare(b.status.publishAt));
  if (!rows.length) return console.log('Nothing scheduled.');
  const kst = (iso) => new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
  for (const x of rows) console.log(`${kst(x.status.publishAt)} KST  ${x.snippet.title}`);
}

(async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'auth') return auth();
  if (cmd === 'scheduled') return scheduled();
  if (cmd && cmd.endsWith('.json')) return upload(cmd, rest);
  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
})().catch((e) => fail(e.message));
