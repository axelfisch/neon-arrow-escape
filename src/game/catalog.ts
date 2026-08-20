import type { LevelDef, Tier } from "./types";
import type { GenOpts, ShapeKind } from "./generator";
import { makeLevelFromGen } from "./generator";
import { HANDCRAFTED } from "./handcrafted";
import bakedCampaign from "./campaign.generated.json";

type Spec = {
  id: number;
  name: string;
  nameFr: string;
  tier: Tier;
  hearts: number;
  hints: number;
  undos: number;
  opts: Omit<GenOpts, "seed"> & { seed: number };
};

const BENT: ShapeKind[] = ["straight", "L", "dot"];
const MIX: ShapeKind[] = ["dot", "straight", "L", "zigzag"];
const HARD: ShapeKind[] = ["dot", "straight", "L", "U", "S", "zigzag"];
const ALL: ShapeKind[] = ["dot", "straight", "L", "U", "S", "zigzag", "spiral"];

export function specToLevel(s: Spec): LevelDef | null {
  return makeLevelFromGen(
    {
      id: s.id,
      key: `lvl-${s.id}`,
      name: s.name,
      nameFr: s.nameFr,
      tier: s.tier,
      hearts: s.hearts,
      hints: s.hints,
      undos: s.undos,
    },
    s.opts,
  );
}

/**
 * Campaign 9–80 follows the Défi du jour recipe:
 * mixed 1-wide snakes (L / zigzag / S), unique escape head, reverse-solvable.
 * Never DOT-only — that's what made 100/150/180 look like a grid of pins.
 */
