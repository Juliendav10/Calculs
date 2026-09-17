# GIOIA Odéon — cahier de reconstruction Webflow

Ce document sert à refaire le site dans Webflow **sans avoir à lire le code**.
Il donne les valeurs exactes : couleurs, polices, échelle typographique,
espacements, structure section par section, et la liste des interactions.

Le site en HTML/CSS reste la maquette de référence : ouvrez-le à côté de
Webflow pour comparer. Si un détail n'est pas ici, c'est qu'il n'est pas
essentiel — ne le reproduisez pas au pixel.

---

## 1. Variables Webflow (Site settings → Design → Variables)

### Couleurs

| Nom de la variable | Valeur    | Usage                                        |
|--------------------|-----------|----------------------------------------------|
| `Blanc`            | `#FFFFFF` | Fond principal                               |
| `Blanc 2`          | `#FAF9F7` | Section alternée, à peine perceptible        |
| `Blanc 3`          | `#F2EFEA` | Section appuyée                              |
| `Sable`            | `#DDCEC2` | Bandes séparatrices                          |
| `Encre`            | `#3E3E3E` | Texte courant                                |
| `Encre forte`      | `#1C1C1C` | Titres, texte sur l'or                       |
| `Noir`             | `#000000` | Bouton « Réserver » de l'en-tête             |
| `Or`               | `#BF9D5D` | Accent : filets, prix, liens, pied de page   |
| `Or foncé`         | `#A8853F` | Survol des liens or                          |
| `Or clair`         | `#E8C98F` | Or lisible sur photographie sombre           |
| `Terracotta`       | `#9A4E2E` | Alertes du formulaire, seul écart            |

Ces couleurs sont relevées sur la référence. **Ne posez jamais de blanc sur
l'or** : 2,5:1 de contraste, illisible. Sur l'or, écrivez en `Encre forte`.

### Polices (Google Fonts, à ajouter dans Project Settings → Fonts)

- **Cormorant Garamond** — poids 300, 400, 500 + italique 300, 400 → titres
- **Jost** — poids 200, 300, 400, 500 → texte, libellés, navigation, boutons

---

## 2. Échelle typographique

Webflow accepte `clamp()` dans les champs de taille : copiez les valeurs telles
quelles, elles gèrent seules le responsive et vous éviterez trois jeux de
réglages par breakpoint.

| Rôle            | Police   | Taille                              | Graisse | Interligne | Interlettrage |
|-----------------|----------|-------------------------------------|---------|------------|---------------|
| Hero (chiffres) | Cormorant| `clamp(3.5rem, 12vw, 11rem)`        | 300     | 1.02       | -0.015em      |
| H1              | Cormorant| `clamp(2.75rem, 6.5vw, 5.5rem)`     | 300     | 1.02       | -0.015em      |
| H2              | Cormorant| `clamp(2.1rem, 4.6vw, 4rem)`        | 300     | 1.02       | -0.015em      |
| H3              | Cormorant| `clamp(1.5rem, 2.4vw, 2.25rem)`     | 300     | 1.02       | -0.015em      |
| Chapô (lead)    | Jost     | `clamp(1.05rem, 1.35vw, 1.35rem)`   | 300     | 1.75       | 0             |
| Texte           | Jost     | `clamp(0.975rem, 1.05vw, 1.0625rem)`| 300     | 1.85       | 0             |
| Petit texte     | Jost     | `0.8125rem`                         | 300     | 1.85       | 0             |
| Libellé / bouton| Jost     | `0.6875rem`                         | 400     | 1.6        | **0.22em**, MAJUSCULES |

L'accroche du hero est un cas à part : Jost 300, `clamp(0.9rem, 1.45vw, 1.2rem)`,
interlettrage `0.22em`, interligne 1.75, en majuscules, centrée.

Les seconds membres de titre sont en **italique Cormorant** (`Le produit, / *puis
le silence*`) — même couleur que le titre, pas de couleur d'accent.

---

## 3. Espacements et grille

| Jeton            | Valeur                          | Où                                    |
|------------------|---------------------------------|---------------------------------------|
| Largeur max      | `1600px`                        | Conteneur de section                  |
| Gouttière        | `clamp(1.25rem, 5vw, 5rem)`     | Marge intérieure gauche/droite        |
| Hauteur section  | `clamp(5rem, 12vw, 11rem)`      | Padding haut ET bas de chaque section |
| Section chapeau  | `clamp(3.5rem, 7.5vw, 7rem)`    | Le bloc juste sous le hero, plus serré|
| Hauteur en-tête  | `88px` (72px sous 640px)        |                                       |
| Coins des photos | `clamp(8px, 0.85vw, 14px)`      | Sauf mosaïque : coins vifs            |

