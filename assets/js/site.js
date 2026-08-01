/* Site behaviour. Three small things: theme, tag filtering, lazy video.
   No dependencies, no build step. */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- theme */
  var root = document.documentElement;

  function currentTheme() {
    return root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  });

  /* -------------------------------------------------------------- updates */
  var showmore = document.querySelector('[data-showmore]');
  if (showmore) {
    var list = document.querySelector('[data-updates]');
    showmore.addEventListener('click', function () {
      var open = list.classList.toggle('expanded');
      showmore.textContent = open ? showmore.dataset.less : showmore.dataset.more;
    });
  }

  /* ------------------------------------------------------- project filter */
  var bar = document.querySelector('[data-filterbar]');
  if (bar) {
    var grid = document.querySelector('[data-grid]');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
    var countEl = document.querySelector('[data-count]');
    var emptyEl = document.querySelector('[data-empty]');
    var buttons = Array.prototype.slice.call(bar.querySelectorAll('button'));

    function apply(tag, push) {
      var shown = 0;
      cards.forEach(function (c) {
        var match = tag === 'all' || c.dataset.tags.split(' ').indexOf(tag) !== -1;
        c.hidden = !match;
        if (match) shown++;
      });

      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.tag === tag));
      });

      if (countEl) {
        countEl.textContent = tag === 'all'
          ? shown + ' projects'
          : shown + ' of ' + cards.length + ' shown';
      }
      if (emptyEl) emptyEl.hidden = shown !== 0;

      if (push) {
        var url = tag === 'all'
          ? location.pathname
          : location.pathname + '?tag=' + encodeURIComponent(tag);
        history.replaceState(null, '', url);
      }
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.dataset.tag, true); });
    });

    // deep link: /projects/?tag=manipulation
    var initial = new URLSearchParams(location.search).get('tag');
    var known = buttons.some(function (b) { return b.dataset.tag === initial; });
    apply(known ? initial : 'all', false);
  }

  /* ---------------------------------------------------------- lazy video */
  /* Clips only load and play once they are on screen, and pause when they
     leave, otherwise a page of twelve autoplaying videos costs real battery. */
  var vids = document.querySelectorAll('video[data-lazyvideo]');

  if (!vids.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    // honour the preference: show the poster, never animate
    vids.forEach(function (v) { v.removeAttribute('data-lazyvideo'); });
    return;
  }

  function play(v) {
    if (!v.dataset.loaded) {
      // <source> inside the element may be there already; if the markup used a
      // bare <video> (robot rail), hydrate it from the poster path.
      if (!v.querySelector('source') && v.poster) {
        var s = document.createElement('source');
        s.src = v.poster.replace(/\.jpg$/, '.mp4');
        s.type = 'video/mp4';
        v.appendChild(s);
      }
      v.load();
      v.dataset.loaded = '1';
    }
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked, poster stands in */ });
  }

  if (!('IntersectionObserver' in window)) {
    vids.forEach(play);
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) play(e.target);
      else if (e.target.dataset.loaded) e.target.pause();
    });
  }, { rootMargin: '150px 0px', threshold: 0.15 });

  vids.forEach(function (v) { io.observe(v); });
})();
