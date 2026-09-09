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
├── assets/
│   ├── css/style.css     Design system complet (tokens, composants, animations)
│   ├── js/main.js        Préchargeur, transitions, révélations, galerie, nav
│   ├── js/reservation.js Moteur de réservation
│   └── images/           ← déposez vos photos ici (voir images/README.md)
├── server/
│   └── reservations.mjs  Serveur de dev + API de réservation (Node, 0 dépendance)
├── favicon.svg
├── robots.txt
├── sitemap.xml
└── site.webmanifest
```

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

Ces éléments ont été écrits pour donner corps à la maquette. Ils ne décrivent
pas le restaurant réel et doivent être remplacés :

- **La carte** (`la-carte.html`) — tous les plats, descriptions et prix, le menu
  dégustation, les formules et la sélection de vins.
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

## 3. Le système de réservation

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

## 4. Référencement

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

## 5. Accessibilité & confort

- Lien d'évitement, focus visible, navigation clavier complète (menu, galerie,
  accordéons, formulaire).
- Visionneuse photo avec piège de focus, `Échap`, flèches gauche/droite.
- `prefers-reduced-motion` : toutes les animations sont neutralisées.
- Contrastes conformes AA sur le fond sombre, zones tactiles ≥ 44 px.

## 6. Personnaliser le design

Tout part des variables CSS en tête de `assets/css/style.css` :

```css
--carrara:     #FBFAF7;  /* fond principal, blanc chaud */
--carrara-2:   #F3F0E9;  /* surface alternée */
--inchiostro:  #17130F;  /* texte */
--rosso:       #8E2A33;  /* rosso di Maremma — accent principal */
--verde:       #35503F;  /* verde di Prato — titres en italique */
--terracotta:  #9A4E2E;  /* terre de Sienne — alertes, fermetures */
--notte:       #14100C;  /* rideaux, visionneuse, voiles sur photo */
--font-display: "Cormorant Garamond", …
--font-sans: "Jost", …
--section-y, --gutter, --maxw, --ease, --dur
```

La palette reprend les trois marbres des façades toscanes : bianco di Carrara,
verde di Prato, rosso di Maremma. Le filet `.rule-tricolore` (pied de page) et
`.rule-v` (accueil) les empilent dans cet ordre.

Les alias `--ink`, `--stone` et `--gold` pointent vers ces valeurs : c'est sur
eux que s'appuie le reste de la feuille. Changer `--rosso` et `--font-display`
suffit donc à donner une autre identité à l'ensemble du site.

**Voiles sur photographie.** Le hero, les bandeaux, les cartes d'espaces posent
du texte par-dessus une image. Le texte y reste à l'encre : les photographies
sont couvertes d'un voile de lumière chaude (ivoire → abricot), jamais d'un
fond noir. Un seul bloc CSS renforce les gris moyens dans ces zones
(recherchez « Sur photographie » dans la feuille) ; si vous ajoutez une section
de ce type, ajoutez son sélecteur à cette liste et donnez-lui un voile dense
là où le texte se pose.

Deux règles pratiques tirées de l'expérience :

- **une photographie sombre ne supporte pas un voile clair** — elle vire au
  beige boueux. Réservez ces emplacements aux images lumineuses ; la façade de
  nuit, par exemple, est en galerie et sert de visuel de partage, pas de fond.
- la visionneuse est le seul espace resté sombre du site, parce qu'on y regarde
  une photographie et que le noir sert à l'isoler.
