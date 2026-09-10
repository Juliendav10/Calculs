/* =============================================================================
   GIOIA — Script principal
   Préchargeur, transitions de page, révélations au scroll, parallaxe,
   navigation, curseur sur-mesure, galerie, accordéons.
   Aucune dépendance externe.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------------------------------------------------------------- */
  /* Utilitaires                                                            */
  /* ---------------------------------------------------------------------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Images — repli élégant quand la photo n'est pas encore déposée          */
  /* ---------------------------------------------------------------------- */

  function markImageState(img) {
    var frame = img.closest('.frame');
    if (!frame) { return; }
    if (img.naturalWidth === 0) {
      img.classList.add('is-missing');
      frame.classList.add('is-empty');
    } else {
      img.classList.remove('is-missing');
      frame.classList.remove('is-empty');
    }
  }

  function initImageFallback() {
    $$('.frame img').forEach(function (img) {
      if (img.complete) {
        markImageState(img);
      } else {
        img.addEventListener('load', function () { markImageState(img); }, { once: true });
        img.addEventListener('error', function () { markImageState(img); }, { once: true });
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Préchargeur                                                            */
  /* ---------------------------------------------------------------------- */

  function initPreloader() {
    var pre = $('.preloader');
    if (!pre) { finish(); return; }

    var alreadyVisited = false;
    try { alreadyVisited = sessionStorage.getItem('gioia:visited') === '1'; } catch (e) {}

    if (alreadyVisited || reduceMotion) {
      pre.hidden = true;
      finish();
      return;
    }

    var bar = $('.preloader__bar span', pre);
    var count = $('.preloader__count', pre);
    var value = 0;

    var timer = setInterval(function () {
      value = Math.min(100, value + Math.random() * 16 + 6);
      if (bar) { bar.style.width = value + '%'; }
      if (count) { count.textContent = String(Math.round(value)).padStart(3, '0'); }
      if (value >= 100) {
        clearInterval(timer);
        setTimeout(function () {
          pre.classList.add('is-done');
          try { sessionStorage.setItem('gioia:visited', '1'); } catch (e) {}
          finish();
          setTimeout(function () { pre.hidden = true; }, 700);
        }, 380);
      }
    }, 160);

    function noop() {}
    noop();
  }

  function finish() {
    root.classList.add('is-loaded');
  }

  /* ---------------------------------------------------------------------- */
  /* Transitions de page (rideau)                                           */
  /* ---------------------------------------------------------------------- */

  function initPageTransitions() {
    var curtain = $('.curtain');
    if (!curtain) { return; }

    // Sortie du rideau à l'arrivée sur une nouvelle page
    if (root.classList.contains('is-navigating')) {
      curtain.classList.add('is-out');
      window.setTimeout(function () {
        curtain.classList.remove('is-out');
        root.classList.remove('is-navigating');
      }, 1000);
    }

    if (reduceMotion) { return; }

    document.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (!link) { return; }
      if (event.defaultPrevented || event.button !== 0) { return; }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) { return; }
      if (link.target === '_blank' || link.hasAttribute('download')) { return; }

      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) { return; }

      var url;
      try { url = new URL(link.href, window.location.href); } catch (e) { return; }
      if (url.origin !== window.location.origin) { return; }
      if (url.pathname === window.location.pathname && url.search === window.location.search) { return; }

      event.preventDefault();
      curtain.classList.remove('is-out');
      // Redémarre l'animation
      void curtain.offsetWidth;
      curtain.classList.add('is-in');
      try { sessionStorage.setItem('gioia:navigating', '1'); } catch (e) {}
      window.setTimeout(function () { window.location.href = url.href; }, 720);
    });

    // Retour arrière depuis le cache bfcache : on nettoie le rideau
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) {
        curtain.classList.remove('is-in', 'is-out');
        root.classList.remove('is-navigating');
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Révélations au scroll                                                  */
  /* ---------------------------------------------------------------------- */

  function initReveals() {
    var targets = $$('[data-reveal], .line-mask');
    if (!targets.length) { return; }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    // Décalage automatique pour les groupes
    $$('[data-reveal-group]').forEach(function (group) {
      var step = parseInt(group.getAttribute('data-reveal-group'), 10) || 110;
      $$('[data-reveal], .line-mask', group).forEach(function (child, i) {
        if (!child.style.getPropertyValue('--reveal-delay')) {
          child.style.setProperty('--reveal-delay', (i * step) + 'ms');
        }
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------- */
  /* Parallaxe (rAF, transform uniquement)                                  */
  /* ---------------------------------------------------------------------- */

  function initParallax() {
    var items = $$('[data-parallax]');
    if (!items.length || reduceMotion) { return; }

    var ticking = false;

    function update() {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) { return; }
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        var progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        el.style.transform = 'translate3d(0,' + (progress * speed * 100).toFixed(2) + 'px,0)';
      });
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------------------------------------------------------------------- */
  /* En-tête : compactage + masquage au défilement                          */
  /* ---------------------------------------------------------------------- */

  function initHeader() {
    var header = $('.site-header');
    if (!header) { return; }

    var lastY = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      header.classList.toggle('is-stuck', y > 40);
      if (!document.body.classList.contains('is-locked')) {
        var goingDown = y > lastY && y > 320;
        header.classList.toggle('is-hidden', goingDown);
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });

    update();
  }

  /* ---------------------------------------------------------------------- */
  /* Menu mobile plein écran                                                */
  /* ---------------------------------------------------------------------- */

  function initMobileMenu() {
    var burger = $('.burger');
    var menu = $('.mobile-menu');
    if (!burger || !menu) { return; }

    function setOpen(open) {
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);
      if (open) {
        var first = $('.mobile-menu__link', menu);
        if (first) { setTimeout(function () { first.focus(); }, 320); }
      }
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        burger.focus();
      }
    });

    $$('.mobile-menu__link', menu).forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Curseur sur-mesure + boutons magnétiques                               */
  /* ---------------------------------------------------------------------- */

  function initCursor() {
    if (!finePointer || reduceMotion) { return; }

    var cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);

    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    var targetX = x;
    var targetY = y;

    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      cursor.classList.add('is-active');
    }, { passive: true });

    document.addEventListener('mouseleave', function () { cursor.classList.remove('is-active'); });

    (function loop() {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      cursor.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
      window.requestAnimationFrame(loop);
    })();

    var hoverables = 'a, button, .gallery__item, .card, input, select, textarea, label';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverables)) { cursor.classList.add('is-hover'); }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverables)) { cursor.classList.remove('is-hover'); }
    });
  }

  function initMagnetic() {
    if (!finePointer || reduceMotion) { return; }

    $$('[data-magnetic]').forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-magnetic')) || 0.28;

      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = 'translate3d(' + (dx * strength) + 'px,' + (dy * strength) + 'px,0)';
      });

      el.addEventListener('mouseleave', function () {
        el.style.transform = 'translate3d(0,0,0)';
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Compteurs animés                                                       */
  /* ---------------------------------------------------------------------- */

  function initCounters() {
    var counters = $$('[data-count]');
    if (!counters.length) { return; }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var el = entry.target;
        observer.unobserve(el);
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-count-suffix') || '';
        var duration = 1500;
        var start = null;

        function tick(ts) {
          if (start === null) { start = ts; }
          var p = Math.min(1, (ts - start) / duration);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) { window.requestAnimationFrame(tick); }
        }
        window.requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------- */
  /* Bandeau défilant : duplication du contenu pour une boucle continue     */
  /* ---------------------------------------------------------------------- */

  function initMarquee() {
    $$('.marquee__track').forEach(function (track) {
      if (track.dataset.cloned === '1') { return; }
      track.innerHTML += track.innerHTML;
      track.dataset.cloned = '1';
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Accordéons                                                             */
  /* ---------------------------------------------------------------------- */

  function initAccordions() {
    $$('.accordion__trigger').forEach(function (trigger) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) { return; }

      trigger.addEventListener('click', function () {
        var open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!open));
        panel.classList.toggle('is-open', !open);
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Sous-navigation de la carte (scrollspy)                                */
  /* ---------------------------------------------------------------------- */

  function initScrollSpy() {
    var links = $$('.menu-nav__link');
    if (!links.length || !('IntersectionObserver' in window)) { return; }

    var sections = links
      .map(function (link) { return document.querySelector(link.getAttribute('href')); })
      .filter(Boolean);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        links.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---------------------------------------------------------------------- */
  /* Galerie / lightbox                                                     */
  /* ---------------------------------------------------------------------- */

  function initLightbox() {
    var items = $$('.gallery__item');
    if (!items.length) { return; }

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Visionneuse de photographies');
    box.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Fermer la visionneuse">' +
        '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M1 1l14 14M15 1L1 15" stroke="currentColor" fill="none" stroke-width="1.2"/></svg>' +
      '</button>' +
      '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Photographie précédente">' +
        '<svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><path d="M7 1L1.5 6 7 11M1.5 6H18" stroke="currentColor" fill="none" stroke-width="1.2"/></svg>' +
      '</button>' +
      '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Photographie suivante">' +
        '<svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><path d="M11 1l5.5 5-5.5 5M16.5 6H0" stroke="currentColor" fill="none" stroke-width="1.2"/></svg>' +
      '</button>' +
      '<figure class="lightbox__figure">' +
        '<div class="frame" data-caption=""><img alt=""></div>' +
        '<figcaption class="lightbox__caption"></figcaption>' +
      '</figure>';
    document.body.appendChild(box);

    var frame = $('.frame', box);
    var image = $('img', box);
    var caption = $('.lightbox__caption', box);
    var index = 0;
    var lastFocused = null;

    function show(i) {
      index = (i + items.length) % items.length;
      var source = $('img', items[index]);
      var label = items[index].getAttribute('data-caption') || (source ? source.alt : '');
      if (source) {
        image.src = source.currentSrc || source.src;
        image.alt = source.alt || label;
      }
      frame.setAttribute('data-caption', label);
      caption.textContent = label;
      markImageState(image);
      image.addEventListener('load', function () { markImageState(image); }, { once: true });
      image.addEventListener('error', function () { markImageState(image); }, { once: true });
    }

    function open(i) {
      lastFocused = document.activeElement;
      show(i);
      box.classList.add('is-open');
      document.body.classList.add('is-locked');
      $('.lightbox__close', box).focus();
    }

    function close() {
      box.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (lastFocused) { lastFocused.focus(); }
    }

    items.forEach(function (item, i) {
      item.addEventListener('click', function () { open(i); });
    });

    $('.lightbox__close', box).addEventListener('click', close);
    $('.lightbox__nav--prev', box).addEventListener('click', function () { show(index - 1); });
    $('.lightbox__nav--next', box).addEventListener('click', function () { show(index + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) { close(); } });

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) { return; }
      if (e.key === 'Escape') { close(); }
      if (e.key === 'ArrowLeft') { show(index - 1); }
      if (e.key === 'ArrowRight') { show(index + 1); }
      if (e.key === 'Tab') {
        var focusables = $$('button', box);
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Divers                                                                 */
  /* ---------------------------------------------------------------------- */

  function initYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Démarrage                                                              */
  /* ---------------------------------------------------------------------- */

  onReady(function () {
    initImageFallback();
    initPreloader();
    initPageTransitions();
    initReveals();
    initParallax();
    initHeader();
    initMobileMenu();
    initCursor();
    initMagnetic();
    initCounters();
    initMarquee();
    initAccordions();
    initScrollSpy();
    initLightbox();
    initYear();
  });

  window.addEventListener('load', function () { root.classList.add('is-loaded'); });
})();
