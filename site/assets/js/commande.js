/* =============================================================================
   GIOIA — Commande en ligne, à récupérer en magasin
   -----------------------------------------------------------------------------
   Panier, créneaux de retrait, récapitulatif, envoi. Aucune dépendance.

   Le panier vit dans le navigateur du visiteur (localStorage) jusqu'à l'envoi.
   La commande part ensuite vers l'API du serveur de développement, qui l'écrit
   dans un fichier — voir server/reservations.mjs. En production, branchez-la
   sur votre caisse ou sur votre outil de click & collect.

   Il n'y a pas de paiement en ligne : on règle au retrait. Brancher un
   encaissement demande un prestataire (Stripe, SumUp, Adyen…) et un serveur
   qui garde la clé secrète — voir README, section 8.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------ */
  /* Réglages                                                                 */
  /* ------------------------------------------------------------------------ */

  var CONFIG = {
    /* Horaires de retrait : le service continu du restaurant, 12h – 22h30.
       Dernière commande à retirer à 22h15. */
    retrait: { debut: '12:00', fin: '22:15' },
    pasMinutes: 15,

    /* Délai de préparation. À CONFIRMER AVEC LA CUISINE : trente minutes est
       une valeur d'attente courante, ce n'est pas une mesure. */
    delaiMinutes: 30,

    /* Jours de fermeture — 0 = dimanche … 6 = samedi. Le restaurant est
       ouvert sept jours sur sept : la liste reste vide. */
    joursFermes: [],

    /* Combien de jours à l'avance on peut commander. */
    joursOuverts: 7,

    /* Taux de TVA appliqué à la vente à emporter en France (restauration).
       Les prix affichés sont déjà nets, toutes taxes comprises. */
    tva: 0.10,

    telephone: '+33184754175',
    telephoneAffiche: '+33 1 84 75 41 75',

    /* Mettez ici l'URL de votre API quand elle existe.
       window.GIOIA_ORDER_ENDPOINT permet de la surcharger page par page. */
    endpoint: window.GIOIA_ORDER_ENDPOINT || '/api/commandes',

    cle: 'gioia:panier'
  };

  var CARTE = [
      {
          "id": "entrees",
          "titre": "Entrées",
          "sous": "Pour commencer",
          "plats": [
              {
                  "id": "entrees-legumes-grilles",
                  "nom": "Légumes grillés",
                  "prix": 13,
                  "desc": "Salade, courgettes, poivrons grillés, aubergines, champignons, origan"
              },
              {
                  "id": "entrees-caprese",
                  "nom": "Caprese",
                  "prix": 14,
                  "desc": "Mozzarella di bufala, roquette, huile d’olive, basilic, tomates, origan"
              },
              {
                  "id": "entrees-burrata-cremosa",
                  "nom": "Burrata cremosa",
                  "prix": 14,
                  "desc": "Salade, burrata crémeuse, roquette, huile d’olive, origan"
              },
              {
                  "id": "entrees-arancini",
                  "nom": "Arancini",
                  "prix": 14,
                  "desc": "Boulettes de riz panées farcies de mozzarella di bufala, salade et tomates"
              },
              {
                  "id": "entrees-vitello-tonnato",
                  "nom": "Vitello Tonnato",
                  "prix": 17,
                  "desc": "Noix de veau, thon à l’huile mayonnaise, câpres, anchois, huile d’olive extra vierge, roquette"
              },
              {
                  "id": "entrees-chiffonnade-de-jambon-de-parme-san-daniele",
                  "nom": "Chiffonnade de jambon de parme San Daniele",
                  "prix": 17
              },
              {
                  "id": "entrees-bresaola",
                  "nom": "Bresaola",
                  "prix": 17,
                  "desc": "Roquette, artichauts, tomates cerises, citron, huile d’olive, copeaux de parmesan, vinaigre balsamique"
              },
              {
                  "id": "entrees-salade-gioia",
                  "nom": "Salade Gioia",
                  "prix": 20,
                  "desc": "Salade, artichauts, champignons, tomates séchées, parmesan, courgettes, fromage de brebis, basilic"
              },
              {
                  "id": "entrees-antipasti-gioia",
                  "nom": "Antipasti Gioia",
                  "prix": 22,
                  "desc": "Mélange de charcuterie italienne, légumes grillés, salade verte, mozzarella di bufala"
              }
          ]
      },
      {
          "id": "viandes",
          "titre": "Viandes",
          "sous": "Nos plats de viande",
          "plats": [
              {
                  "id": "viandes-boulettes-de-buf-a-la-sicilienne",
                  "nom": "Boulettes de bœuf à la sicilienne",
                  "prix": 19
              },
              {
                  "id": "viandes-escalope-de-veau-sauce-au-citron",
                  "nom": "Escalope de veau sauce au citron",
                  "prix": 21
              },
              {
                  "id": "viandes-saltimbocca-alla-romana",
                  "nom": "Saltimbocca alla romana",
                  "prix": 23,
                  "desc": "Escalope de veau, jambon de parme, mozzarella gratinée"
              }
          ]
      },
      {
          "id": "pates",
          "titre": "Pâtes",
          "sous": "Nos pâtes",
          "plats": [
              {
                  "id": "pates-penne-allarrabbiata",
                  "nom": "Penne all’arrabbiata",
                  "prix": 12,
                  "desc": "Sauce tomate, piments, parmesan"
              },
              {
                  "id": "pates-penne-a-la-napolitaine",
                  "nom": "Penne à la napolitaine",
                  "prix": 13,
                  "desc": "Sauce tomate, champignons, oignons, tomates cerises, basilic"
              },
              {
                  "id": "pates-fusilli-vegetarienne",
                  "nom": "Fusilli végétarienne",
                  "prix": 15,
                  "desc": "Sauce tomate, courgettes, carottes, champignons, oignons, parmesan"
              },
              {
                  "id": "pates-linguini-al-pesto",
                  "nom": "Linguini al pesto",
                  "prix": 15,
                  "desc": "Sauce pesto, huile d’olive, ail, basilic"
              },
              {
                  "id": "pates-linguine-bolognese",
                  "nom": "Linguine Bolognese",
                  "prix": 16,
                  "desc": "Sauce tomate, viande hachée, basilic"
              },
              {
                  "id": "pates-penne-alla-norma",
                  "nom": "Penne alla norma",
                  "prix": 16,
                  "desc": "Sauce tomate, aubergines, ricotta, oignons, basilic, copeaux de parmesan"
              },
              {
                  "id": "pates-penne-allamatriciana",
                  "nom": "Penne all’amatriciana",
                  "prix": 16,
                  "desc": "Sauce tomate, guanciale, oignons, basilic, copeaux de parmesan"
              },
              {
                  "id": "pates-ravioli-ricotta-et-epinards",
                  "nom": "Ravioli ricotta et épinards",
                  "prix": 16,
                  "desc": "Sauce au choix (crème fraîche, sauce tomate, sauce rose)"
              },
              {
                  "id": "pates-raviolis-aux-4-fromages",
                  "nom": "Raviolis aux 4 fromages",
                  "prix": 16,
                  "desc": "Sauce au choix (crème fraîche, sauce tomate, sauce rose)"
              },
              {
                  "id": "pates-tortellini",
                  "nom": "Tortellini",
                  "prix": 17,
                  "desc": "Prosciutto fumé, speck"
              },
              {
                  "id": "pates-linguini-ou-penne-alla-carbonara",
                  "nom": "Linguini ou penne alla carbonara",
                  "prix": 16,
                  "desc": "Œuf, guanciale, oignons, persil"
              },
              {
                  "id": "pates-raviolis-aux-truffes",
                  "nom": "Raviolis aux truffes",
                  "prix": 23,
                  "desc": "Sauce aux truffes"
              },
              {
                  "id": "pates-linguini-scampi-et-gambas",
                  "nom": "Linguini scampi et gambas",
                  "prix": 21,
                  "desc": "Sauce tomate, sauce poisson, ail, persil, oignons"
              },
              {
                  "id": "pates-poelee-de-gambas",
                  "nom": "Poêlée de gambas",
                  "prix": 23,
                  "desc": "Aubergines, courgettes, champignons, oignons rouges"
              }
          ]
      },
      {
          "id": "gratins",
          "titre": "Gratins",
          "sous": "Sortis du four",
          "plats": [
              {
                  "id": "gratins-cannelloni",
                  "nom": "Cannelloni",
                  "prix": 14,
                  "desc": "Sauce tomate, épinards, ricotta, mozzarella, crème"
              },
              {
                  "id": "gratins-parmigiana",
                  "nom": "Parmigiana",
                  "prix": 14,
                  "desc": "Sauce tomate, aubergines, mozzarella"
              },
              {
                  "id": "gratins-lasagnes-bolognaise",
                  "nom": "Lasagnes bolognaise",
                  "prix": 16
              },
              {
                  "id": "gratins-gratin-de-pates-gioia",
                  "nom": "Gratin de pâtes Gioia",
                  "prix": 16
              }
          ]
      },
      {
          "id": "risottos",
          "titre": "Risottos",
          "sous": "Crémeux, à la minute",
          "plats": [
              {
                  "id": "risottos-champignons",
                  "nom": "Champignons",
                  "prix": 15,
                  "desc": "Champignons de Paris, oignons, crème liquide"
              },
              {
                  "id": "risottos-4-fromages",
                  "nom": "4 Fromages",
                  "prix": 16,
                  "desc": "Gorgonzola, brie, chèvre, crème liquide, parmesan"
              },
              {
                  "id": "risottos-vegetarien",
                  "nom": "Végétarien",
                  "prix": 17,
                  "desc": "Aubergines, sauce tomate, ricotta salée, basilic, ail, huile d’olive"
              },
              {
                  "id": "risottos-scampi-et-gambas",
                  "nom": "Scampi et gambas",
                  "prix": 22,
                  "desc": "Sauce poisson, oignons, persil, scampi, gambas"
              }
          ]
      },
      {
          "id": "pizzas",
          "titre": "Pizzas",
          "sous": "Pâte bio artisanale",
          "plats": [
              {
                  "id": "pizzas-margherita",
                  "nom": "Margherita",
                  "prix": 12,
                  "desc": "Sauce tomate, mozzarella, origan, basilic"
              },
              {
                  "id": "pizzas-napolitaine",
                  "nom": "Napolitaine",
                  "prix": 13,
                  "desc": "Sauce tomate, mozzarella, anchois, câpres, olives, origan, basilic"
              },
              {
                  "id": "pizzas-vegetarienne",
                  "nom": "Végétarienne",
                  "prix": 14,
                  "desc": "Sauce tomate, mozzarella, champignons, courgettes, poivrons, aubergines, origan"
              },
              {
                  "id": "pizzas-regina",
                  "nom": "Regina",
                  "prix": 15,
                  "desc": "Sauce tomate, mozzarella, jambon blanc, champignons, origan"
              },
              {
                  "id": "pizzas-calzone",
                  "nom": "Calzone",
                  "prix": 16,
                  "desc": "Sauce tomate, mozzarella, jambon blanc, œuf, origan"
              },
              {
                  "id": "pizzas-4-fromages",
                  "nom": "4 Fromages",
                  "prix": 16,
                  "desc": "Sauce tomate, mozzarella, gorgonzola, chèvre, parmesan, basilic"
              },
              {
                  "id": "pizzas-chevre-et-miel",
                  "nom": "Chèvre et miel",
                  "prix": 16,
                  "desc": "Crème fraîche, mozzarella, chèvre, miel"
              },
              {
                  "id": "pizzas-thon",
                  "nom": "Thon",
                  "prix": 16,
                  "desc": "Sauce tomate, thon, oignons, citron, origan"
              },
              {
                  "id": "pizzas-primavera",
                  "nom": "Primavera",
                  "prix": 17,
                  "desc": "Sauce tomate, mozzarella, roquette, courgettes, poivrons, champignons, parmesan, basilic"
              },
              {
                  "id": "pizzas-4-saisons",
                  "nom": "4 Saisons",
                  "prix": 17,
                  "desc": "Sauce tomate, mozzarella, jambon, artichauts, champignons, olives"
              },
              {
                  "id": "pizzas-chipolina",
                  "nom": "Chipolina",
                  "prix": 17,
                  "desc": "Sauce tomate, mozzarella, chorizo, salami, charcuterie italienne"
              },
              {
                  "id": "pizzas-bologne",
                  "nom": "Bologne",
                  "prix": 17,
                  "desc": "Sauce tomate, mozzarella, poivrons, champignons, viande hachée, oignons, origan"
              },
              {
                  "id": "pizzas-gioia",
                  "nom": "Gioia",
                  "prix": 17,
                  "desc": "Sauce tomate, mozzarella, tomates cerises, roquette, basilic et boules de mozzarella di bufala"
              },
              {
                  "id": "pizzas-pizza-blanche",
                  "nom": "Pizza blanche",
                  "prix": 17,
                  "desc": "Crème fraîche, mozzarella, lardons, pommes de terre, œuf, basilic, oignons"
              },
              {
                  "id": "pizzas-parme",
                  "nom": "Parme",
                  "prix": 18,
                  "desc": "Sauce tomate, mozzarella, parme, roquette, parmesan, origan, basilic"
              },
              {
                  "id": "pizzas-bresaola",
                  "nom": "Bresaola",
                  "prix": 19,
                  "desc": "Sauce tomate, mozzarella, bresaola, roquette, parmesan, basilic"
              },
              {
                  "id": "pizzas-burrata-parma",
                  "nom": "Burrata parma",
                  "prix": 20,
                  "desc": "Sauce tomate, mozzarella, jambon de parme, burrata crémeuse"
              },
              {
                  "id": "pizzas-fruits-de-mer",
                  "nom": "Fruits de mer",
                  "prix": 25,
                  "desc": "Sauce tomate, mozzarella, fruits de mer"
              }
          ]
      },
      {
          "id": "desserts",
          "titre": "Desserts",
          "sous": "Pour finir",
          "plats": [
              {
                  "id": "desserts-panna-cotta",
                  "nom": "Panna cotta",
                  "prix": 7,
                  "desc": "À la gousse de vanille, coulis de fruits rouges, caramel ou chocolat"
              },
              {
                  "id": "desserts-tiramisu",
                  "nom": "Tiramisù",
                  "prix": 8
              },
              {
                  "id": "desserts-cannoli",
                  "nom": "Cannoli",
                  "prix": 8
              },
              {
                  "id": "desserts-cafe-gourmand-ou-the-gourmand",
                  "nom": "Café gourmand ou thé gourmand",
                  "prix": 10
              },
              {
                  "id": "desserts-duo-de-tiramisu",
                  "nom": "Duo de tiramisù",
                  "prix": 14
              },
              {
                  "id": "desserts-glaces-gourmandes-artisanales-1-boule",
                  "nom": "Glaces gourmandes artisanales — 1 boule",
                  "prix": 4,
                  "desc": "Chocolat, fraise, vanille, pistache, caramel, café"
              },
              {
                  "id": "desserts-glaces-gourmandes-artisanales-2-boules",
                  "nom": "Glaces gourmandes artisanales — 2 boules",
                  "prix": 6,
                  "desc": "Chocolat, fraise, vanille, pistache, caramel, café"
              },
              {
                  "id": "desserts-glaces-gourmandes-artisanales-3-boules",
                  "nom": "Glaces gourmandes artisanales — 3 boules",
                  "prix": 8,
                  "desc": "Chocolat, fraise, vanille, pistache, caramel, café"
              }
          ]
      },
      {
          "id": "softs",
          "titre": "Softs",
          "sous": "Sans alcool",
          "plats": [
              {
                  "id": "softs-sirop-a-leau",
                  "nom": "Sirop à l’eau",
                  "prix": 2.5
              },
              {
                  "id": "softs-eau-minerale-plate-ou-petillante-50-cl",
                  "nom": "Eau minérale plate ou pétillante — 50 cl",
                  "prix": 4
              },
              {
                  "id": "softs-eau-minerale-plate-ou-petillante-1-l",
                  "nom": "Eau minérale plate ou pétillante — 1 L",
                  "prix": 7
              },
              {
                  "id": "softs-sodas",
                  "nom": "Sodas",
                  "prix": 5.5
              },
              {
                  "id": "softs-jus-de-fruit",
                  "nom": "Jus de fruit",
                  "prix": 5.5,
                  "desc": "Orange, pomme"
              },
              {
                  "id": "softs-diabolo",
                  "nom": "Diabolo",
                  "prix": 5.5
              }
          ]
      }
  ];

  /* ------------------------------------------------------------------------ */
  /* Utilitaires                                                              */
  /* ------------------------------------------------------------------------ */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function euros(n) {
    return (Math.round(n * 100) / 100).toLocaleString('fr-FR', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }) + ' €';
  }

  function minutes(hhmm) {
    var p = String(hhmm).split(':');
    return Number(p[0]) * 60 + Number(p[1]);
  }

  function horaire(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h < 10 ? '0' : '') + h + 'h' + (m < 10 ? '0' : '') + m;
  }

  function iso(d) {
    return d.getFullYear() + '-' +
      ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
      ('0' + d.getDate()).slice(-2);
  }

  function dateLongue(s) {
    var d = new Date(s + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  /* Index des plats, pour retrouver un plat par son identifiant. */
  var PLATS = {};
  CARTE.forEach(function (sec) {
    sec.plats.forEach(function (p) { PLATS[p.id] = p; });
  });

  /* ------------------------------------------------------------------------ */
  /* Le panier                                                                */
  /* ------------------------------------------------------------------------ */

  var panier = lire();

  function lire() {
    try {
      var brut = window.localStorage.getItem(CONFIG.cle);
      var obj = brut ? JSON.parse(brut) : {};
      // On écarte ce qui ne correspond plus à la carte du jour.
      var propre = {};
      Object.keys(obj).forEach(function (id) {
        var n = Number(obj[id]);
        if (PLATS[id] && !PLATS[id].surPlace && n > 0) { propre[id] = Math.min(n, 20); }
      });
      return propre;
    } catch (e) { return {}; }
  }

  function ecrire() {
    try { window.localStorage.setItem(CONFIG.cle, JSON.stringify(panier)); }
    catch (e) { /* navigation privée : le panier ne survivra pas au rechargement */ }
  }

  function quantite(id) { return panier[id] || 0; }

  function poser(id, n) {
    n = Math.max(0, Math.min(20, n));
    if (n === 0) { delete panier[id]; } else { panier[id] = n; }
    ecrire();
    rendre();
  }

  function lignes() {
    return Object.keys(panier).map(function (id) {
      return { plat: PLATS[id], n: panier[id], total: PLATS[id].prix * panier[id] };
    }).sort(function (a, b) { return a.plat.nom.localeCompare(b.plat.nom, 'fr'); });
  }

  function articles() {
    return Object.keys(panier).reduce(function (s, id) { return s + panier[id]; }, 0);
  }

  function total() {
    return lignes().reduce(function (s, l) { return s + l.total; }, 0);
  }

  /* ------------------------------------------------------------------------ */
  /* La carte, avec ses compteurs                                             */
  /* ------------------------------------------------------------------------ */

  function construireCarte() {
    var hote = $('[data-carte]');
    if (!hote) { return; }

    CARTE.forEach(function (sec) {
      var bloc = document.createElement('div');
      bloc.className = 'menu-section';
      bloc.id = 'cmd-' + sec.id;

      var tete = document.createElement('div');
      tete.className = 'menu-section__head';
      tete.innerHTML = '<h2>' + sec.titre + '</h2><span class="rule"></span>' +
                       '<span class="menu-section__sub">' + sec.sous + '</span>';
      bloc.appendChild(tete);

      var liste = document.createElement('div');
      liste.className = 'menu-list menu-list--two';

      sec.plats.forEach(function (p) {
        var art = document.createElement('article');
        art.className = 'menu-item commande-item' + (p.surPlace ? ' est-sur-place' : '');

        var tags = (p.tags || []).map(function (t) {
          return '<span class="tag">' + t + '</span>';
        }).join('');

        art.innerHTML =
          '<div class="menu-item__head">' +
            '<h3 class="menu-item__name">' + p.nom +
              (tags ? ' <span class="tags">' + tags + '</span>' : '') + '</h3>' +
            '<span class="menu-item__leader" aria-hidden="true"></span>' +
            '<span class="menu-item__price">' + p.prix + ' €</span>' +
          '</div>' +
          /* Tous les plats n'ont pas de description : la référence en laisse
             plusieurs sans. On n'écrit alors pas de paragraphe vide. */
          (p.desc ? '<p class="menu-item__desc">' + p.desc + '</p>' : '');

        if (p.surPlace) {
          var note = document.createElement('p');
          note.className = 'commande-item__note';
          note.textContent = p.surPlace;
          art.appendChild(note);
        } else {
          art.appendChild(compteur(p));
        }

        liste.appendChild(art);
      });

      bloc.appendChild(liste);
      hote.appendChild(bloc);
    });
  }

  function compteur(p) {
    var box = document.createElement('div');
    box.className = 'stepper-plat';
    box.setAttribute('data-plat', p.id);

    box.innerHTML =
      '<button type="button" class="stepper-plat__btn" data-pas="-1" ' +
        'aria-label="Retirer un ' + p.nom + '">–</button>' +
      '<output class="stepper-plat__n" aria-live="polite" ' +
        'aria-label="Quantité de ' + p.nom + '">0</output>' +
      '<button type="button" class="stepper-plat__btn" data-pas="1" ' +
        'aria-label="Ajouter un ' + p.nom + '">+</button>' +
      '<button type="button" class="stepper-plat__ajout">Ajouter</button>';

    box.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) { return; }
      if (b.classList.contains('stepper-plat__ajout')) { poser(p.id, quantite(p.id) + 1); return; }
      poser(p.id, quantite(p.id) + Number(b.getAttribute('data-pas')));
    });

    return box;
  }

  /* ------------------------------------------------------------------------ */
  /* Rendu du panier                                                          */
  /* ------------------------------------------------------------------------ */

  function rendre() {
    var n = articles();

    $$('.stepper-plat').forEach(function (box) {
      var id = box.getAttribute('data-plat');
      var q = quantite(id);
      $('.stepper-plat__n', box).textContent = q;
      box.classList.toggle('est-rempli', q > 0);
      $('.stepper-plat__btn[data-pas="-1"]', box).disabled = q === 0;
    });

    // Pastille de l'en-tête, sur toutes les pages
    $$('[data-panier-nombre]').forEach(function (el) {
      el.textContent = n;
      var lien = el.closest('[data-panier-lien]') || el.parentElement;
      if (lien) { lien.hidden = n === 0; }
    });

    var corps = $('[data-panier-lignes]');
    if (!corps) { return; }

    corps.innerHTML = '';
    lignes().forEach(function (l) {
      var ligne = document.createElement('div');
      ligne.className = 'panier-ligne';
      ligne.innerHTML =
        '<div class="panier-ligne__texte">' +
          '<span class="panier-ligne__nom">' + l.plat.nom + '</span>' +
          '<span class="panier-ligne__unite">' + l.plat.prix + ' € l’unité</span>' +
        '</div>' +
        '<div class="stepper-plat stepper-plat--compact est-rempli" data-plat="' + l.plat.id + '">' +
          '<button type="button" class="stepper-plat__btn" data-pas="-1" aria-label="Retirer un ' + l.plat.nom + '">–</button>' +
          '<output class="stepper-plat__n">' + l.n + '</output>' +
          '<button type="button" class="stepper-plat__btn" data-pas="1" aria-label="Ajouter un ' + l.plat.nom + '">+</button>' +
        '</div>' +
        '<span class="panier-ligne__total">' + euros(l.total) + '</span>';

      ligne.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-pas]');
        if (!b) { return; }
        poser(l.plat.id, quantite(l.plat.id) + Number(b.getAttribute('data-pas')));
      });

      corps.appendChild(ligne);
    });

    var vide = $('[data-panier-vide]');
    if (vide) { vide.hidden = n > 0; }
    $$('[data-panier-contenu]').forEach(function (el) { el.hidden = n === 0; });

    var t = total();
    var ht = t / (1 + CONFIG.tva);
    var maj = {
      '[data-total]': euros(t),
      '[data-total-ht]': euros(ht),
      '[data-total-tva]': euros(t - ht),
      '[data-articles]': n + (n > 1 ? ' articles' : ' article')
    };
    Object.keys(maj).forEach(function (sel) {
      $$(sel).forEach(function (el) { el.textContent = maj[sel]; });
    });

    var suite = $('[data-vers-coordonnees]');
    if (suite) { suite.disabled = n === 0; }
  }

  /* ------------------------------------------------------------------------ */
  /* Créneaux de retrait                                                      */
  /* ------------------------------------------------------------------------ */

  function joursPossibles() {
    var out = [];
    var d = new Date();
    for (var i = 0; out.length < CONFIG.joursOuverts && i < 30; i++) {
      var j = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      if (CONFIG.joursFermes.indexOf(j.getDay()) === -1) { out.push(iso(j)); }
    }
    return out;
  }

  function creneaux(dateStr) {
    var out = [];
    var debut = minutes(CONFIG.retrait.debut);
    var fin = minutes(CONFIG.retrait.fin);

    var maintenant = new Date();
    var estAujourdhui = dateStr === iso(maintenant);
    var plancher = estAujourdhui
      ? maintenant.getHours() * 60 + maintenant.getMinutes() + CONFIG.delaiMinutes
      : 0;

    for (var m = debut; m <= fin; m += CONFIG.pasMinutes) {
      if (m >= plancher) { out.push(m); }
    }
    return out;
  }

  function construireCreneaux() {
    var hoteJours = $('[data-jours]');
    var hoteHeures = $('[data-heures]');
    if (!hoteJours || !hoteHeures) { return; }

    var jours = joursPossibles();
    hoteJours.innerHTML = '';

    jours.forEach(function (j, i) {
      var lab = document.createElement('label');
      lab.className = 'choice';
      var libelle = i === 0 ? 'Aujourd’hui'
        : i === 1 ? 'Demain'
        : new Date(j + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      lab.innerHTML = '<input type="radio" name="jour" value="' + j + '"' +
        (i === 0 ? ' checked' : '') + '><span>' + libelle + '</span>';
      hoteJours.appendChild(lab);
    });

    hoteJours.addEventListener('change', peindreHeures);
    peindreHeures();

    function peindreHeures() {
      var choisi = $('input[name="jour"]:checked', hoteJours);
      var liste = choisi ? creneaux(choisi.value) : [];
      hoteHeures.innerHTML = '';

      if (!liste.length) {
        hoteHeures.innerHTML = '<p class="slots__empty">Plus de créneau aujourd’hui. ' +
          'Choisissez demain, ou appelez-nous au ' +
          '<a class="link-line" href="tel:' + CONFIG.telephone + '">' +
          CONFIG.telephoneAffiche + '</a>.</p>';
        majRecap();
        return;
      }

      var grille = document.createElement('div');
      grille.className = 'slots';
      liste.forEach(function (m, i) {
        var lab = document.createElement('label');
        lab.className = 'choice';
        lab.innerHTML = '<input type="radio" name="heure" value="' +
          ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2) + '"' +
          (i === 0 ? ' checked' : '') + '><span>' + horaire(m) + '</span>';
        grille.appendChild(lab);
      });
      hoteHeures.appendChild(grille);
      grille.addEventListener('change', majRecap);
      majRecap();
    }
  }

  function majRecap() {
    var j = $('input[name="jour"]:checked');
    var h = $('input[name="heure"]:checked');
    $$('[data-recap-retrait]').forEach(function (el) {
      el.textContent = (j && h) ? dateLongue(j.value) + ' à ' + horaire(minutes(h.value)) : '—';
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Étapes                                                                   */
  /* ------------------------------------------------------------------------ */

  function initEtapes() {
    var etapes = $$('.step');
    if (!etapes.length) { return; }

    function aller(n) {
      etapes.forEach(function (e, i) { e.classList.toggle('is-active', i === n); });
      $$('.stepper__item').forEach(function (e, i) {
        e.classList.toggle('is-active', i === n);
        e.classList.toggle('is-done', i < n);
      });
      var haut = $('.commande');
      if (haut) {
        var y = haut.getBoundingClientRect().top + window.scrollY -
                (parseFloat(getComputedStyle(document.documentElement)
                  .getPropertyValue('--header-h')) || 104) - 24;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }

    $$('[data-vers]').forEach(function (b) {
      b.addEventListener('click', function () { aller(Number(b.getAttribute('data-vers'))); });
    });

    return aller;
  }

  /* ------------------------------------------------------------------------ */
  /* Envoi                                                                    */
  /* ------------------------------------------------------------------------ */

  function initEnvoi(aller) {
    var form = $('[data-commande-form]');
    if (!form) { return; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var alerte = $('[data-erreur]');
      alerte.hidden = true;

      if (!articles()) {
        alerte.textContent = 'Votre panier est vide.';
        alerte.hidden = false;
        return;
      }

      var j = $('input[name="jour"]:checked');
      var h = $('input[name="heure"]:checked');
      if (!j || !h) {
        alerte.textContent = 'Choisissez un créneau de retrait.';
        alerte.hidden = false;
        return;
      }

      var data = new FormData(form);
      var corps = {
        mode: 'emporter',
        date: j.value,
        heure: h.value,
        lignes: lignes().map(function (l) {
          return { id: l.plat.id, nom: l.plat.nom, prix: l.plat.prix, quantite: l.n };
        }),
        total: total(),
        prenom: String(data.get('prenom') || '').trim(),
        nom: String(data.get('nom') || '').trim(),
        email: String(data.get('email') || '').trim(),
        telephone: String(data.get('telephone') || '').trim(),
        remarques: String(data.get('remarques') || '').trim()
      };

      var bouton = $('[data-envoyer]', form);
      bouton.disabled = true;
      var libelle = bouton.textContent;
      bouton.textContent = 'Envoi…';

      envoyer(corps).then(function (rep) {
        $$('[data-ref]').forEach(function (el) { el.textContent = rep.reference; });
        $$('[data-conf-retrait]').forEach(function (el) {
          el.textContent = dateLongue(corps.date) + ' à ' + horaire(minutes(corps.heure));
        });
        $$('[data-conf-total]').forEach(function (el) { el.textContent = euros(corps.total); });

        var recap = $('[data-conf-lignes]');
        if (recap) {
          recap.innerHTML = corps.lignes.map(function (l) {
            return '<div class="summary__row"><dt>' + l.quantite + ' × ' + l.nom +
                   '</dt><dd>' + euros(l.prix * l.quantite) + '</dd></div>';
          }).join('');
        }

        panier = {};
        ecrire();
        rendre();
        aller(2);
      }).catch(function (err) {
        alerte.textContent = err.message ||
          'L’envoi a échoué. Réessayez, ou appelez-nous au ' + CONFIG.telephoneAffiche + '.';
        alerte.hidden = false;
      }).then(function () {
        bouton.disabled = false;
        bouton.textContent = libelle;
      });
    });
  }

  function envoyer(corps) {
    if (!window.fetch) {
      return Promise.reject(new Error('Navigateur trop ancien : appelez-nous au ' + CONFIG.telephoneAffiche + '.'));
    }
    return window.fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) { throw new Error(data.error || 'Commande refusée.'); }
        return data;
      });
    });
  }

  /* ------------------------------------------------------------------------ */

  function demarrer() {
    construireCarte();
    construireCreneaux();
    var aller = initEtapes();
    initEnvoi(aller);
    rendre();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer, { once: true });
  } else {
    demarrer();
  }
})();
