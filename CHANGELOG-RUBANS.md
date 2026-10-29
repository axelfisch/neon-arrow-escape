# Neon Arrow — Rubans et navigation tactile

## Jouer

- Une pression courte lance la flèche ; maintenir 350 ms montre sa trajectoire sans dépenser de vie ni d'indice.
- Glisser déplace la vue agrandie ; pincer ajuste le zoom (1× à 4×).
- Les boutons Agrandir, Réduire et Recentrer restent disponibles.
- L'option Aperçu avant tap est facultative, même sur les grands tableaux.
- Les flèches se déroulent par leur tête. Leurs cases sont immédiatement libérées pour enchaîner les départs.
- Annuler restaure aussi une vie perdue. Les indices consommés restent consommés.
- Le clavier permet de sélectionner une flèche avec Tab, de lancer avec Entrée/Espace et d'inspecter avec I.

## Formes complexes

Les niveaux 1–20 et 63 utilisent les 21 géométries du projet Arrow Escape de Umang, converties en TypeScript/JSON. Le reste de la campagne est conservé. Les noms et l'ordre ont été adaptés ; la difficulté ressentie de cette première sélection reste à équilibrer en jouant.

La convention du moteur est désormais explicite : chaque chemin est ordonné de la tête vers la queue, y compris quand le corps dépasse la tête sur un autre axe. Les trajets bloqués par leur propre corps sont refusés.

## Copyright

Voir THIRD_PARTY_NOTICES.md et public/licenses/arrow-escape-MIT.txt. La notice MIT complète est copiée dans le site compilé ; les crédits du jeu donnent accès à la licence et au dépôt d'origine.

## Vérification

- `npm test` : tests du moteur réel, de la campagne, des animations géométriques, des sessions et du cadrage, plus les tests existants.
- `npm run typecheck` : vérification TypeScript.
- `npm run build:netlify` : compilation du site statique dans `site/`.

Ces contrôles ne remplacent pas la validation des gestes sur un iPhone physique. La vérification visuelle automatisée a été interrompue pendant cette session et n'est pas déclarée réussie.

## Publication

Netlify reconstruit désormais les sources à chaque déploiement. Le ZIP `neon-arrow-netlify.zip` est également régénéré pour une installation manuelle. Cette version est préparée sur une branche de travail ; aucune publication de production ni signature iOS n'est réalisée.