export const CAMPAIGN_SPECS: Spec[] = [
  // 9–16 easy — short bent snakes (Daily-like mix, smaller board)
  { id: 9, name: "Ribbon", nameFr: "Ruban", tier: "easy", hearts: 4, hints: 2, undos: 2, opts: { w: 7, h: 6, count: 8, minLen: 2, maxLen: 4, shapes: BENT, hardness: 0.32, seed: 9001 } },
  { id: 10, name: "Split", nameFr: "Scission", tier: "easy", hearts: 4, hints: 2, undos: 2, opts: { w: 7, h: 7, count: 9, minLen: 2, maxLen: 4, shapes: BENT, hardness: 0.36, seed: 10002 } },
  { id: 11, name: "Hook Line", nameFr: "Hameçon", tier: "easy", hearts: 4, hints: 2, undos: 2, opts: { w: 7, h: 7, count: 10, minLen: 2, maxLen: 5, shapes: MIX, hardness: 0.4, seed: 11003 } },
  { id: 12, name: "Corridor", nameFr: "Couloir", tier: "easy", hearts: 4, hints: 2, undos: 2, opts: { w: 8, h: 7, count: 11, minLen: 2, maxLen: 5, shapes: MIX, hardness: 0.42, seed: 12004 } },
  { id: 13, name: "Lattice", nameFr: "Treillis", tier: "easy", hearts: 4, hints: 2, undos: 2, opts: { w: 8, h: 8, count: 12, minLen: 2, maxLen: 5, shapes: MIX, hardness: 0.45, seed: 13005 } },
  { id: 14, name: "Forked", nameFr: "Fourche", tier: "easy", hearts: 4, hints: 2, undos: 2, opts: { w: 8, h: 8, count: 13, minLen: 2, maxLen: 5, shapes: MIX, hardness: 0.48, seed: 14006 } },
  { id: 15, name: "S-bend", nameFr: "Virage S", tier: "easy", hearts: 4, hints: 2, undos: 2, opts: { w: 8, h: 8, count: 14, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.5, seed: 15007 } },
  { id: 16, name: "Knot", nameFr: "Nœud", tier: "easy", hearts: 4, hints: 2, undos: 2, opts: { w: 8, h: 8, count: 15, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.52, seed: 16008 } },

  // 17–28 normal
  { id: 17, name: "Weave", nameFr: "Tissage", tier: "normal", hearts: 4, hints: 2, undos: 2, opts: { w: 8, h: 8, count: 16, minLen: 2, maxLen: 5, shapes: MIX, hardness: 0.55, seed: 17009 } },
  { id: 18, name: "Pins", nameFr: "Épingles", tier: "normal", hearts: 4, hints: 2, undos: 2, opts: { w: 9, h: 8, count: 17, minLen: 2, maxLen: 5, shapes: MIX, hardness: 0.58, seed: 18010 } },
  { id: 19, name: "Cascade", nameFr: "Cascade", tier: "normal", hearts: 4, hints: 2, undos: 2, opts: { w: 9, h: 9, count: 18, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.6, seed: 19011 } },
  { id: 20, name: "Lockstep", nameFr: "Pas cadencé", tier: "normal", hearts: 3, hints: 2, undos: 2, opts: { w: 9, h: 9, count: 20, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.62, seed: 20012 } },
  { id: 21, name: "Spiral Gate", nameFr: "Porte spirale", tier: "normal", hearts: 3, hints: 2, undos: 1, opts: { w: 9, h: 9, count: 21, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.64, seed: 21013 } },
  { id: 22, name: "Needles", nameFr: "Aiguilles", tier: "normal", hearts: 3, hints: 2, undos: 1, opts: { w: 10, h: 9, count: 22, minLen: 2, maxLen: 5, shapes: MIX, hardness: 0.66, seed: 22014 } },
  { id: 23, name: "Mesh", nameFr: "Maillage", tier: "normal", hearts: 3, hints: 2, undos: 1, opts: { w: 10, h: 10, count: 24, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.68, seed: 23015 } },
  { id: 24, name: "Underpass", nameFr: "Passage", tier: "normal", hearts: 3, hints: 2, undos: 1, opts: { w: 10, h: 10, count: 25, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.7, seed: 24016 } },
  { id: 25, name: "Crossfire", nameFr: "Tirs croisés", tier: "normal", hearts: 3, hints: 1, undos: 1, opts: { w: 10, h: 10, count: 26, minLen: 2, maxLen: 6, shapes: MIX, hardness: 0.72, seed: 25017 } },
  { id: 26, name: "Fold", nameFr: "Pli", tier: "normal", hearts: 3, hints: 1, undos: 1, opts: { w: 10, h: 10, count: 27, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.73, seed: 26018 } },
  { id: 27, name: "Ravel", nameFr: "Écheveau", tier: "normal", hearts: 3, hints: 1, undos: 1, opts: { w: 11, h: 10, count: 28, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.74, seed: 27019 } },
  { id: 28, name: "Pressure", nameFr: "Pression", tier: "normal", hearts: 3, hints: 1, undos: 1, opts: { w: 11, h: 10, count: 30, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.76, seed: 28020 } },

  // 29–40 hard
  { id: 29, name: "Thicket", nameFr: "Fourré", tier: "hard", hearts: 3, hints: 1, undos: 1, opts: { w: 11, h: 11, count: 32, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.78, seed: 29021 } },
  { id: 30, name: "Gambit", nameFr: "Gambit", tier: "hard", hearts: 3, hints: 1, undos: 1, opts: { w: 11, h: 11, count: 34, minLen: 2, maxLen: 6, shapes: MIX, hardness: 0.8, seed: 30022 } },
  { id: 31, name: "Snare", nameFr: "Collet", tier: "hard", hearts: 3, hints: 1, undos: 1, opts: { w: 11, h: 11, count: 36, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.81, seed: 31023 } },
  { id: 32, name: "Siege Line", nameFr: "Ligne de siège", tier: "hard", hearts: 3, hints: 1, undos: 1, opts: { w: 12, h: 11, count: 38, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.82, seed: 32024 } },
  { id: 33, name: "Crowded", nameFr: "Foule", tier: "hard", hearts: 3, hints: 1, undos: 1, opts: { w: 12, h: 12, count: 40, minLen: 2, maxLen: 6, shapes: MIX, hardness: 0.83, seed: 33025 } },
  { id: 34, name: "Coil", nameFr: "Bobine", tier: "hard", hearts: 3, hints: 1, undos: 1, opts: { w: 12, h: 12, count: 42, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.84, seed: 34026 } },
  { id: 35, name: "Barricade", nameFr: "Barricade", tier: "hard", hearts: 2, hints: 1, undos: 1, opts: { w: 12, h: 12, count: 44, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.85, seed: 35027 } },
  { id: 36, name: "Labyrinth", nameFr: "Labyrinthe", tier: "hard", hearts: 2, hints: 1, undos: 1, opts: { w: 12, h: 12, count: 46, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.86, seed: 36028 } },
  { id: 37, name: "Needles II", nameFr: "Aiguilles II", tier: "hard", hearts: 2, hints: 1, undos: 1, opts: { w: 12, h: 12, count: 48, minLen: 2, maxLen: 5, shapes: MIX, hardness: 0.87, seed: 37029 } },
  { id: 38, name: "Dense 50", nameFr: "Densité 50", tier: "hard", hearts: 2, hints: 1, undos: 1, opts: { w: 12, h: 12, count: 50, minLen: 2, maxLen: 5, shapes: HARD, hardness: 0.88, seed: 38030 } },
  { id: 39, name: "Tight Weave", nameFr: "Tissage serré", tier: "hard", hearts: 2, hints: 1, undos: 1, opts: { w: 13, h: 12, count: 52, minLen: 2, maxLen: 6, shapes: MIX, hardness: 0.88, seed: 39031 } },
  { id: 40, name: "No Slack", nameFr: "Sans jeu", tier: "hard", hearts: 2, hints: 1, undos: 1, opts: { w: 13, h: 13, count: 54, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.89, seed: 40032 } },

  // 41–52 expert — daily-sized boards with more snakes
  { id: 41, name: "Expert Gate", nameFr: "Porte expert", tier: "expert", hearts: 2, hints: 1, undos: 1, opts: { w: 13, h: 13, count: 56, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.9, seed: 41033 } },
  { id: 42, name: "Braids", nameFr: "Tresses", tier: "expert", hearts: 2, hints: 1, undos: 1, opts: { w: 13, h: 13, count: 58, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.9, seed: 42034 } },
  { id: 43, name: "Hook Storm", nameFr: "Tempête crochets", tier: "expert", hearts: 2, hints: 1, undos: 1, opts: { w: 13, h: 13, count: 60, minLen: 2, maxLen: 6, shapes: MIX, hardness: 0.91, seed: 43035 } },
  { id: 44, name: "Switchback", nameFr: "Lacets", tier: "expert", hearts: 2, hints: 1, undos: 1, opts: { w: 14, h: 13, count: 62, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.91, seed: 44036 } },
  { id: 45, name: "Nest", nameFr: "Nid", tier: "expert", hearts: 2, hints: 1, undos: 1, opts: { w: 14, h: 14, count: 64, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.92, seed: 45037 } },
  { id: 46, name: "Daily Kin", nameFr: "Cousin du jour", tier: "expert", hearts: 2, hints: 1, undos: 1, opts: { w: 12, h: 12, count: 72, minLen: 1, maxLen: 4, shapes: MIX, hardness: 0.92, seed: 46038 } },
  { id: 47, name: "Overfold", nameFr: "Surpli", tier: "expert", hearts: 2, hints: 1, undos: 0, opts: { w: 14, h: 14, count: 68, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.92, seed: 47039 } },
  { id: 48, name: "Riverbed", nameFr: "Lit de rivière", tier: "expert", hearts: 2, hints: 1, undos: 0, opts: { w: 14, h: 14, count: 70, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.93, seed: 48040 } },
  { id: 49, name: "Tangled", nameFr: "Embrouillé", tier: "expert", hearts: 2, hints: 1, undos: 0, opts: { w: 14, h: 14, count: 72, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.93, seed: 49041 } },
  { id: 50, name: "Seventy-Four", nameFr: "Soixante-quatorze", tier: "expert", hearts: 2, hints: 1, undos: 0, opts: { w: 15, h: 14, count: 74, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.94, seed: 50042 } },
  { id: 51, name: "Spine", nameFr: "Échine", tier: "expert", hearts: 2, hints: 1, undos: 0, opts: { w: 15, h: 15, count: 76, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.94, seed: 51043 } },
  { id: 52, name: "Expert 80", nameFr: "Expert 80", tier: "expert", hearts: 2, hints: 1, undos: 0, opts: { w: 15, h: 15, count: 80, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.94, seed: 52044 } },

  // 53–62 master
  { id: 53, name: "Master Gate", nameFr: "Porte maître", tier: "master", hearts: 2, hints: 1, undos: 0, opts: { w: 15, h: 15, count: 82, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.95, seed: 53045 } },
  { id: 54, name: "Iron Grid", nameFr: "Grille de fer", tier: "master", hearts: 2, hints: 1, undos: 0, opts: { w: 15, h: 15, count: 84, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.95, seed: 54046 } },
  { id: 55, name: "White Noise", nameFr: "Bruit blanc", tier: "master", hearts: 2, hints: 1, undos: 0, opts: { w: 15, h: 15, count: 86, minLen: 2, maxLen: 6, shapes: MIX, hardness: 0.95, seed: 55047 } },
  { id: 56, name: "Ninety", nameFr: "Quatre-vingt-dix", tier: "master", hearts: 2, hints: 1, undos: 0, opts: { w: 16, h: 15, count: 88, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.96, seed: 56048 } },
  { id: 57, name: "Deep Order", nameFr: "Ordre profond", tier: "master", hearts: 2, hints: 1, undos: 0, opts: { w: 16, h: 15, count: 90, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.96, seed: 57049 } },
  { id: 58, name: "Still Point", nameFr: "Point fixe", tier: "master", hearts: 2, hints: 1, undos: 0, opts: { w: 16, h: 16, count: 92, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.96, seed: 58050 } },
  { id: 59, name: "Almost Hundred", nameFr: "Presque cent", tier: "master", hearts: 2, hints: 1, undos: 0, opts: { w: 16, h: 16, count: 94, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.97, seed: 59051 } },
  { id: 60, name: "Threshold", nameFr: "Seuil", tier: "master", hearts: 2, hints: 1, undos: 0, opts: { w: 16, h: 16, count: 96, minLen: 2, maxLen: 6, shapes: MIX, hardness: 0.97, seed: 60052 } },
  { id: 61, name: "Master 99", nameFr: "Maître 99", tier: "master", hearts: 2, hints: 1, undos: 0, opts: { w: 16, h: 16, count: 98, minLen: 2, maxLen: 7, shapes: HARD, hardness: 0.97, seed: 61053 } },
  { id: 62, name: "Last Key", nameFr: "Dernière clé", tier: "master", hearts: 2, hints: 1, undos: 0, opts: { w: 16, h: 16, count: 99, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.97, seed: 62054 } },

  // 63–80 défi — 100 / 150 / 180 with long curves, not pin grids
  { id: 63, name: "Défi I", nameFr: "Défi I", tier: "defi", hearts: 2, hints: 1, undos: 1, opts: { w: 13, h: 13, count: 70, minLen: 2, maxLen: 7, shapes: HARD, hardness: 0.92, seed: 63055 } },
  { id: 64, name: "Défi II", nameFr: "Défi II", tier: "defi", hearts: 2, hints: 1, undos: 1, opts: { w: 14, h: 14, count: 78, minLen: 2, maxLen: 7, shapes: ALL, hardness: 0.93, seed: 64056 } },
  { id: 65, name: "Défi III", nameFr: "Défi III", tier: "defi", hearts: 2, hints: 1, undos: 1, opts: { w: 14, h: 14, count: 86, minLen: 2, maxLen: 6, shapes: MIX, hardness: 0.93, seed: 65057 } },
  { id: 66, name: "Approach 100", nameFr: "Approche 100", tier: "defi", hearts: 2, hints: 1, undos: 1, opts: { w: 15, h: 15, count: 94, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.94, seed: 66058 } },
  { id: 67, name: "Century", nameFr: "Centurie", tier: "defi", hearts: 2, hints: 1, undos: 1, opts: { w: 16, h: 16, count: 100, minLen: 2, maxLen: 8, shapes: ALL, hardness: 0.94, seed: 67059 } },
  { id: 68, name: "Hundred Hooks", nameFr: "Cent crochets", tier: "defi", hearts: 2, hints: 1, undos: 1, opts: { w: 16, h: 16, count: 100, minLen: 2, maxLen: 7, shapes: HARD, hardness: 0.95, seed: 68060 } },
  { id: 69, name: "One-Oh-Eight", nameFr: "Cent-huit", tier: "defi", hearts: 2, hints: 1, undos: 0, opts: { w: 16, h: 16, count: 108, minLen: 2, maxLen: 6, shapes: MIX, hardness: 0.95, seed: 69061 } },
  { id: 70, name: "Storm 120", nameFr: "Tempête 120", tier: "defi", hearts: 2, hints: 1, undos: 0, opts: { w: 17, h: 16, count: 120, minLen: 2, maxLen: 6, shapes: HARD, hardness: 0.95, seed: 70062 } },
  { id: 71, name: "Siege 130", nameFr: "Siège 130", tier: "defi", hearts: 2, hints: 1, undos: 0, opts: { w: 17, h: 17, count: 130, minLen: 2, maxLen: 6, shapes: ALL, hardness: 0.96, seed: 71063 } },
  { id: 72, name: "Climb 140", nameFr: "Montée 140", tier: "defi", hearts: 2, hints: 1, undos: 0, opts: { w: 17, h: 17, count: 140, minLen: 2, maxLen: 5, shapes: HARD, hardness: 0.96, seed: 72064 } },
  { id: 73, name: "Hecatomb", nameFr: "Hécatombe", tier: "defi", hearts: 2, hints: 1, undos: 1, opts: { w: 18, h: 18, count: 150, minLen: 2, maxLen: 6, shapes: ALL, hardness: 0.96, seed: 73065 } },
  { id: 74, name: "150 Shapes", nameFr: "150 formes", tier: "defi", hearts: 2, hints: 1, undos: 0, opts: { w: 18, h: 18, count: 150, minLen: 2, maxLen: 7, shapes: HARD, hardness: 0.97, seed: 74066 } },
  { id: 75, name: "After 150", nameFr: "Après 150", tier: "defi", hearts: 2, hints: 1, undos: 0, opts: { w: 18, h: 18, count: 155, minLen: 2, maxLen: 5, shapes: MIX, hardness: 0.97, seed: 75067 } },
  { id: 76, name: "Iron 160", nameFr: "Fer 160", tier: "defi", hearts: 2, hints: 1, undos: 0, opts: { w: 18, h: 18, count: 160, minLen: 2, maxLen: 5, shapes: HARD, hardness: 0.97, seed: 76068 } },
  { id: 77, name: "Abyss", nameFr: "Abysse", tier: "defi", hearts: 2, hints: 0, undos: 0, opts: { w: 18, h: 18, count: 168, minLen: 2, maxLen: 5, shapes: ALL, hardness: 0.98, seed: 77069 } },
  { id: 78, name: "No Air", nameFr: "Plus d'air", tier: "defi", hearts: 2, hints: 0, undos: 0, opts: { w: 18, h: 18, count: 172, minLen: 2, maxLen: 5, shapes: HARD, hardness: 0.98, seed: 78070 } },
  { id: 79, name: "Penultimate", nameFr: "Avant-dernier", tier: "defi", hearts: 2, hints: 0, undos: 0, opts: { w: 18, h: 18, count: 176, minLen: 2, maxLen: 5, shapes: MIX, hardness: 0.98, seed: 79071 } },
  { id: 80, name: "Néant", nameFr: "Néant", tier: "defi", hearts: 2, hints: 1, undos: 0, opts: { w: 18, h: 18, count: 180, minLen: 2, maxLen: 6, shapes: ALL, hardness: 0.98, seed: 80072 } },
];

