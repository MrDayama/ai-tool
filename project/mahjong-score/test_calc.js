// 麻雀スコア計算ロジックの単体テスト
function calculateRoundPoints(scores, rule) {
  const n = scores.length;
  const okaPoints = ((rule.returnPoint - rule.startPoint) * n) / 1000;
  
  const indexed = scores.map((s, idx) => ({ score: s, idx }));
  indexed.sort((a, b) => b.score - a.score);

  const points = new Array(n).fill(0);
  const ranks = new Array(n).fill(0);

  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n && indexed[j].score === indexed[i].score) {
      j++;
    }
    const tieCount = j - i;
    let sumUma = 0;
    for (let k = i; k < j; k++) {
      sumUma += (rule.uma[k] || 0);
    }
    const avgUma = sumUma / tieCount;

    for (let k = i; k < j; k++) {
      const pIdx = indexed[k].idx;
      ranks[pIdx] = i + 1;

      let rawPt = (indexed[k].score - rule.returnPoint) / 1000;
      if (i === 0) {
        rawPt += (okaPoints / tieCount);
      }
      points[pIdx] = Math.round((rawPt + avgUma) * 10) / 10;
    }
    i = j;
  }

  // 合計0pt調整
  const totalPt = points.reduce((acc, p) => acc + p, 0);
  if (Math.abs(totalPt) > 0.0001) {
    const topIdx = indexed[0].idx;
    points[topIdx] = Math.round((points[topIdx] - totalPt) * 10) / 10;
  }

  return { points, ranks };
}

// テスト1: 四人麻雀 (25000点持ち/30000点返し、ウマ 20, 10, -10, -20)
const rule4p = { startPoint: 25000, returnPoint: 30000, uma: [20, 10, -10, -20] };
const scores4p = [35000, 27000, 23000, 15000]; // 合計 100,000点
const res4p = calculateRoundPoints(scores4p, rule4p);
const sum4p = res4p.points.reduce((a, b) => a + b, 0);

console.log("【テスト1: 四人麻雀】");
console.log("入力素点:", scores4p, "素点合計:", scores4p.reduce((a,b)=>a+b,0));
console.log("精算スコア(pt):", res4p.points);
console.log("精算スコア合計:", sum4p.toFixed(1));
if (Math.abs(sum4p) < 0.001) {
  console.log("✅ テスト1 パス: スコア合計が厳密に 0.0 pt です");
} else {
  console.error("❌ テスト1 失敗");
  process.exit(1);
}

// テスト2: 三人麻雀 (35000点持ち/40000点返し、ウマ 30, 0, -30)
const rule3p = { startPoint: 35000, returnPoint: 40000, uma: [30, 0, -30] };
const scores3p = [48000, 37000, 20000]; // 合計 105,000点
const res3p = calculateRoundPoints(scores3p, rule3p);
const sum3p = res3p.points.reduce((a, b) => a + b, 0);

console.log("\n【テスト2: 三人麻雀】");
console.log("入力素点:", scores3p, "素点合計:", scores3p.reduce((a,b)=>a+b,0));
console.log("精算スコア(pt):", res3p.points);
console.log("精算スコア合計:", sum3p.toFixed(1));
if (Math.abs(sum3p) < 0.001) {
  console.log("✅ テスト2 パス: スコア合計が厳密に 0.0 pt です");
} else {
  console.error("❌ テスト2 失敗");
  process.exit(1);
}
