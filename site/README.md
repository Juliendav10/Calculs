# GIOIA Odéon — site vitrine

Site statique de 4 pages, sans dépendance ni étape de build : du HTML, une
feuille de style et deux fichiers JavaScript. Il se déploie tel quel sur
n'importe quel hébergement (Netlify, Vercel, GitHub Pages, OVH, o2switch…).

```
site/
├── index.html            Accueil
├── la-carte.html         La carte & les vins
├── le-lieu.html          Le lieu, la galerie, la privatisation, l'accès
├── reservation.html      Réservation en 3 étapes + FAQ
├── commander.html        Commande en ligne, à récupérer au restaurant
├── README.md             Ce document
├── WEBFLOW.md            Cahier de reconstruction Webflow
├── assets/
│   ├── css/style.css     Design system complet (tokens, composants, animations)
│   ├── js/main.js        Préchargeur, transitions, révélations, galerie, nav
│   ├── js/reservation.js Moteur de réservation
│   ├── js/commande.js    Moteur de commande (panier, créneaux, envoi)
│   └── images/           ← déposez vos photos ici (voir images/README.md)
├── server/
│   └── reservations.mjs  Serveur de dev + API réservation et commande (Node, 0 dépendance)
├── favicon.svg
├── robots.txt
├── sitemap.xml
└── site.webmanifest
```

## Vous reconstruisez le site dans Webflow ?

Tout ce qu'il faut est dans **[`WEBFLOW.md`](WEBFLOW.md)** : couleurs, polices,
échelle typographique, espacements, structure section par section et la liste
des interactions à refaire. Le présent README documente la maquette en code ;
`WEBFLOW.md` la traduit en réglages Webflow.

## Lancer le site en local

```bash
node server/reservations.mjs          # http://localhost:4173
node server/reservations.mjs --port 8080
```

Sans Node, un simple serveur statique suffit :

```bash
python3 -m http.server 4173
```

## 1. Déposer les photographies

Les photographies du restaurant sont en place dans `assets/images/`, au format
WebP : `salle`, `cave-voutee`, `bar`, `facade`, `facade-nuit`, `fusilli`,
`aperitivo`, plus `og-image.jpg` (1200 × 630) pour les partages sociaux.

**Elles sont en basse résolution** — 680 px de large au maximum, ce qui est
insuffisant pour un hero plein écran. Remplacez-les par les fichiers d'origine
du photographe dès que possible : voir `assets/images/README.md` pour les
tailles à viser.

Si un fichier venait à manquer, son cadre afficherait automatiquement un
dégradé de marbre et une arche stylisée : la mise en page ne bouge pas.

## 2. Ce qui est réel, ce qui reste à confirmer

Les coordonnées du restaurant sont **réelles**, reprises des annuaires publics
(Pages Jaunes, TheFork, Tripadvisor, Instagram) :

| Élément        | Valeur en place                                        |
|----------------|--------------------------------------------------------|
| Nom            | GIOIA Odéon                                            |
| Adresse        | 35 rue Dauphine, 75006 Paris                           |
| Téléphone      | +33 1 84 75 41 75                                      |
| E-mail         | gioia.odeon@gmail.com                                  |
| Domaine        | `https://gioiaodeon.fr`                                |
| Instagram      | `@gioia.odeon`                                         |
| Facebook       | page « Gioia Paris Odéon »                             |
| TheFork        | `thefork.fr/restaurant/gioia-r831587`                  |

### À vérifier avant mise en ligne

1. **Horaires** — le site annonce un service continu de 12h à 22h30, sept jours
   sur sept, avec dernière table à 22h. C'est ce que publient les annuaires ;
   confirmez-le, et notamment l'existence éventuelle d'un jour de fermeture.
   Un seul endroit à corriger de chaque côté :
   `CONFIG.serviceGroups` / `CONFIG.closedDays` dans `assets/js/reservation.js`,
   et `BOOKABLE` / `CLOSED_DAYS` dans `server/reservations.mjs`. Pensez aussi
   au `openingHoursSpecification` du JSON-LD dans `index.html` et aux tableaux
   d'horaires en pied de page.
2. **Coordonnées GPS** — `48.8543 / 2.3385` est une approximation au niveau de
   la rue. Relevez les vraies coordonnées sur Google Maps et corrigez le bloc
   `geo` du JSON-LD dans `index.html`.
3. **Si le site reste bilingue** (`gioiaodeon.fr/fr`), préfixez les `canonical`,
   les `og:url`, le `sitemap.xml` et les liens internes en conséquence.

### Contenus de proposition, à remplacer par les vôtres

