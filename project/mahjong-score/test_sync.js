// リアルタイム同期疎通テストスクリプト
const SYNC_ENDPOINT = 'https://ntfy.sh/mahjong_multi_room_mahjong_multi_shared_room_dayama';

async function runTest() {
  console.log("=== 🀄 麻雀スコア リアルタイム共有 疎通テスト ===");

  const testPayload = {
    type: 'SET_SCORE',
    senderId: 'test_device_A_' + Date.now(),
    timestamp: Date.now(),
    payload: {
      mode: '4p',
      roundIdx: 0,
      seatIdx: 0,
      score: 35.5
    },
    fullSnapshot: {
      mode: '4p',
      sheets: {
        '4p': [[35.5, -15.5, -10.0, -10.0]],
        '3p': [[null, null, null]]
      }
    }
  };

  console.log("1. 端末Aからスコア送信中 (+35.5pt)...");
  const postRes = await fetch(SYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload)
  });

  console.log("   送信ステータス:", postRes.status, postRes.statusText);
  if (!postRes.ok) {
    console.error("❌ 送信失敗");
    process.exit(1);
  }
  console.log("   ✅ 送信成功！");

  console.log("2. 端末Bからクラウド最新データ取得中 (Poll)...");
  const getRes = await fetch(SYNC_ENDPOINT + '/json?poll=1');
  const text = await getRes.text();
  const lines = text.trim().split('\n');
  console.log(`   受信メッセージ行数: ${lines.length}`);

  let found = false;
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.message) {
        const msg = JSON.parse(parsed.message);
        if (msg.senderId === testPayload.senderId) {
          console.log("   ✅ 端末Bが端末Aのスコアを完全受信！");
          console.log("   受信データ:", JSON.stringify(msg.payload));
          found = true;
          break;
        }
      }
    } catch(e) {}
  }

  if (found) {
    console.log("=== 🎉 テスト結果: スコアリアルタイム共有は正常稼働しています！ ===");
  } else {
    console.error("❌ 該当メッセージが受信データ内に見つかりませんでした");
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error("エラー発生:", err);
  process.exit(1);
});
