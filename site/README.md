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
├── README.md             Ce document
├── WEBFLOW.md            Cahier de reconstruction Webflow
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
/* Palette — blanc pur, or, noir. Le fond ne porte aucune teinte :
   toute la chaleur vient de l'or. */
--blanc:        #FFFFFF;   /* fond principal */
--blanc-2:      #FAF9F7;   /* surface alternée, à peine perceptible */
--blanc-3:      #F2EFEA;   /* surface appuyée */
--sable:        #DDCEC2;   /* bandes séparatrices */
--encre:        #3E3E3E;   /* texte courant */
--encre-forte:  #1C1C1C;   /* titres */
--noir:         #000000;   /* bouton de réservation, en-tête */
--or:           #BF9D5D;   /* accent : filets, prix, liens, pied de page */
--or-fonce:     #A8853F;
--or-clair:     #E8C98F;   /* version lisible sur photographie sombre */
--terracotta:   #9A4E2E;   /* alertes du formulaire, seul écart à la palette */

--font-display: "Cormorant Garamond", …   /* titres */
--font-sans:    "Jost", …                 /* texte, libellés, navigation */
--section-y, --gutter, --maxw, --ease, --dur, --radius-photo
```

Les alias `--ink`, `--stone`, `--gold`, `--text`, `--text-strong` pointent vers
ces valeurs : c'est sur eux que s'appuie le reste de la feuille. Changer `--or`
et `--font-display` suffit donc à donner une autre identité à l'ensemble.

Trois « îlots » renversent ces jetons pour écrire en clair sur fond sombre :
l'en-tête posé sur le hero de l'accueil, la visionneuse, et le hero lui-même.
Chacun redéfinit `--text`, `--text-strong`, `--text-muted`, `--line` et `--gold`
localement. **Si vous ajoutez une couleur, passez par un jeton sémantique**
(`--text-strong`) et non par la couleur brute (`--encre-forte`) : sans quoi le
titre reste noir sur les fonds sombres et disparaît.

### Aplats et bandes

| Élément                | Fond            | Texte                     |
|------------------------|-----------------|---------------------------|
| Corps du site          | `--blanc`       | `--encre` / `--encre-forte` |
| Sections alternées     | `--blanc-2/3`   | idem                      |
| Bouton de réservation  | `--noir`        | blanc (or au survol)      |
| Bouton principal plein | `--or`          | `--encre-forte` (6,8:1)   |
| Pied de page           | `--or`          | `--encre-forte` (4,7 à 6,7:1) |

La référence écrit en blanc sur l'or (2,5:1, sous le seuil lisible). On garde
l'aplat et on passe le libellé à l'encre.

### La règle des photographies

**Hors du hero de l'accueil, on n'écrit jamais par-dessus une photographie.**
Les images sont montrées telles quelles, sans voile ni dégradé ; le texte se
pose sur le papier, à côté ou en dessous :

- les pages intérieures ouvrent sur un bloc de titre (`.page-head`), puis une
  bande photographique pleine largeur (`.photo-band`) ;
- les cartes des trois espaces portent leur légende sous l'image ;
- la bande et le bandeau d'appel sont une photographie pleine largeur suivie
  d'un bloc de texte sur le papier ;
- la mosaïque (`.mosaic`) ne porte aucun texte.

Cette règle vient d'une mesure, pas d'un principe. Sur ces photographies, le
fond des zones de texte tombe à 0,20–0,47 de luminance : l'encre n'y passe pas.
Et le texte blanc y descend à 1,6:1 de contraste dans le pire cas — une lampe
ou un reflet derrière une lettre. Aucune des deux options ne tenait sans voile,
et le voile abîmait les images.

**Le hero de l'accueil est l'exception assumée**, comme sur les hero vidéo du
même genre : l'image occupe tout l'écran et porte deux voiles, en haut pour
l'en-tête, en bas pour l'accroche. Le voile bas monte aux trois quarts de la
hauteur — l'accroche se pose vers 70 % et les plans clairs la mangeaient.
Mesuré sur les cinq plans : 9,3 à 17,7:1 pour l'accroche, 7,1 à 10,4:1 pour le
bouton.

La visionneuse est le second espace sombre du site : on y regarde une
photographie, le noir sert à l'isoler.

Conséquence pratique : si vous ajoutez une section, ne posez pas de texte sur
l'image. Mettez la photographie dans une `.photo-band` et le texte dans un
`.container` juste après.

Autre point à garder en tête : une bande pleine largeur recadre sévèrement.
Réservez-lui des photographies **en paysage** — un portrait y perd l'essentiel
de son sujet.

### Les animations

Cinq mécaniques, pas une de plus. Chacune se reconstruit en une interaction
Webflow (voir `WEBFLOW.md`).

| Mécanique            | Où                                 | Déclencheur        |
|----------------------|------------------------------------|--------------------|
| Fondu montant        | `[data-reveal="up"]` — partout     | entrée à l'écran   |
| Volet qui s'ouvre    | `[data-reveal="mask"]` — photos    | entrée à l'écran   |
| Décalage en cascade  | `[data-reveal-group="120"]`        | entrée à l'écran   |
| Filet d'or qui se tire | `.heading-rule` sous les titres  | entrée à l'écran   |
| Parallaxe            | `[data-parallax]` — bandes pleines | défilement continu |

S'y ajoutent le fondu enchaîné du hero (5 plans, 6,5 s chacun), le zoom lent au
survol des photographies, et le remplissage des boutons par le bas.

Tout est neutralisé sous `prefers-reduced-motion: reduce`.

## 7. Le site en PDF

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