**La carte, elle, est réelle** : les 131 articles de `la-carte.html` et les 66
articles commandables de `commander.html` sont relevés sur la carte du
restaurant — entrées, viandes, pâtes, gratins, risottos, pizzas, desserts,
softs, boissons chaudes, apéritifs, cocktails, digestifs, bières et vins, avec
leurs prix. La source unique est le tableau `CARTE` de `assets/js/commande.js`
pour la commande, et le balisage de `la-carte.html` pour la carte complète ;
les deux doivent rester d'accord.

Ce qui suit, en revanche, a été écrit pour donner corps à la maquette. Ces
éléments ne décrivent pas le restaurant réel et doivent être remplacés :

- **Les chiffres de l'accueil** — 72 couverts, 240 références, 18 producteurs.
  Un commentaire HTML le signale au-dessus du bloc.
- **La frise du Lieu** — les éléments d'histoire portent sur la rue Dauphine et
  le quartier, pas sur la maison. Un commentaire HTML le signale également.
- **Les textes d'ambiance** — manifeste, descriptions des trois salles,
  privatisation.

Aucun nom de personne ni date de fondation n'est avancé : ces mentions ont été
retirées plutôt que d'inventer une identité ou une histoire.

Pour repérer ce qui reste à modifier :

```bash
grep -rn "à confirmer\|proposition à remplacer" --include=*.html .
```

## 3. La commande en ligne

`commander.html` permet de composer un panier et de venir le récupérer au
restaurant. **Il n'y a pas de livraison** et **pas de paiement en ligne** : on
règle sur place, au retrait.

Comment ça marche :

- **Les plats sont rangés par catégorie**, en onglets : entrées, viandes,
  pâtes, gratins, risottos, pizzas, desserts, softs. On en voit une à la fois —
  soixante-six plats d'affilée, c'est une page qu'on ne finit pas. Chaque
  onglet porte le nombre d'articles déjà pris dans sa catégorie.
- **Un champ de recherche** cherche dans toute la carte, nom et description,
  sans tenir compte des accents. Chaque résultat indique sa catégorie.
- Les plats déjà au panier sont teintés dans la liste, et leur bouton
  « Ajouter » cède la place au compteur.
- Sur les petits écrans, **une barre fixe en bas de page** rappelle le nombre
  d'articles et le total, et mène au panier d'un geste : le récapitulatif est
  loin sous la carte.
- Le panier vit dans le navigateur du visiteur (`localStorage`) jusqu'à
  l'envoi. Il survit à un rechargement, il ne quitte pas sa machine.
- Les créneaux de retrait suivent le service continu, de 12h à 22h30, par pas
  de quinze minutes, avec **trente minutes de préparation** — cette valeur est
  une attente courante, **à confirmer avec la cuisine** (`CONFIG.delaiMinutes`
  dans `assets/js/commande.js`, et `DELAI_MINUTES` côté serveur).
- La commande part en POST sur `/api/commandes`. Le serveur **recalcule le
  total** : celui envoyé par le navigateur ne fait foi de rien.
- Les plats du jour (« voir ardoise ») n'ont pas de prix fixe : ils ne sont pas
  commandables en ligne. Les boissons alcoolisées non plus — la vente d'alcool
  à emporter demande une licence distincte.

### Pour la mettre en production

Le stockage fichier du serveur de développement ne convient pas. Trois voies :

1. **Un outil de click & collect** (Zenchef, Innovorder, Deliverect…) : vous
   remplacez la page par leur widget et vous ne maintenez rien.
2. **Votre caisse**, si elle expose une API de commande.
3. **Votre propre service** : gardez l'API telle quelle, remplacez l'écriture
   fichier par une base, ajoutez l'e-mail de confirmation et l'impression du
   ticket en cuisine.

Pour encaisser en ligne, il faut un prestataire (Stripe, SumUp, Adyen) **et un
serveur qui garde la clé secrète** : elle n'a rien à faire dans le navigateur.
Tant que ce n'est pas branché, le règlement au retrait est la seule option — et
c'est ce que dit la page.

## 4. Le système de réservation

`assets/js/reservation.js` gère un parcours en trois étapes : **date & heure →
coordonnées → confirmation**.

- **Créneaux** générés toutes les 15 minutes à partir des horaires de service,
  avec délai minimum de 2 h le jour même, horizon de 120 jours, 8 couverts
  maximum en ligne, et fermeture du lundi / dîner du dimanche gérés
  automatiquement.
- **Validation** de chaque champ avec messages en français et attributs ARIA.
- **Confirmation** avec numéro de référence, récapitulatif et export `.ics`
  (« Ajouter à mon agenda »).
- **Mémorisation locale** des dernières demandes (`localStorage`), affichée en
  bas de la page.

Les paramètres se règlent dans l'objet `CONFIG` en haut du fichier : horaires
par jour, pas de temps, capacité par créneau, délai minimum, téléphone.

