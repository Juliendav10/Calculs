# GIOIA Odéon — cahier de reconstruction Webflow

Ce document sert à refaire le site dans Webflow **sans avoir à lire le code**.

Toutes les valeurs qui suivent sont **relevées image par image sur la vidéo de
référence**, à 1280 px de large. Quand une mesure est donnée, c'est une mesure,
pas une estimation.

Le site en HTML/CSS reste la maquette : ouvrez-le à côté de Webflow pour
comparer.

---

## 1. Variables (Site settings → Design → Variables)

### Couleurs

| Variable      | Valeur    | Usage                                      |
|---------------|-----------|--------------------------------------------|
| `Blanc`       | `#FFFFFF` | Fond principal                             |
| `Blanc 2`     | `#FAF9F7` | Section alternée                           |
| `Blanc 3`     | `#F2EFEA` | Section appuyée, fond des cadres vides     |
| `Encre`       | `#3E3E3E` | Texte courant                              |
| `Encre forte` | `#1C1C1C` | Titres, navigation, texte sur l'or         |
| `Noir`        | `#000000` | Bouton « Réserver » de l'en-tête           |
| `Or`          | `#BF9D5D` | Filets sous les titres, bouton principal, pied de page |
| `Or foncé`    | `#A8853F` | Survol des liens                           |
| `Or clair`    | `#E8C98F` | Or lisible sur photographie sombre (hero)  |
| `Terracotta`  | `#9A4E2E` | Alertes du formulaire, seul écart          |

**Ne posez jamais de blanc sur l'or** : 2,5:1, illisible. La référence le fait ;
nous écrivons à l'encre, mesuré à 6,8:1.

### Polices

- **Cormorant Garamond** 400, 500 → titres
- **Jost** 300, 400, 500 → tout le reste

---

## 2. Échelle typographique

Copiez les `clamp()` tels quels dans Webflow : ils gèrent le responsive seuls.

| Rôle              | Police    | Taille                              | Graisse | Interligne |
|-------------------|-----------|-------------------------------------|---------|------------|
| Titre de page     | Cormorant | `clamp(1.5rem, 2.6vw, 2.2rem)`      | 400     | 1.12       |
| **Titre de section** | Cormorant | `clamp(1.45rem, 2.2vw, 2rem)`    | 400     | 1.12       |
| Titre de chapeau  | Cormorant | `clamp(1.25rem, 1.8vw, 1.6rem)`     | 400     | 1.12       |
| Sous-titre        | Cormorant | `clamp(1.15rem, 1.5vw, 1.45rem)`    | 400     | 1.12       |
| **Corps**         | Jost      | `clamp(0.85rem, 1.02vw, 1rem)`      | 300     | **1.35**   |
| Navigation        | Jost      | `0.875rem`                          | 400     | 1.45       |
| Bouton            | Jost      | idem corps                          | 400     | 1.35       |
| Petit texte       | Jost      | `0.8125rem`                         | 300     | 1.45       |

Mesures brutes à 1280 px : titre de section **28 px**, corps **13 px sur
17,5 px d'interligne**, navigation **14 px**.

**Rien n'est en capitales. Rien n'est interlettré. Rien n'est en italique.**
Seul l'écusson de la marque porte des capitales espacées. C'est ce qui fait la
sobriété de la référence — c'est aussi ce qu'on perd le plus facilement.

---

## 3. Grille et espacements

| Jeton              | Valeur                          | Mesure à 1280 px |
|--------------------|---------------------------------|------------------|
| Largeur max        | `1160px`                        | conteneur intérieur 1056 px |
| Gouttière          | `clamp(1.25rem, 3.5vw, 2.75rem)`| 45 px            |
| Colonne            | la moitié du conteneur          | 528 px           |
| Colonne de texte   | bridée                          | **462 px**       |
| Padding de section | `clamp(2.25rem, 3.7vw, 3.5rem)` | 47 px → **94 px entre deux blocs** |
| Hauteur d'en-tête  | `104px`                         |                  |
| Rayon des coins    | **0 partout**                   |                  |

