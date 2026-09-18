/* =============================================================================
   GIOIA — Script principal
   Préchargeur, transitions de page, en-tête, menu, défilé du hero,
   ruban photographique, accordéons, galerie.
   Aucune révélation au scroll : la référence n'en a pas.
   Aucune dépendance externe.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  /* Ruban photographique : les deux rangées partent ensemble                */
  /* ---------------------------------------------------------------------- */

  function initMarquee() {
    var marquee = $('.marquee');
    if (!marquee || reduceMotion || !('IntersectionObserver' in window)) { return; }

    var tracks = $$('.marquee__track', marquee);
    if (!tracks.length) { return; }

    // Sans ce calage, les rubans tournent depuis le chargement de la page : on
    // les découvre en pleine course, à une position qui dépend du temps qu'on a
    // mis à descendre. On les remet à leur origine, à la même milliseconde.
    //
    // La marge basse est là pour que ce soit fait AVANT qu'on les voie : remis
    // à zéro sous les yeux du visiteur, le ruban sautait de trois cents pixels.
    // Vitesse de la référence, mesurée image par image sur sa vidéo.
    var VITESSE = 67;   // pixels par seconde

    // La durée ne peut pas être fixe : la période dépend du nombre de tuiles
    // affichées et de leur taille, qui suivent tous deux la largeur de la
    // fenêtre. On la calcule donc à partir de la période réellement mesurée,
    // sans quoi le ruban ralentit sur les petits écrans.
    function caler() {
      tracks.forEach(function (track) {
        var tuiles = $$('.marquee__tile', track).filter(function (t) {
          return window.getComputedStyle(t).display !== 'none';
        });
        if (tuiles.length < 2) { return; }
        var moitie = tuiles.length / 2;
        var periode = tuiles[moitie].getBoundingClientRect().left
                    - tuiles[0].getBoundingClientRect().left;
        if (periode > 0) {
          track.style.setProperty('--marquee-dur', (periode / VITESSE).toFixed(2) + 's');
        }
      });
    }

    caler();
    // Les images et les polices peuvent encore changer la mise en page : on
    // recale une fois tout chargé.
    window.addEventListener('load', caler, { once: true });

    var minuteur;
    window.addEventListener('resize', function () {
      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(caler, 200);
    }, { passive: true });

    var premiere = true;

    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.some(function (e) { return e.isIntersecting; });

      // Hors du champ, on arrête les rubans : c'est ce qui libère la couche de
      // composition. Les deux sont arrêtés et relancés dans le même calcul de
      // style, donc ils restent en phase.
      marquee.classList.toggle('est-cache', !visible);
      if (!visible) { return; }

      if (!premiere) { return; }
      premiere = false;

      // Si le ruban est déjà à l'écran — arrivée par une ancre, rechargement
      // en cours de page — on ne touche à rien : la feuille de style les tient
      // déjà synchrones, et un recalage se verrait.
      if (marquee.getBoundingClientRect().top < window.innerHeight) { return; }

      var origine = null;
      tracks.forEach(function (track) {
        track.getAnimations().forEach(function (anim) {
          if (origine === null) { origine = anim.timeline.currentTime; }
          try { anim.startTime = origine; } catch (e) { /* moteur sans l'API */ }
        });
      });
    }, { rootMargin: '0px 0px 400px 0px', threshold: 0 });

    observer.observe(marquee);
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
  /* Hero de l'accueil : défilé d'images en fondu                           */
  /* ---------------------------------------------------------------------- */

  function initHeroSlideshow() {
    var hero = $('.hero');
    if (!hero) { return; }

    var slides = $$('.hero__slide', hero);
    if (slides.length < 2) { return; }

    // Mouvement réduit : une seule image, fixe.
    if (reduceMotion) {
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === 0); });
      return;
    }

    var DUREE = 6500;    // durée d'un plan
    var FONDU = 1800;    // durée du fondu, alignée sur la transition CSS
    var index = 0;

    window.setInterval(function () {
      // L'emblème paraît avant le changement et s'efface une fois le nouveau
      // plan installé : la transition porte la marque.
      hero.classList.add('is-changing');

      window.setTimeout(function () {
        slides[index].classList.remove('is-active');
        index = (index + 1) % slides.length;
        slides[index].classList.add('is-active');
      }, 450);

      window.setTimeout(function () {
        hero.classList.remove('is-changing');
      }, 450 + FONDU);
    }, DUREE);
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
    initMarquee();
    initHeader();
    initMobileMenu();
    initHeroSlideshow();
    initAccordions();
    initScrollSpy();
    initLightbox();
    initYear();
  });

  window.addEventListener('load', function () { root.classList.add('is-loaded'); });
})();
