export type Lang = "fr" | "en";

const dict = {
  title: { fr: "Neon Arrow", en: "Neon Arrow" },
  tag: { fr: "échappe · dégage · survit", en: "tap · escape · clear" },
  play: { fr: "Jouer", en: "Play" },
  levels: { fr: "Niveaux", en: "Levels" },
  continue: { fr: "Continuer", en: "Continue" },
  daily: { fr: "Défi du jour", en: "Daily gauntlet" },
  endless: { fr: "Infini", en: "Endless" },
  how: { fr: "Règles", en: "How to play" },
  signIn: { fr: "Connexion", en: "Sign in" },
  signOut: { fr: "Déconnexion", en: "Sign out" },
  guest: { fr: "Invité", en: "Guest" },
  back: { fr: "Retour", en: "Back" },
  quit: { fr: "Quitter", en: "Quit" },
  retry: { fr: "Rejouer", en: "Retry" },
  next: { fr: "Suivant", en: "Next" },
  menu: { fr: "Menu", en: "Menu" },
  hint: { fr: "Indice", en: "Hint" },
  undo: { fr: "Annuler", en: "Undo" },
  moves: { fr: "Coups", en: "Moves" },
  left: { fr: "restantes", en: "left" },
  won: { fr: "Niveau réussi", en: "Level cleared" },
  lost: { fr: "Plus de vies", en: "Out of lives" },
  lostHint: { fr: "Une flèche bloquée coûte une vie.", en: "A blocked arrow costs a life." },
  allClear: { fr: "Grille vide. Exact.", en: "Board empty. Exact." },
  campaign: { fr: "Campagne", en: "Campaign" },
  locked: { fr: "Verrouillé", en: "Locked" },
  stars: { fr: "Étoiles", en: "Stars" },
  arrows: { fr: "flèches", en: "arrows" },
  cells: { fr: "cellules", en: "cells" },
  diff: { fr: "Difficulté", en: "Difficulty" },
  sound: { fr: "Son", en: "Sound" },
  inspect: { fr: "Aperçu avant tap", en: "Preview before tap" },
  inspectHint: {
    fr: "Premier tap : voir la trajectoire. Second tap : lancer.",
    en: "First tap previews the path. Second tap fires.",
  },
  rule1: {
    fr: "Chaque flèche ne peut sortir que dans la direction de sa pointe.",
    en: "Each arrow can only leave in the direction of its tip.",
  },
  rule2: {
    fr: "Elle part si le chemin de la pointe jusqu'au bord est libre.",
    en: "It leaves if the path from the tip to the board edge is clear.",
  },
  rule3: {
    fr: "Les formes L, U, S et spirales occupent plusieurs cases et partent d'un bloc.",
    en: "L, U, S and spiral pieces occupy several cells and leave as one block.",
  },
  rule4: {
    fr: "Un tap bloqué coûte une vie. Plus de vies : échec.",
    en: "A blocked tap costs a life. No lives left: failure.",
  },
  rule5: {
    fr: "Les défis 67 et 73 comptent 100 et 150 flèches. Le 80 est le Néant.",
    en: "Gauntlet levels 67 and 73 hold 100 and 150 arrows. 80 is Néant.",
  },
  dailyDone: { fr: "Défi du jour réussi", en: "Daily cleared" },
  dailyPlay: { fr: "Lancer le défi", en: "Start daily" },
  wave: { fr: "Vague", en: "Wave" },
  best: { fr: "Record", en: "Best" },
  startWave: { fr: "Commencer", en: "Start" },
  zoom: { fr: "Zoom", en: "Zoom" },
  blocked: { fr: "Bloquée", en: "Blocked" },
  clearPath: { fr: "Chemin libre", en: "Path clear" },
  select: { fr: "Choisir un niveau", en: "Select a level" },
  progress: { fr: "Progression", en: "Progress" },
  sync: { fr: "Sauvegarde cloud", en: "Cloud save" },
  syncHint: {
    fr: "Connecte-toi pour garder tes étoiles entre appareils.",
    en: "Sign in to keep stars across devices.",
  },
  loginTitle: { fr: "Compte", en: "Account" },
  loginLead: {
    fr: "Sauvegarde tes 80 niveaux et le défi du jour.",
    en: "Save your 80 levels and the daily gauntlet.",
  },
  continueGoogle: { fr: "Continuer avec Google", en: "Continue with Google" },
  continueX: { fr: "Continuer avec X", en: "Continue with X" },
  authOff: { fr: "Connexion désactivée.", en: "Sign-in is disabled." },
  campaignDone: { fr: "Campagne terminée", en: "Campaign complete" },
  emptyDaily: { fr: "Génération du défi…", en: "Building today's grid…" },
} as const;

export type Msg = keyof typeof dict;

export function t(lang: Lang, key: Msg): string {
  return dict[key][lang];
}