---

## 4. En-tête

Grille à trois colonnes, `1fr auto 1fr`, fond **blanc plein** une fois collé —
ni flou, ni transparence, ni filet de séparation.

- **Gauche** — navigation : Accueil · La carte · Le lieu. Jost 14 px, casse
  normale, écart de 25 px. La page courante porte un trait fin dessous.
- **Centre** — l'**écusson** : un quadrilobe d'or de 58 px tracé au filet de
  1,1 px, avec le monogramme en Cormorant au centre. Dessous, `GIOIA` en
  9 px espacés de 0.22em, puis `PARIS` en 7 px espacés de 0.4em.
- **Droite** — la bascule `FR EN` (la langue active soulignée), puis le bouton
  **Réserver** : fond noir, texte blanc, casse normale, coins vifs.

Sur l'accueil, l'en-tête est posé sur le hero plein écran : il passe au clair.
Dès qu'on défile, fond blanc et retour à l'encre. Dans Webflow : deux états de
la Navbar, pilotés par « While page is scrolling ».

---

## 5. Les sections, dans l'ordre

1. **Hero plein écran** (`100svh`) — celui de Kinugawa, conservé : cinq
   photographies en fondu enchaîné de 6,5 s, transition 1,8 s, lent travelling
   `scale 1.02 → 1.07`, emblème d'or au changement de plan, voiles en haut et
   en bas, accroche et bouton bordé, pastille de défilement.

2. **Chapeau centré** — largeur 790 px. Titre Cormorant 23 px, **filet d'or
   sous le titre sur toute sa largeur**, paragraphe centré de 13 px, puis deux
   boutons de 122 px de large : **Réserver** (or plein, texte encre) et
   **Voir le menu** (bordé).

3. 4. 5. **Trois blocs photo / texte**, alternés gauche-droite.
   Chacun : un **couple de photographies** d'un côté, le texte de l'autre.

   Le couple, mesuré : photographie A de **441 × 352** posée en haut à gauche
   de la colonne (83,5 % de sa largeur), photographie B de **250 × 318**
   (47,3 %) décalée de **248 px à droite** et **241 px vers le bas** — elle
   chevauche la première et passe par-dessus. Le bloc mirroir inverse
   gauche et droite.

   Le texte : titre Cormorant 28 px, filet d'or dessous, deux paragraphes de
   13 px, puis un bouton **Réserver** bordé et un lien **Découvrir ›** dont le
   chevron glisse de 4 px au survol.

6. **Trois colonnes centrées** — *Informations*, *Groupes & privatisation*,
   *Recrutement*. Titre Cormorant souligné d'un filet d'or, texte de 13 px
   bridé à 30 signes, liens soulignés en permanence.

7. **Le ruban photographique** — voir §6.

8. **Pied de page** — aplat d'or, écusson centré en haut, puis trois colonnes :
   coordonnées et réseaux à gauche, lettre d'information au centre, liens
   légaux à droite. Copyright centré en bas.

---

## 6. Les animations

**La référence n'anime rien à l'entrée à l'écran.** C'est la mesure qui le dit :
sur 24 paires d'images consécutives, le contenu qui arrive par le bas se
déplace exactement comme celui déjà posé — pas de fondu, pas de translation,
pas de filet qui se trace. Ne remettez pas d'interaction « Scroll into view » :
c'est précisément ce qui trahit la copie.

Il reste trois choses.

### 6.1 Le ruban photographique — la seule animation liée au défilement

Tout ce qui suit est relevé image par image, à 1280 px de large.

