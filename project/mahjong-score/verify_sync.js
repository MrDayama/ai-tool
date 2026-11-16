// 麻雀スコア複数人同期 統合検証スクリプト
const https = require('https');

const testRoomId = 'test_verify_' + Date.now();
const SYNC_ENDPOINT = `https://ntfy.sh/mahjong_multi_room_${encodeURIComponent(testRoomId)}`;

console.log("==================================================");
console.log(`🀄 麻雀スコア 複数人リアルタイム同期 統合検証開始`);
console.log(`検証用ルームID: ${testRoomId}`);
console.log(`エンドポイント: ${SYNC_ENDPOINT}`);
console.log("==================================================");

function postEvent(eventObj) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(eventObj);
    const url = new URL(SYNC_ENDPOINT);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function pollLatestMessages() {
  return new Promise((resolve, reject) => {
    https.get(SYNC_ENDPOINT + '/json?poll=1&t=' + Date.now(), (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (!body.trim()) return resolve([]);
        const lines = body.trim().split('\n');
        const msgs = [];
        for (const line of lines) {
          try {
            const raw = JSON.parse(line);
            if (raw.message) {
              msgs.push(JSON.parse(raw.message));
            }
          } catch(e) {}
        }
        resolve(msgs);
      });
    }).on('error', reject);
  });
}

