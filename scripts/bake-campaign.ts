import { writeFileSync } from "node:fs";
import { HANDCRAFTED } from "../src/game/handcrafted";
import { CAMPAIGN_SPECS, fallbackLevel, specToLevel } from "../src/game/catalog";
import { generateDaily, pieceStats } from "../src/game/generator";
import { solveGreedy, verifySolution } from "../src/game/engine";
import type { LevelDef } from "../src/game/types";

function flags(lv: LevelDef): string[] {
  const okSol = verifySolution(lv.pieces, lv.solution, lv.w, lv.h);
  const greedy = solveGreedy(lv.pieces, lv.w, lv.h);
  const st = pieceStats(lv.pieces);
  const dirVals = Object.values(st.dirs);
  const dirMax = Math.max(...dirVals);
  const dirBias = dirMax / Math.max(1, st.count);
  const flag: string[] = [];
  if (!okSol) flag.push("UNSOLVABLE");
  if (!greedy) flag.push("GREEDY_HARD");
  if (lv.id >= 9 && st.avgLen < 1.35) flag.push("TOO_SHORT");
  if (lv.id >= 9 && st.curved < st.count * 0.1 && st.count > 12) flag.push("FEW_CURVES");
  if (dirBias > 0.72) flag.push("DIR_BIAS");
  if ([67, 68].includes(lv.id) && st.count < 90) flag.push("COUNT_SHORT");
  if ([73, 74].includes(lv.id) && st.count < 130) flag.push("COUNT_SHORT");
  if (lv.id === 80 && st.count < 155) flag.push("COUNT_SHORT");
  return flag;
}

function line(lv: LevelDef, extra = "") {
  const st = pieceStats(lv.pieces);
  const dens = st.cells / (lv.w * lv.h);
  return `#${String(lv.id).padStart(2)} ${lv.nameFr.padEnd(18)} ${lv.w}x${lv.h} n=${st.count} avg=${st.avgLen.toFixed(2)} curve=${st.curved} dots=${st.dots} dens=${dens.toFixed(2)} dirs=${JSON.stringify(st.dirs)}${extra}`;
}

const t0 = Date.now();
const all: LevelDef[] = [...HANDCRAFTED];
let bad = 0;

for (const s of CAMPAIGN_SPECS) {
  const t = Date.now();
  const lv = specToLevel(s) ?? fallbackLevel(s);
  all.push(lv);
  const flag = flags(lv);
  if (flag.length) bad++;
  const show =
    flag.length > 0 ||
    [9, 20, 40, 46, 67, 68, 73, 74, 80].includes(lv.id);
  if (show) {
    console.log(line(lv, flag.length ? ` ${flag.join(",")}` : ""), `${Date.now() - t}ms`);
  } else {
    process.stdout.write(`.`);
  }
}

all.sort((a, b) => a.id - b.id);
writeFileSync(
  new URL("../src/game/campaign.generated.json", import.meta.url),
  JSON.stringify(all),
);

const daily = generateDaily();
if (daily.level) {
  const st = pieceStats(daily.level.pieces);
  const ok = verifySolution(daily.level.pieces, daily.level.solution, daily.level.w, daily.level.h);
  console.log(
    `\nDAILY ${daily.key} n=${st.count} avg=${st.avgLen.toFixed(2)} curve=${st.curved} dots=${st.dots} dens=${(st.cells / 144).toFixed(2)} ok=${ok} dirs=${JSON.stringify(st.dirs)}`,
  );
} else {
  console.log("\nDAILY FAILED");
}

console.log(`\nbaked ${all.length} levels, flagged ${bad}, ${Date.now() - t0}ms`);