| Mesure                        | Valeur                          |
|-------------------------------|---------------------------------|
| Tuile                         | **350 × 252 px**, rapport 1,389 |
| Toutes les tuiles             | **identiques** — pas de largeurs inégales |
| Pas d'une tuile à l'autre     | 357 px (constant : 357, 357, 356,5, 358, 356) |
| Filet blanc entre tuiles      | **7 px**                        |
| Filet blanc entre les rangées | **7 px**                        |
| Hauteur des deux rangées      | **252 px** — les deux pareil    |
| Vitesse                       | **67 px/s** (mesuré : -66,6 et +67,1 sur 44 paires d'images) |
| Sens                          | rangée 1 vers la gauche, rangée 2 vers la droite |
| Blanc au-dessus et au-dessous | **131 px**                      |
| Bords                         | les tuiles sont **coupées aux deux bords** : c'est un ruban, pas une grille |

Dans Webflow : deux `div` en `display: flex`, chacune contenant **deux fois la
même suite de tuiles**, animées de `0` à `-50 %` en translation X, `linear`,
en boucle infinie.

La durée se calcule : `largeur d'une suite ÷ 67`. Pour sept tuiles,
7 × 350 + 7 × 7 = 2499 px, donc **37,3 s** — la même pour les deux rangées
puisqu'elles ont la même hauteur.

**Une seule animation pour les deux rangées.** N'écrivez pas deux jeux
d'images-clés symétriques : donnez la même animation aux deux rubans et jouez
la seconde **à l'envers** (`animation-direction: reverse` ; dans Webflow, la
même interaction avec la courbe inversée). Même durée, même courbe, même
origine : l'inverse est garanti par construction et ne peut pas dériver. Vérifié
au bouclage — les deux rangées basculent à la même milliseconde, d'exactement
une suite, en miroir au centième de pixel.

Attention à trois pièges :

- **La translation doit valoir exactement une suite**, soit `-50 %` moins la
  moitié du filet (`calc(-50% - 3.5px)`), sinon la boucle saute d'un demi-filet
  à chaque tour.
- **Ne mettez pas de pause au survol.** On descend une page avec le curseur au
  milieu de l'écran : le ruban arrive dessous et s'arrête net, juste au moment
  où on le découvre. La référence continue de défiler sous le pointeur.
- **Si vous recalez les rubans à leur origine quand la section approche** —
  pour qu'on les voie partir plutôt que de les prendre en pleine course —
  faites-le **avant** qu'ils n'entrent dans le champ, et ne faites rien quand
  ils y sont déjà. Recalé sous les yeux du visiteur, le ruban saute de trois
  cents pixels.

### 6.2 Le hero (conservé de Kinugawa)

Carrousel en fondu, 5 plans, 6,5 s chacun, transition 1,8 s, travelling lent
sur le plan actif, emblème d'or pendant le changement.

### 6.3 Le survol

- Photographies : `scale 1 → 1.05` en 1,4 s.
- Boutons : un aplat qui monte par le bas (`scaleY 0 → 1`, origine en bas).
- Liens fléchés : le chevron glisse de 4 px.
- Liens soulignés : le trait se tire de la droite vers la gauche.
- L'écusson de l'en-tête pivote de 8°.

Cochez la préférence de mouvement réduit dans les réglages d'interaction.

---

## 7. Ce qu'il ne faut pas perdre en route

1. **Pas de capitales, pas d'interlettrage, pas d'italique.** C'est la première
   chose qui revient quand on « embellit » une page.
2. **Pas d'animation d'apparition.** Idem.
3. **Le corps fait 13 px avec 17,5 px d'interligne.** C'est serré. C'est voulu.
4. **Le blanc sur l'or est illisible.** Sur l'aplat d'or, écrivez à l'encre.
5. **On n'écrit pas par-dessus une photographie**, sauf dans le hero. Voir
   `README.md`, section 6.
6. **Les photographies font 680 px de large au maximum.** C'est le premier
   facteur limitant du site. Un hero plein écran en demande 2400. Récupérez les
   fichiers du photographe avant la mise en ligne.
7. **Le contenu de la carte est une proposition**, pas la carte du restaurant.
   Les coordonnées, horaires et adresse, eux, sont réels.
8. **La réservation.** Le formulaire en trois étapes de la maquette écrit dans
   un fichier local : il ne convient pas en production. Branchez un widget
   (TheFork, Zenchef, SevenRooms, Guestonline) ou un formulaire Webflow relié à
   votre boîte mail. Voir `README.md`, section 3.