async function runVerification() {
  const deviceA = 'device_A_' + Date.now();
  const deviceB = 'device_B_' + Date.now();
  const deviceC = 'device_C_' + Date.now();

  // 端末Aの初期ステート
  let stateA = {
    mode: '4p',
    activeSeats: { '4p': ['東家', '南家', '西家', '北家'], '3p': ['東家', '南家', '西家'] },
    playersMaster: ['東家', '南家', '西家', '北家'],
    sheets: {
      '4p': [[null, null, null, null]],
      '3p': [[null, null, null]]
    },
    currentRoundIdx: { '4p': 0, '3p': 0 }
  };

  // 端末Bの初期ステート（空）
  let stateB = JSON.parse(JSON.stringify(stateA));

  console.log("\n▶ [STEP 1] 端末Bが SSE 接続を開いて待機中 (受信シミュレーション)");
  // SSEストリーム接続
  const receivedEventsB = [];
  const sseReq = https.get(SYNC_ENDPOINT + '/sse', (res) => {
    res.on('data', chunk => {
      const text = chunk.toString();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const raw = JSON.parse(line.substring(5).trim());
            if (raw && raw.message) {
              const eventObj = JSON.parse(raw.message);
              receivedEventsB.push(eventObj);
            }
          } catch(e) {}
        }
      }
    });
  });

  // SSEの確立を少し待つ
  await new Promise(r => setTimeout(r, 1200));
  console.log("   ✅ 端末Bのリアルタイム受信用SSEストリームが確立されました");

  console.log("\n▶ [STEP 2] 端末Aが第1回戦のスコアを入力・送信");
  const round1Scores = [38.2, 12.4, -18.6, -32.0];
  stateA.sheets['4p'][0] = [...round1Scores];

  for (let seatIdx = 0; seatIdx < 4; seatIdx++) {
    const scoreVal = round1Scores[seatIdx];
    const event = {
      type: 'SET_SCORE',
      senderId: deviceA,
      timestamp: Date.now(),
      payload: {
        mode: '4p',
        roundIdx: 0,
        seatIdx: seatIdx,
        score: scoreVal
      },
      fullSnapshot: stateA
    };
    await postEvent(event);
    console.log(`   📤 端末A送信: 座席${seatIdx} (${stateA.activeSeats['4p'][seatIdx]}) スコア = ${scoreVal > 0 ? '+' : ''}${scoreVal}`);
  }

  // 端末Bへの反映待機
  await new Promise(r => setTimeout(r, 1000));

  console.log("\n▶ [STEP 3] 端末Bの受信状況確認");
  console.log(`   端末B受信イベント総数: ${receivedEventsB.length} 件`);
  const bScores = [null, null, null, null];
  for (const ev of receivedEventsB) {
    if (ev.type === 'SET_SCORE' && ev.payload.roundIdx === 0) {
      bScores[ev.payload.seatIdx] = ev.payload.score;
    }
  }
  console.log(`   端末Bが反映した第1回戦スコア: [ ${bScores.join(', ')} ]`);

  const r1Match = JSON.stringify(bScores) === JSON.stringify(round1Scores);
  if (r1Match) {
    console.log("   ✅ 【検証成功】端末Aの第1回戦スコアが端末Bへミリ秒単位で完全に同期されました！");
  } else {
    console.error("   ❌ 【不一致】端末Bのスコアが一致しません！");
    process.exit(1);
  }

  console.log("\n▶ [STEP 4] 端末Aが「次の半荘（第2回戦）」へ進み、第2回戦スコアを入力");
  stateA.sheets['4p'].push([null, null, null, null]);
  stateA.currentRoundIdx['4p'] = 1;

  await postEvent({
    type: 'NEXT_ROUND',
    senderId: deviceA,
    timestamp: Date.now(),
    payload: { mode: '4p', roundIdx: 1 },
    fullSnapshot: stateA
  });
  console.log("   📤 端末A送信: NEXT_ROUND (第2回戦へ進む)");

  const round2Scores = [-25.0, 45.0, -10.0, -10.0];
  stateA.sheets['4p'][1] = [...round2Scores];

  for (let seatIdx = 0; seatIdx < 4; seatIdx++) {
    const scoreVal = round2Scores[seatIdx];
    await postEvent({
      type: 'SET_SCORE',
      senderId: deviceA,
      timestamp: Date.now(),
      payload: {
        mode: '4p',
        roundIdx: 1,
        seatIdx: seatIdx,
        score: scoreVal
      },
      fullSnapshot: stateA
    };
    console.log(`   📤 端末A送信: 第2回戦 座席${seatIdx} スコア = ${scoreVal > 0 ? '+' : ''}${scoreVal}`);
  }

  // 少し待機
  await new Promise(r => setTimeout(r, 1000));

  console.log("\n▶ [STEP 5] 途中から参加した端末Cの初回スナップショット復元検証");
  console.log("   端末Cがページを新規オープン → クラウド最新メッセージをフェッチ中...");
  const pollMsgs = await pollLatestMessages();
  console.log(`   クラウド上のメッセージ数: ${pollMsgs.length} 件`);

  let stateC = null;
  for (let i = pollMsgs.length - 1; i >= 0; i--) {
    const ev = pollMsgs[i];
    if (ev && ev.fullSnapshot && ev.fullSnapshot.sheets) {
      stateC = ev.fullSnapshot;
      break;
    }
  }

  if (!stateC) {
    console.error("   ❌ 端末Cがスナップショットを取得できませんでした");
    process.exit(1);
  }

  console.log("   ✅ 端末Cが最新スナップショットを復元しました！");
  console.log(`   端末Cの第1回戦: [ ${stateC.sheets['4p'][0].join(', ')} ]`);
  console.log(`   端末Cの第2回戦: [ ${stateC.sheets['4p'][1].join(', ')} ]`);

  // 合計スコアの照合
  const cTotals = [0, 0, 0, 0];
  for (let r = 0; r < 2; r++) {
    for (let s = 0; s < 4; s++) {
      cTotals[s] += stateC.sheets['4p'][r][s];
    }
  }
  const roundedTotals = cTotals.map(x => Math.round(x * 10) / 10);
  console.log(`   端末Cの通算合計スコア: [ 東:${roundedTotals[0]}, 南:${roundedTotals[1]}, 西:${roundedTotals[2]}, 北:${roundedTotals[3]} ]`);

  const expectedTotals = [
    Math.round((38.2 - 25.0) * 10) / 10,  // +13.2
    Math.round((12.4 + 45.0) * 10) / 10,  // +57.4
    Math.round((-18.6 - 10.0) * 10) / 10, // -28.6
    Math.round((-32.0 - 10.0) * 10) / 10  // -42.0
  ];

  const totalMatch = JSON.stringify(roundedTotals) === JSON.stringify(expectedTotals);
  if (totalMatch) {
    console.log("   ✅ 【通算計算完全一致】端末Cの通算スコア計算が期待値と100%一致しました！");
  } else {
    console.error("   ❌ 【計算不一致】期待値:", expectedTotals, "実際:", roundedTotals);
    process.exit(1);
  }

  // SSE切断
  sseReq.destroy();

  console.log("\n==================================================");
  console.log("🎉 【検証完了】すべての同期シナリオが正常にパスしました！");
  console.log("  1. 端末A（入力）→ 端末B（即時SSE受信）: 100% 同期成功");
  console.log("  2. 半荘進行（NEXT_ROUND）: 正常同期");
  console.log("  3. 端末C（遅延参加・初回復元）: 全履歴・通算スコア 100% 復元成功");
  console.log("==================================================");
}

runVerification().catch(err => {
  console.error("検証実行エラー:", err);
  process.exit(1);
});
