import { getLevels } from "../src/game/catalog";
import { generateDaily, pieceStats } from "../src/game/generator";
import { solveGreedy, verifySolution } from "../src/game/engine";

const levels = getLevels();
console.log("levels", levels.length);

let bad = 0;
for (const lv of levels) {
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
  if (lv.id >= 9 && dirBias > 0.72) flag.push("DIR_BIAS");
  if ([67, 68].includes(lv.id) && st.count < 90) flag.push("COUNT_SHORT");
  if ([73, 74].includes(lv.id) && st.count < 130) flag.push("COUNT_SHORT");
  if (lv.id === 80 && st.count < 155) flag.push("COUNT_SHORT");
  if (flag.filter((f) => f !== "GREEDY_HARD").length) bad++;
  if (flag.length || [1, 2, 8, 9, 20, 40, 46, 67, 68, 73, 74, 80].includes(lv.id)) {
    console.log(
      `#${String(lv.id).padStart(2)} ${lv.nameFr.padEnd(18)} ${lv.w}x${lv.h} n=${st.count} avg=${st.avgLen.toFixed(2)} curve=${st.curved} dots=${st.dots} dens=${(st.cells / (lv.w * lv.h)).toFixed(2)} dirs=${JSON.stringify(st.dirs)} ${flag.join(",")}`,
    );
  }
}

const daily = generateDaily();
if (daily.level) {
  const st = pieceStats(daily.level.pieces);
  const ok = verifySolution(
    daily.level.pieces,
    daily.level.solution,
    daily.level.w,
    daily.level.h,
  );
  console.log(
    `DAILY ${daily.key} n=${st.count} avg=${st.avgLen.toFixed(2)} curve=${st.curved} dots=${st.dots} dens=${(st.cells / 144).toFixed(2)} ok=${ok} dirs=${JSON.stringify(st.dirs)}`,
  );
} else {
  console.log("DAILY FAILED");
}

console.log("flagged", bad);