> Par défaut, sans backend, la demande est enregistrée localement et la page
> affiche une confirmation. C'est parfait pour une démonstration ; pour une
> mise en production, branchez l'une des options ci-dessous.

### Option A — l'API Node fournie

`server/reservations.mjs` sert le site **et** expose `POST /api/reservations`
(validation côté serveur : horaires d'ouverture, capacité du créneau, doublons
de couverts, créneau passé) avec écriture dans `server/reservations.json`.
Activez-la en ajoutant cette ligne dans `reservation.html`, **avant**
`assets/js/reservation.js` :

```html
<script>window.GIOIA_BOOKING_ENDPOINT = '/api/reservations';</script>
```

Pour la production, remplacez le stockage fichier par votre base de données et
ajoutez l'envoi de l'e-mail de confirmation (le point d'insertion est commenté
dans le fichier).

### Option B — un logiciel de réservation du marché

Le restaurant dispose déjà d'une fiche TheFork
(`thefork.fr/restaurant/gioia-r831587`) : le plus simple est de pointer
`window.GIOIA_BOOKING_ENDPOINT` vers leur API, ou de remplacer le panneau du
formulaire par le widget TheFork (option C). Un webhook (Zapier, Make,
Formspree) fonctionne également. Le
corps envoyé est un JSON plat :

```json
{
  "reference": "GIO-4KQ7ZP", "party": 4, "date": "2026-09-12", "service": "diner",
  "time": "20:15", "area": "cave", "occasion": "Anniversaire",
  "firstName": "…", "lastName": "…", "email": "…", "phone": "…",
  "notes": "…", "newsletter": false, "createdAt": "2026-09-09T18:00:00.000Z"
}
```

La réponse JSON est fusionnée avec les données locales : renvoyez par exemple
`{"reference": "…"}` pour imposer votre propre numéro de dossier.

### Option C — widget de l'éditeur

Remplacez le bloc `<div class="booking__panel">` par l'iframe fournie par votre
prestataire. Le reste de la page (récapitulatif, FAQ, structured data) reste
utile pour le référencement.

## 5. Référencement

Déjà en place :

- Titres et méta-descriptions uniques par page, `canonical`, `lang="fr"`.
- Open Graph + Twitter Cards sur les 4 pages.
- Données structurées JSON-LD : `Restaurant` (avec horaires, adresse, géo,
  `ReserveAction`), `WebSite`, `Menu` complet, `ImageGallery`, `FAQPage` et
  `BreadcrumbList`.
- `sitemap.xml`, `robots.txt`, `site.webmanifest`, favicon SVG.
- Hiérarchie sémantique stricte (un seul `h1` par page), `alt` rédigés,
  fils d'Ariane, liens internes croisés.
- Performance : aucune librairie externe, images en `loading="lazy"` avec
  `width`/`height` déclarés (pas de décalage de mise en page), polices en
  `display=swap`, animations en `transform`/`opacity` uniquement.

À faire après la mise en ligne :

1. Remplacer le domaine de démonstration partout (voir § 2).
2. Régénérer `sitemap.xml` avec les vraies URL et les dates `lastmod`.
3. Déclarer le site dans la Google Search Console et créer / réclamer la fiche
   Google Business Profile (les horaires du JSON-LD doivent correspondre).
4. Vérifier les données structurées :
   <https://search.google.com/test/rich-results>.
5. Compresser les photos (200–350 Ko) et fournir `og-image.jpg` en 1200 × 630.

## 6. Accessibilité & confort

- Lien d'évitement, focus visible, navigation clavier complète (menu, galerie,
  accordéons, formulaire).
- Visionneuse photo avec piège de focus, `Échap`, flèches gauche/droite.
- `prefers-reduced-motion` : toutes les animations sont neutralisées.
- Contrastes conformes AA sur le fond sombre, zones tactiles ≥ 44 px.

## 7. Personnaliser le design

Tout part des variables CSS en tête de `assets/css/style.css` :

```css
/* Palette */
--blanc: #FFFFFF;  --blanc-2: #FAF9F7;  --blanc-3: #F2EFEA;
--encre: #3E3E3E;  --encre-forte: #1C1C1C;  --noir: #000000;
--or: #BF9D5D;     --or-fonce: #A8853F;     --or-clair: #E8C98F;
--terracotta: #9A4E2E;

/* Échelle — relevée sur la référence à 1280 px de large :
   titre de section 28 px, corps 13 px sur 17,5 px d'interligne. */
--fs-h1: clamp(1.5rem, 2.6vw, 2.2rem);
--fs-h2: clamp(1.45rem, 2.2vw, 2rem);
--fs-h3: clamp(1.15rem, 1.5vw, 1.45rem);
--fs-body: clamp(0.85rem, 1.02vw, 1rem);

/* Espacements — 47 px de padding, soit 94 px entre deux blocs. */
--gutter: clamp(1.25rem, 3.5vw, 2.75rem);
--section-y: clamp(2.25rem, 3.7vw, 3.5rem);
--maxw: 1160px;
--radius-photo: 0px;
--header-h: 104px;
```

