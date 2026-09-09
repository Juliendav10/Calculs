# Photographies

Déposez vos photos **dans ce dossier**, en respectant exactement ces noms de
fichiers. Tant qu'un fichier est absent, le site affiche automatiquement un
cadre décoratif (dégradé chaud + arche de pierre) : rien ne casse, la mise en
page reste identique.

| Fichier             | Sujet attendu                                   | Format conseillé      |
|---------------------|--------------------------------------------------|-----------------------|
| `salle.jpg`         | La salle du rez-de-chaussée                      | paysage, 2000 × 1333  |
| `cave-voutee.jpg`   | La cave voûtée en pierre                         | paysage, 2000 × 1333  |
| `bar.jpg`           | Le comptoir du bar                               | paysage, 2000 × 1333  |
| `facade.jpg`        | La façade rue Dauphine                           | paysage, 2000 × 1125  |
| `fusilli.jpg`       | Une assiette signature                           | portrait ou carré     |
| `salle-detail.jpg`  | Un détail de salle (galerie)                     | paysage, 1600 × 1000  |
| `og-image.jpg`      | Visuel de partage réseaux sociaux                | **1200 × 630** exact  |

## Bonnes pratiques

- Compressez avant mise en ligne (viser 200–350 Ko par image) : par exemple avec
  [Squoosh](https://squoosh.app) ou `cwebp`.
- Vous pouvez servir du WebP ou de l'AVIF en gardant l'extension `.jpg`, ou bien
  remplacer les extensions dans les quatre fichiers HTML.
- Les dimensions `width` / `height` sont déjà déclarées dans le HTML pour éviter
  tout décalage de mise en page (bon pour le score Core Web Vitals).
- L'attribut `alt` de chaque image est rédigé pour le référencement : adaptez-le
  si le sujet de votre photo diffère.