export function fallbackLevel(s: Spec): LevelDef {
  const tiny = makeLevelFromGen(
    {
      id: s.id,
      key: `lvl-${s.id}`,
      name: s.name,
      nameFr: s.nameFr,
      tier: s.tier,
      hearts: s.hearts,
      hints: s.hints,
      undos: s.undos,
    },
    {
      ...s.opts,
      count: Math.max(6, Math.floor(s.opts.count * 0.82)),
      maxLen: Math.max(3, s.opts.maxLen - 1),
      seed: s.opts.seed + 1337,
      hardness: Math.max(0.25, s.opts.hardness - 0.12),
    },
  );
  if (tiny) return tiny;
  const smaller = makeLevelFromGen(
    {
      id: s.id,
      key: `lvl-${s.id}`,
      name: s.name,
      nameFr: s.nameFr,
      tier: s.tier,
      hearts: s.hearts,
      hints: s.hints,
      undos: s.undos,
    },
    {
      w: Math.max(6, s.opts.w - 2),
      h: Math.max(6, s.opts.h - 2),
      count: Math.max(6, Math.floor(s.opts.count * 0.55)),
      minLen: 2,
      maxLen: 5,
      shapes: MIX,
      hardness: 0.7,
      seed: s.opts.seed + 4242,
    },
  );
  if (smaller) return smaller;
  return (
    makeLevelFromGen(
      {
        id: s.id,
        key: `lvl-${s.id}`,
        name: s.name,
        nameFr: s.nameFr,
        tier: s.tier,
        hearts: Math.max(3, s.hearts),
        hints: Math.max(1, s.hints),
        undos: Math.max(1, s.undos),
      },
      {
        w: 8,
        h: 8,
        count: 12,
        minLen: 2,
        maxLen: 4,
        shapes: BENT,
        hardness: 0.4,
        seed: s.opts.seed + 7,
      },
    ) ?? HANDCRAFTED[0]!
  );
}