**Les boutons ont les coins vifs** (rayon 0), comme sur la référence.

Breakpoints utilisés : 1100, 900, 880, 760, 700, 640, 560 px. Dans Webflow,
rabattez-les sur Tablet (991), Mobile landscape (767) et Mobile (478) — les
`clamp()` absorbent le reste.

---

## 4. En-tête

Grille à **trois colonnes** : `1fr auto 1fr`.

- **gauche** — navigation : ACCUEIL · LA CARTE · LE LIEU (Jost, libellé,
  interlettrage 0.22em, majuscules). La page courante porte un filet d'or
  dessous.
- **centre** — marque : `GIOIA` en Cormorant, interlettrage 0.24em, et en
  dessous `RISTORANTE · PARIS 6E` en libellé.
- **droite** — le téléphone `+33 1 84 75 41 75` (visible à partir de 1100px)
  puis le bouton **RÉSERVER** : fond noir, texte blanc, coins vifs. Au survol,
  l'or monte par le bas et le texte passe au noir.

« Réserver » ne figure **pas** dans la navigation : le bouton le porte.

Sur l'accueil, l'en-tête est posé sur le hero plein écran : il passe au clair
(texte et filets en blanc, or clair pour les accents). Dès qu'on défile, il
prend un fond blanc et revient à l'encre. Dans Webflow : deux états de la même
Navbar, pilotés par une interaction « While page is scrolling » ou un
composant `is-stuck`.

---

## 5. Les sections, dans l'ordre (page d'accueil)

1. **Hero plein écran** (`100svh`)
   Cinq photographies en fondu enchaîné, 6,5 s chacune, transition 1,8 s.
   Chaque plan avance d'un lent travelling (`scale 1.02 → 1.07` en 9 s).
   Un emblème d'or (trois cercles concentriques) paraît le temps du changement.
   Deux voiles sombres : en haut pour l'en-tête, en bas pour l'accroche — le
   voile bas monte aux trois quarts de la hauteur.
   Contenu : l'accroche sur deux lignes, un bouton bordé blanc, et une pastille
   ronde en bas qui invite à défiler.

2. **Chapeau centré** — un paragraphe court, le nom du restaurant en Cormorant
   au milieu, puis deux boutons : **Réserver** (or plein, texte encre) et
   **Voir la carte** (bordé). Largeur max 880px, centré.

3. **Manifeste** — deux colonnes asymétriques (0.34 / 0.66) : à gauche le
   surtitre `01 — La maison` et un filet vertical, à droite une citation en
   Cormorant, un chapô, une signature. Dessous, quatre chiffres clés.

4. **Bande + phrase** — une photographie pleine largeur (parallaxe), puis une
   phrase en italien sur le papier, centrée.

5. **Les trois espaces** — surtitre + titre à gauche, chapô à droite, puis
   trois cartes décalées verticalement (la 2ᵉ descend de `clamp(2rem, 5vw,
   4.5rem)`, la 3ᵉ de `clamp(0.75rem, 2vw, 1.75rem)`). Chaque
   carte : photo, puis sous l'image un petit libellé, un titre H3 et deux lignes.

6. **La cuisine** — deux colonnes inversées : photo en portrait à gauche, texte
   à droite. Sous le texte, deux actions : un bouton **Réserver** bordé et un
   lien fléché **Voir la carte complète** (la flèche glisse au survol).

7. **Signatures** — photo en portrait + quatre plats avec un filet pointillé
   entre le nom et le prix, puis un bouton.

8. **Appel à réserver** — photographie pleine largeur (parallaxe) puis un bloc
   centré : surtitre, titre, chapô, deux boutons.

9. **Informations** — **trois colonnes centrées**, chacune avec un titre
   Cormorant souligné d'un filet d'or : *Informations* (horaires, adresse,
   téléphone), *Groupes & privatisation*, *Nous rejoindre*. Les liens y sont
   soulignés en permanence.

