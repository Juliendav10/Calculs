# GIOIA — site vitrine d'un restaurant italien gastronomique

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

Placez vos images dans `assets/images/` avec **exactement** ces noms :
`salle.jpg`, `cave-voutee.jpg`, `bar.jpg`, `facade.jpg`, `fusilli.jpg`,
`salle-detail.jpg`, `og-image.jpg` (1200 × 630 pour les partages sociaux).

Tant qu'une photo est absente, son cadre affiche automatiquement un dégradé
chaud et une arche de pierre stylisée : la mise en page ne bouge pas, rien ne
casse. Détails et tailles conseillées dans `assets/images/README.md`.

## 2. Remplacer les informations de démonstration

Les coordonnées ci-dessous sont **fictives** (le numéro appartient à la plage
`01 99 00 XX XX` réservée à la fiction). Remplacez-les partout avant la mise en
ligne :

| Élément                | Valeur de démonstration            | Où                                             |
|------------------------|------------------------------------|------------------------------------------------|
| Nom de domaine         | `https://www.gioia-paris.fr`       | balises `canonical`, `og:`, JSON-LD, `sitemap.xml`, `robots.txt` |
| Téléphone              | `+33 1 99 00 12 34`                | les 4 pages + `assets/js/reservation.js`       |
| E-mail                 | `contact@gioia-paris.fr`           | les 4 pages                                    |
| Adresse                | `12 rue Dauphine, 75006 Paris`     | les 4 pages + JSON-LD + `reservation.js` (.ics)|
| Coordonnées GPS        | `48.8556 / 2.3395`                 | JSON-LD de `index.html`                        |
| Réseaux sociaux        | liens Instagram / Facebook vides   | pied de page des 4 pages + `sameAs` du JSON-LD |

Recherche-remplacement rapide :

```bash
grep -rn "gioia-paris.fr\|99 00 12 34\|+33199001234" --include=*.html --include=*.js .
```

Les textes (histoire, plats, prix, horaires) se modifient directement dans le
HTML : aucune donnée n'est chargée depuis l'extérieur.

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

Pointez `window.GIOIA_BOOKING_ENDPOINT` vers un webhook (Zapier, Make, Formspree)
ou vers l'API de votre outil (TheFork, Zenchef, SevenRooms, Guestonline). Le
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
--ink: #0B0908;        /* fond */
--stone: #F4ECE2;      /* texte */
--gold: #C3A264;       /* accent */
--terracotta: #A65B39; /* accent secondaire, erreurs */
--font-display: "Cormorant Garamond", …
--font-sans: "Jost", …
--section-y, --gutter, --maxw, --ease, --dur
```

Changer `--gold` et `--font-display` suffit à donner une autre identité à
l'ensemble du site.
