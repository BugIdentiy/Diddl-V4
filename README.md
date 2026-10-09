# Les Diddl d’Angélique — V4

Refonte du site Diddl-V3 : style carnet de collection lavande, animations douces, galerie responsive, aperçu des feuilles au clic et progression de la collection.

La V3 reste indépendante. Le Google Apps Script et les images Drive d’origine sont conservés. Internet est nécessaire pour les données et les images.

## Consultation locale

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Ouvrir http://localhost:8766.

## GitHub Pages

Publier index.html et assets/ ensemble. Configurer GitHub Pages avec la branche main et le dossier / (root). Aucun build nécessaire.

## Vérification ad hoc

Commande exécutée :

```sh
uv run --with playwright python /tmp/verify_diddl_v4.py
```

30 contrôles réussis avec les vraies données : cinq formats, statistiques, recherche, filtres, pagination, affichage complet, aperçu clavier et focus, rendu à 320/375/768/1440 px, animations au défilement et mouvement réduit.
Aucune erreur JavaScript et aucune requête POST de modification de stock.
Il s’agit d’une vérification ad hoc, pas d’une suite de tests officielle du projet.
Les actions administrateur en écriture n’ont pas été testées.