10. **Mosaïque** — sept photographies pleine largeur, tuiles de largeurs
    inégales, filet blanc de 7px entre elles, coins vifs. Grille de 12 colonnes :
    rangée 1 en `2+4+3+3`, rangée 2 en `4+5+3`. Hauteur de rangée
    `clamp(150px, 18vw, 290px)`. Au survol, l'image zoome lentement.

11. **Pied de page** — **aplat d'or** (`#BF9D5D`), texte à l'encre forte.
    Quatre colonnes : la marque (nom en Cormorant, description, trois cercles
    de réseaux sociaux), Adresse, Horaires, Contact. Puis une ligne du bas
    avec le copyright et trois liens.

Les pages intérieures ouvrent toutes sur : bloc de titre (surtitre, H1, fil
d'Ariane) puis bande photographique pleine largeur au ratio 12/5.

---

## 6. Les interactions à reconstruire

Cinq mécaniques, toutes en **While scrolling in view** ou **Scroll into view**.

| # | Interaction              | Déclencheur        | Réglage                                                                 |
|---|--------------------------|--------------------|-------------------------------------------------------------------------|
| 1 | **Fondu montant**        | Scroll into view   | De `opacity 0, Y +52px` à `opacity 1, Y 0`. Durée 1,15 s, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Offset bas 8 %. |
| 2 | **Volet qui s'ouvre**    | Scroll into view   | Sur l'image : `clip-path inset(0 0 100% 0)` → `inset(0)`. Durée 1,25 s, même easing. Dans Webflow, faute de clip-path : une `div` blanche par-dessus dont la hauteur passe de 100 % à 0 %. |
| 3 | **Cascade**              | Scroll into view   | Même animation que 1 ou 2, mais chaque enfant retardé de 80 à 140 ms selon les blocs (80 pour les signatures, 90 pour la mosaïque et les chiffres, 110 pour les colonnes de texte, 120 pour le chapeau, 130 pour les informations, 140 pour les cartes). |
| 4 | **Filet d'or qui se tire** | Scroll into view | Le trait sous les titres : `scaleX 0 → 1`, origine à gauche (au centre si le titre est centré). Durée 1,1 s, **retard 0,25 s** pour qu'il suive le titre. Largeur 64px, épaisseur 1px, couleur `Or`. |
| 5 | **Parallaxe**            | While scrolling in view | Sur les bandes photographiques pleine largeur uniquement. L'image est agrandie de 16 % et se déplace de `+7 %` à `-7 %` de la hauteur du cadre (plafonné à 46px) pendant la traversée de l'écran. |

À cela s'ajoutent, en interactions d'élément :

- **Hero** — le carrousel de cinq plans (Webflow Slider en fondu, 6,5 s, pas de
  flèches, pas de puces) et le travelling `scale 1.02 → 1.07` sur le plan actif.
- **Photographies** — zoom au survol, `scale 1 → 1.06` en 1,4 s.
- **Boutons** — un aplat qui monte par le bas au survol (`scaleY 0 → 1`, origine
  en bas), avec la couleur du texte qui bascule en même temps.
- **Liens fléchés** — la flèche glisse de 5px vers la droite au survol.
- **Liens soulignés** — le trait se tire de la droite vers la gauche.

**Pensez à cocher la préférence de mouvement réduit** dans les réglages
d'interaction Webflow : tout le site la respecte aujourd'hui.

---

## 7. Ce qu'il ne faut pas perdre en route

1. **On n'écrit pas par-dessus une photographie**, sauf dans le hero de
   l'accueil. C'est une mesure, pas un goût : voir `README.md`, section 6.
2. **Le blanc sur l'or est illisible.** Sur l'aplat d'or, écrivez à l'encre.
3. **Les photographies font 680px de large au maximum.** C'est le premier
   facteur limitant du site. Remplacez-les par les fichiers du photographe
   avant la mise en ligne : un hero plein écran demande 2400px de large.
4. **Le contenu de la carte, les quatre chiffres clés et la chronologie sont
   des propositions**, pas des informations du restaurant. Les coordonnées,
   les horaires et l'adresse, eux, sont réels.
5. **La réservation.** Le formulaire en trois étapes de la maquette écrit dans
   un fichier local — il ne convient pas en production. Dans Webflow, branchez
   un widget (TheFork, Zenchef, SevenRooms, Guestonline) ou un formulaire
   Webflow relié à votre boîte mail. Voir `README.md`, section 3.