Les alias `--ink`, `--stone`, `--gold`, `--text`, `--text-strong` pointent vers
ces valeurs. Changer `--or` et `--font-display` suffit à donner une autre
identité à l'ensemble.

Trois « îlots » renversent ces jetons pour écrire en clair sur fond sombre :
l'en-tête posé sur le hero, la visionneuse, et le hero lui-même. **Si vous
ajoutez une couleur, passez par un jeton sémantique** (`--text-strong`) et non
par la couleur brute (`--encre-forte`) : sans quoi le titre reste noir sur les
fonds sombres et disparaît.

### Les trois règles qui tiennent tout

**1. Rien n'est en capitales, rien n'est interlettré, rien n'est en italique.**
Seul l'écusson de la marque porte des capitales espacées. C'est la sobriété de
la référence — et la première chose qui revient quand on « embellit » une page.

**2. Rien ne s'anime à l'entrée à l'écran.** C'est une mesure : sur 24 paires
d'images consécutives de la vidéo de référence, le contenu qui arrive par le
bas se déplace exactement comme celui déjà posé. Le seul mouvement lié au
défilement est le ruban photographique — deux rangées en sens opposés à 72 px
par seconde. Le reste est du survol.

**3. Hors du hero de l'accueil, on n'écrit jamais par-dessus une
photographie.** Les images sont montrées telles quelles, sans voile ni dégradé ;
le texte se pose sur le papier, à côté ou en dessous.

Cette troisième règle vient elle aussi d'une mesure. Sur ces photographies, le
fond des zones de texte tombe à 0,20–0,47 de luminance : l'encre n'y passe pas.
Et le texte blanc y descend à 1,6:1 de contraste dans le pire cas — une lampe
ou un reflet derrière une lettre. Aucune des deux options ne tenait sans voile,
et le voile abîmait les images.

**Le hero de l'accueil est l'exception assumée** : l'image occupe tout l'écran
et porte deux voiles, en haut pour l'en-tête, en bas pour l'accroche. Le voile
bas monte aux trois quarts de la hauteur. Mesuré sur les cinq plans : 9,3 à
17,7:1 pour l'accroche, 7,1 à 10,4:1 pour le bouton.

### Aplats

| Élément                | Fond      | Texte                       |
|------------------------|-----------|-----------------------------|
| Corps du site          | `--blanc` | `--encre` / `--encre-forte` |
| Bouton de réservation  | `--noir`  | blanc (or au survol)        |
| Bouton principal plein | `--or`    | `--encre-forte` (6,8:1)     |
| Pied de page           | `--or`    | `--encre-forte` (4,7 à 6,7:1) |

La référence écrit en blanc sur l'or — 2,5:1, sous le seuil lisible. On garde
l'aplat et on passe le libellé à l'encre.

### Si vous ajoutez une section

Ne posez pas de texte sur l'image : la photographie dans une `.photo-band` ou
un `.duo`, le texte dans un `.container` à côté. Et réservez aux bandes pleine
largeur des photographies **en paysage** — un portrait y perd son sujet.

## 8. Le site en PDF

`assets/gioia-odeon-site.pdf` est un rendu du site à 1440 px de large : quatre
pages, une par page du site, avec des signets de navigation et du texte
sélectionnable. Il sert à faire relire ou valider la maquette par quelqu'un
qui n'a pas le site sous la main.

Une fois le site en ligne, il est téléchargeable depuis votre propre domaine :
`https://gioiaodeon.fr/assets/gioia-odeon-site.pdf`.

C'est un fichier figé : il ne se met pas à jour quand le site change. Pour le
régénérer, imprimer chaque page en PDF depuis un navigateur à 1440 px de large,
en veillant à faire défiler la page entière au préalable pour déclencher les
animations d'apparition et le chargement des images.

Trois pièges à connaître si vous refaites l'export :

- **Le hero fait `100svh`.** À l'impression, la « fenêtre » est la page entière :
  le hero s'étire alors sur les 10 000 px du document et mange tout le reste.
  Fixez-lui une hauteur d'écran avant d'imprimer.
- **La parallaxe** pose un décalage calculé au défilement. Sur une page rendue
  d'un seul tenant, il fige les images de travers : neutralisez-la.
- **Les révélations au scroll** laissent des blocs invisibles si la page n'a pas
  été parcourue : forcez `opacity: 1` et `clip-path: none` sur `[data-reveal]`.
