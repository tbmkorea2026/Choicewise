/* WiseChoiceKR — progressive enhancement. The site works without JS. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var root = document.documentElement;

  /* ---------- Theme ---------- */
  var themeBtn = $('[data-theme-toggle]');
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncThemeLabel() {
    if (themeBtn) themeBtn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if (themeBtn) {
    syncThemeLabel();
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('cw-theme', next); } catch (e) { /* storage unavailable */ }
      syncThemeLabel();
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = $('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = $('[data-nav-toggle]');
  var nav = $('#main-nav');
  function setNav(open) {
    if (!navToggle || !nav) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () { setNav(navToggle.getAttribute('aria-expanded') !== 'true'); });
  }

  /* ---------- Categories dropdown ---------- */
  var dd = $('[data-dropdown]');
  var menu = dd && document.getElementById(dd.getAttribute('aria-controls'));
  function setMenu(open) {
    if (!dd || !menu) return;
    dd.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  }
  if (dd && menu) {
    dd.addEventListener('click', function (e) { e.stopPropagation(); setMenu(menu.hidden); });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (menu && !menu.hidden) { setMenu(false); dd.focus(); }
      if (nav && nav.classList.contains('is-open')) { setNav(false); navToggle.focus(); }
    }
  });

  /* ---------- Search ---------- */
  var indexPromise = null;
  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch('/search-index.json').then(function (r) { return r.json(); }).catch(function () { indexPromise = null; return []; });
    }
    return indexPromise;
  }
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function highlight(text, terms) {
    var out = escapeHtml(text);
    terms.forEach(function (t) {
      if (t.length < 2) return;
      out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return out;
  }
  // Normalise to " word word " so terms match at the start of a word ("vac" → vacuum, not privacy).
  function words(s) { return ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' '; }
  function search(index, query) {
    var terms = words(query).trim().split(' ').filter(Boolean);
    if (!terms.length) return [];
    return index.map(function (item) {
      var title = words(item.t);
      var products = words(item.p);
      var hay = words(item.t + ' ' + item.d + ' ' + item.c + ' ' + item.p);
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = ' ' + terms[i];
        if (hay.indexOf(t) === -1) return null;
        if (title.indexOf(t) !== -1) score += 3;
        if (products.indexOf(t) !== -1) score += 2;
        score += 1;
      }
      if (item.k === 'Best-of guide') score += 1;
      return { item: item, score: score };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).map(function (r) { return r.item; });
  }
  function renderResult(item, terms) {
    var img = item.i ? '<img src="' + escapeHtml(item.i) + '" alt="" width="52" height="52" loading="lazy">' : '';
    var meta = item.k + (item.c && item.c !== 'Category' ? ' · ' + item.c : '') + (item.s ? ' · ' + item.s + '/10' : '');
    return '<a class="result" href="' + escapeHtml(item.u) + '">' + img +
      '<span><span class="result__title">' + highlight(item.t, terms) + '</span>' +
      '<span class="result__meta">' + escapeHtml(meta) + '</span></span></a>';
  }

  var dialog = $('[data-search-dialog]');
  var dInput = $('[data-search-input]');
  var dResults = $('[data-search-results]');
  var activeIdx = -1;

  function openSearch() {
    if (!dialog) return;
    setNav(false);
    loadIndex();
    if (typeof dialog.showModal === 'function') dialog.showModal(); else location.href = '/search/';
    dInput.focus();
  }
  $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', openSearch); });
  var closeBtn = $('[data-search-close]');
  if (closeBtn) closeBtn.addEventListener('click', function () { dialog.close(); });
  if (dialog) {
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
      e.preventDefault();
      openSearch();
    }
  });

  if (dInput) {
    var timer;
    dInput.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var q = dInput.value.trim();
        activeIdx = -1;
        if (!q) { dResults.innerHTML = ''; return; }
        loadIndex().then(function (index) {
          var terms = q.toLowerCase().split(/\s+/);
          var hits = search(index, q).slice(0, 8);
          dResults.innerHTML = hits.length ? hits.map(function (h) { return renderResult(h, terms); }).join('')
            : '<p class="search-empty">No results for “' + escapeHtml(q) + '”. Try a product type like “vacuum” or “VPN”.</p>';
        });
      }, 120);
    });
    dInput.addEventListener('keydown', function (e) {
      var items = $$('.result', dResults);
      if (!items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = (activeIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach(function (el, i) { el.classList.toggle('is-active', i === activeIdx); });
        items[activeIdx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault();
        location.href = items[activeIdx].getAttribute('href');
      }
    });
  }

  // Full search page
  var pageInput = $('[data-search-page-input]');
  if (pageInput) {
    var q = new URLSearchParams(location.search).get('q') || '';
    pageInput.value = q;
    var summary = $('[data-search-summary]');
    var list = $('[data-search-page-results]');
    if (q.trim()) {
      loadIndex().then(function (index) {
        var hits = search(index, q);
        var terms = q.toLowerCase().split(/\s+/);
        summary.textContent = hits.length + ' result' + (hits.length === 1 ? '' : 's') + ' for “' + q + '”';
        list.innerHTML = hits.length ? hits.map(function (h) { return renderResult(h, terms); }).join('')
          : '<p class="search-empty">Nothing matched. Try fewer or broader words, or browse <a href="/categories/">all categories</a>.</p>';
      });
    } else {
      pageInput.focus();
    }
  }

  /* ---------- Table of contents: highlight current section ---------- */
  var tocLinks = $$('.toc a');
  if (tocLinks.length) {
    var pairs = tocLinks.map(function (a) {
      return { link: a, target: document.getElementById(a.getAttribute('href').slice(1)) };
    }).filter(function (p) { return p.target; });
    var activeLink = null;
    var ticking = false;
    var updateToc = function () {
      ticking = false;
      var line = 140;
      var current = pairs[0];
      for (var i = 0; i < pairs.length; i++) {
        if (pairs[i].target.getBoundingClientRect().top <= line) current = pairs[i];
      }
      if (current && current.link !== activeLink) {
        if (activeLink) activeLink.classList.remove('is-active');
        current.link.classList.add('is-active');
        activeLink = current.link;
      }
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateToc); }
    }, { passive: true });
    updateToc();
  }

  /* ---------- Sticky mobile CTA ---------- */
  var sticky = $('[data-sticky-cta]');
  var anchor = $('[data-cta-anchor]');
  if (sticky && anchor && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var past = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
      sticky.classList.toggle('is-visible', past);
      sticky.setAttribute('aria-hidden', String(!past));
      $$('a', sticky).forEach(function (a) { a.tabIndex = past ? 0 : -1; });
    }).observe(anchor);
    $$('a', sticky).forEach(function (a) { a.tabIndex = -1; });
  }

  /* ---------- Listing filter ---------- */
  var filter = $('[data-filter]');
  var filterList = $('[data-filter-list]');
  if (filter && filterList) {
    filter.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter-value]');
      if (!btn) return;
      var val = btn.getAttribute('data-filter-value');
      $$('[data-filter-value]', filter).forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      $$('[data-cat]', filterList).forEach(function (el) { el.hidden = val !== 'all' && el.getAttribute('data-cat') !== val; });
    });
  }

  /* ---------- Coupons: hide expired codes, copy to clipboard ---------- */
  var todayIso = new Date().toISOString().slice(0, 10);
  $$('[data-coupon][data-expires]').forEach(function (el) {
    if (el.getAttribute('data-expires') < todayIso) el.remove();
  });
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-copy]');
    if (!btn) return;
    var code = btn.getAttribute('data-copy');
    var label = btn.querySelector('.coupon__copy');
    var done = function () {
      btn.classList.add('is-copied');
      if (label) label.textContent = 'Copied!';
      btn.setAttribute('aria-label', 'Code ' + code + ' copied');
      setTimeout(function () {
        btn.classList.remove('is-copied');
        if (label) label.textContent = 'Copy';
        btn.setAttribute('aria-label', 'Copy discount code ' + code);
      }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done, function () { window.prompt('Copy this code:', code); });
    } else {
      window.prompt('Copy this code:', code);
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'coupon_copy', { code: code, page_path: location.pathname });
    }
  });

  /* ---------- Affiliate click tracking (GA4 if configured) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-aff]');
    if (!a || typeof window.gtag !== 'function') return;
    window.gtag('event', 'affiliate_click', {
      link_id: a.getAttribute('data-aff'),
      product: a.getAttribute('data-product') || '',
      page_path: location.pathname,
      transport_type: 'beacon',
    });
  });

  /* ---------- Newsletter (demo mode when no form action is configured) ---------- */
  $$('[data-newsletter-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var msg = form.querySelector('.newsletter__msg');
      if (!input.checkValidity() || !input.value) {
        msg.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }
      msg.textContent = 'Preview only: add your newsletter provider URL to site.json to collect emails.';
      form.reset();
    });
  });
})();
