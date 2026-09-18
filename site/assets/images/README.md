# Photographies

Les photographies du restaurant sont en place, au format WebP.

| Fichier             | Sujet                                        | Dimensions | Où il apparaît                                          |
|---------------------|----------------------------------------------|------------|---------------------------------------------------------|
| `salle.webp`        | La salle du rez-de-chaussée                  | 680 × 510  | hero de l'accueil, carte « La Salle », hero réservation, galerie |
| `cave-voutee.webp`  | La cave voûtée                               | 680 × 453  | carte « La Cave voûtée », hero du Lieu, bandeau de la Carte, galerie |
| `bar.webp`          | Le comptoir                                  | 680 × 453  | carte « Il Bar », section Bar du Lieu, galerie           |
| `facade.webp`       | La façade de jour                            | 680 × 453  | bande « Si mangia bene », bandeau du Lieu, galerie       |
| `facade-nuit.webp`  | La façade le soir                            | 680 × 453  | bandeau d'appel de l'accueil                             |
| `fusilli.webp`      | Fusilli et verre de vin blanc                | 382 × 510  | hero de la Carte, section Cuisine, galerie               |
| `aperitivo.webp`    | Cocktails et pâtes                           | 408 × 510  | section Signatures de l'accueil, galerie                 |
| `og-image.jpg`      | Visuel de partage (façade de nuit recadrée)  | 1200 × 630 | balises `og:image` et `twitter:image` des 4 pages        |

## ⚠️ Résolution : à remplacer dès que possible

Ces fichiers font **680 pixels de large au maximum**. C'est très insuffisant
pour les emplacements pleine largeur :

- un hero occupe jusqu'à 2560 px sur un grand écran, et le double sur un écran
  Retina — l'image est donc agrandie 3 à 4 fois et paraît floue ;
- les cartes en portrait recadrent une photo paysage : il ne reste qu'une
  bande verticale de la source, encore réduite en résolution utile.

Ce qui a été fait pour limiter la casse : l'amplitude du zoom lent du hero a été
réduite (1,06 au lieu de 1,12) et les voiles sombres ont été renforcés, ce qui
masque une partie du manque de netteté.

**Ce qu'il faudrait :** les fichiers d'origine du photographe, en **2400 px de
large minimum** pour `salle`, `facade`, `facade-nuit` et `cave-voutee`, et
**1400 px minimum** pour les autres. Déposez-les ici sous les mêmes noms — le
HTML n'a alors rien à changer, seuls les attributs `width` / `height` sont à
mettre à jour (ils servent à réserver le bon rapport d'image).

## Bonnes pratiques

- Le WebP est conservé : à qualité égale il pèse 25 à 35 % de moins que le JPEG
  et il est lu par tous les navigateurs actuels.
- Le visuel de partage reste en JPEG : certains robots de réseaux sociaux ne
  savent toujours pas lire le WebP.
- Viser 200 à 350 Ko par photographie une fois en pleine résolution.
- Les attributs `alt` sont rédigés pour le référencement et pour les lecteurs
  d'écran : adaptez-les si vous changez le sujet d'une photographie.
