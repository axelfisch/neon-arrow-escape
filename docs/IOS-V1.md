# Neon Arrow iOS — première intégration réelle

Le design fourni par Axel depuis Claude Design a été adapté à l’application React existante. Le moteur TypeScript, les 80 niveaux et les géométries complexes restent la référence ; le moteur de démonstration de 12 flèches et support.js ne sont pas intégrés.

## Ce qui est implémenté

- Écran de partie plein écran adapté au téléphone : zones de sécurité, titre sur deux lignes distinctes, plateau prioritaire et dock de boutons d’au moins 44 px.
- Pause, redémarrage, réglages FR/EN, mode concentration, mouvement réduit, aperçu facultatif, indices, annulation et victoire.
- Campagne réelle de 80 niveaux ; défi quotidien et infini utilisent leurs générateurs existants.
- Reprise de la dernière partie de campagne avec flèches, vies, coups, indices et historique d’annulation. Temps de pause exclu du score. Les parties quotidienne et infinie ne sont pas reprises après fermeture dans cette version.
- Petit module Swift local : vibrations UIKit, partage de résultat en texte par la feuille iOS, sauvegarde atomique dans Application Support et signal d’interruption/passage en arrière-plan. Le partage d’une image de résultat n’est pas encore implémenté.
- Sons Web Audio existants, arrêtés pendant une interruption et réactivés par un geste explicite du joueur.
- Polices, code et niveaux embarqués. Aucun serveur Netlify requis pour jouer. Une sauvegarde Safari n’est pas transférée automatiquement dans l’app, car les origines sont distinctes.
- Icône issue du favicon existant, fond de lancement sombre, palette originale et notices MIT/OFL conservées.

## Projet Xcode

Ouvrir `ios/App/App.xcodeproj`, choisir le schéma App, sélectionner son équipe dans Signing & Capabilities et l’iPhone comme destination, puis lancer avec ⌘R. Identifiant : `com.aixelstudio.neonarrow`, version 1.0 (1), iPhone portrait, iOS 15 minimum.

Les frameworks officiels Capacitor/Cordova 8.5.3 sont liés directement au projet. Aucun paquet Swift distant ni CocoaPods n’est requis lors de l’ouverture du paquet préparé. Les binaires ne sont pas suivis dans Git ; `scripts/sync-ios.mjs` les récupère au besoin depuis la release officielle avec contrôle SHA-256. Le ZIP de reprise contient ces frameworks et les ressources web déjà compilées.

Depuis un nouveau clone :

```sh
npm ci --legacy-peer-deps
npm run ios:sync
npm run ios:open
```

Utiliser `npm run ios:sync` après toute modification web. Ne pas exécuter `cap sync` sur ce projet : le module Swift local et la liaison directe des frameworks sont gérés par nos scripts. `scripts/configure-ios.swift` configure le graphe du projet à partir d’une property list structurée ; il conserve les sources Swift déjà liées par le modèle officiel.

## Validation réalisée

- 62 tests réussis : solutions des 80 niveaux, trajectoires, gestes mathématiques, mouvements successifs, reprise de campagne, données invalides, restauration des vies et de l’annulation, persistance native ordonnée.
- Contrôle TypeScript et compilation Vite réussis.
- Code Swift contrôlé avec le SDK iPhoneOS 27.0, cible arm64 iOS 15.
- Compilation Xcode Debug pour appareil iOS générique réussie avec `CODE_SIGNING_ALLOWED=NO`. Cette compilation n’est pas une application signée ou installée.
- Licences présentes dans les ressources ; polices locales ; configuration Capacitor sans URL de serveur de développement.

## À vérifier sur iPhone

La session de contrôle actuelle ne dispose pas d’un navigateur pilotable. L’interface intégrée n’a donc pas encore fait l’objet d’un essai visuel interactif. Avant diffusion : installer et vérifier le rendu et les zones de sécurité, le pincement à deux doigts, l’appui long, la pause et la reprise, les sons/vibrations, le partage et un redémarrage en mode avion. Mesurer les niveaux 67, 73 et 80 (90, 144 et 164 flèches actuelles).

La grosse forme ovale blanche et bleue rapportée par Axel n’est pas diagnostiquée. Le filtre SVG décoratif et l’anneau de focus navigateur ont été retirés, la secousse globale du plateau remplacée par un signal local, mais aucune disparition ne peut être affirmée sans essai sur l’appareil concerné.

La signature Apple, l’installation physique, TestFlight et la soumission App Store ne sont pas effectués. Le site Netlify public n’est pas remplacé par cette branche iOS.

## Correctif de démarrage après le premier essai sur iPhone

Le journal de l’iPhone a confirmé une erreur JavaScript bloquante : Better Auth
était construit lors de l’import de `AuthSlot`, même avec `VITE_AUTH_ENABLED=false`.
Il tentait de valider `capacitor://localhost` comme URL HTTP(S). La création du
client est désormais conditionnée à l’activation réelle des comptes, et les
fonctions de connexion/déconnexion traitent explicitement le mode hors ligne.
La configuration et la signature Apple restent identiques.

Validation du correctif : TypeScript et build iOS web réussis ; 62 tests existants
réussis et 3 tests de régression supplémentaires. Ces derniers exécutent le vrai
client Better Auth : ils reproduisent l’exception de l’ancien constructeur sous
l’origine Capacitor, vérifient son absence en mode hors ligne et conservent le
fonctionnement du client sur un site HTTPS avec comptes activés. L’installation
du correctif et le nouveau démarrage sur l’iPhone restent à vérifier par Axel.
