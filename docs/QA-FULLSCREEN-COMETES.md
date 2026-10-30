# Plein écran et petits effets néon — 30 octobre 2026

## Changements

- Ajout d'un vrai bouton Plein écran / Quitter le plein écran, distinct du recentrage. La demande native part directement de l'action du joueur. Une vue immersive CSS reste disponible si l'API HTML n'est pas disponible ou refuse la demande.
- Le jeu, ses compteurs, ses commandes et ses dialogues restent dans le même conteneur. Le défilement de la page est restauré en quittant cette vue ou en changeant de page. Prise en charge des événements standard et WebKit et de la sortie native.
- Réduction des halos de flèches, retrait du grand cercle de sélection. Départ accompagné de neuf petites étoiles, bulles et étincelles cyan, rose, vert et bleu, plus la couleur de la flèche. Explosion de 440 ms, rayon maximal 23 px, puis traînée de sept points sur 26 px derrière la queue qui se déroule.
- Taille des particules corrigée par rapport au zoom et à la taille du plateau. Effets décoratifs limités aux huit départs les plus récents ; tous les déplacements restent animés. Aucun effet de particules en mode mouvement réduit. Aucune interception des pressions sur le plateau.
- Inspiration visuelle : les particules étoiles/cercle de Tap in Rhythm ; rendu SVG adapté au plateau, sans import d'assets ni de SDK externes. Notices MIT existantes conservées.

## Validation

- 57 tests réussis, dont API plein écran standard, API WebKit, refus et absence d'API.
- TypeScript sans erreur ; compilation Netlify réussie.
- Essais navigateur : entrée et sortie par le bouton, agrandissement du plateau, compteurs conservés, restauration du défilement ; lancement d'une flèche au clavier et apparition de la traînée sans grand halo ; petit écran observé à 355 px CSS sans débordement horizontal.
- L'émulation de fenêtre mobile de l'outil de contrôle donne une capture déformée pendant le plein écran natif ; contrôle mobile visuel effectué hors de ce mode. La sortie par Échap n'a pas été confirmée dans ce navigateur automatisé. Le bouton de sortie fonctionne.
- iPhone physique et comportement propre à Safari iOS restent à valider. Le mode immersif de secours occupe la zone du navigateur sans promettre de masquer sa barre d'adresse.
