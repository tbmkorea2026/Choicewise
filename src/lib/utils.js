'use strict';

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape a value for safe use in HTML text or attributes. */
function esc(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

/**
 * Tagged template for HTML. Arrays are joined, null/undefined/false render as
 * nothing. Values are NOT escaped automatically — call esc() on user content.
 */
function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += renderValue(values[i]) + strings[i + 1];
  }
  return out;
}

function renderValue(v) {
  if (v === undefined || v === null || v === false) return '';
  if (Array.isArray(v)) return v.map(renderValue).join('');
  return String(v);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(value) {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function isoDate(value) {
  const d = toDate(value);
  return d ? d.toISOString().slice(0, 10) : '';
}

function scoreLabel(score) {
  const s = Number(score) || 0;
  if (s >= 9.5) return 'Outstanding';
  if (s >= 9.0) return 'Excellent';
  if (s >= 8.5) return 'Very Good';
  if (s >= 8.0) return 'Good';
  if (s >= 7.0) return 'Fair';
  return 'Mixed';
}

function fmtScore(score) {
  const s = Number(score);
  return Number.isFinite(s) ? s.toFixed(1) : '–';
}

function readingTime(text) {
  const words = String(text || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

function stripHtml(s) {
  return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function truncate(s, n) {
  const t = stripHtml(s);
  return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t;
}

function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

module.exports = {
  esc, html, slugify, toDate, fmtDate, isoDate, scoreLabel, fmtScore,
  readingTime, stripHtml, truncate, initials,
};