let cache: LevelDef[] | null = null;

function liveGenerate(): LevelDef[] {
  const generated = CAMPAIGN_SPECS.map((s) => specToLevel(s) ?? fallbackLevel(s));
  return [...HANDCRAFTED, ...generated].sort((a, b) => a.id - b.id);
}

export function getLevels(): LevelDef[] {
  if (cache) return cache;
  const baked = bakedCampaign as LevelDef[];
  let generated: LevelDef[];
  if (Array.isArray(baked) && baked.length >= 70) {
    generated = baked.filter((l) => l.id >= 9);
  } else {
    try {
      generated = liveGenerate().filter((l) => l.id >= 9);
    } catch {
      generated = [];
    }
  }
  cache = [...HANDCRAFTED, ...generated].sort((a, b) => a.id - b.id);
  return cache;
}

export function getLevel(id: number): LevelDef | undefined {
  return getLevels().find((l) => l.id === id);
}

export function nextLevelId(id: number): number | null {
  const levels = getLevels();
  const i = levels.findIndex((l) => l.id === id);
  if (i < 0 || i >= levels.length - 1) return null;
  return levels[i + 1]!.id;
}

export const TIER_META: Record<Tier, { fr: string; en: string; accent: string }> = {
  initiate: { fr: "Initiation", en: "Initiate", accent: "var(--ok)" },
  easy: { fr: "Facile", en: "Easy", accent: "var(--accent)" },
  normal: { fr: "Normal", en: "Normal", accent: "var(--piece-amber)" },
  hard: { fr: "Difficile", en: "Hard", accent: "var(--piece-orange)" },
  expert: { fr: "Expert", en: "Expert", accent: "var(--piece-pink)" },
  master: { fr: "Maître", en: "Master", accent: "var(--piece-blue)" },
  defi: { fr: "Défi", en: "Gauntlet", accent: "var(--danger)" },
};
