import urllib.request
import json
import time
import sys

SYNC_ENDPOINT = 'https://ntfy.sh/mahjong_multi_room_mahjong_multi_shared_room_dayama'

print("=== 🀄 麻雀スコア リアルタイム共有 疎通テスト ===")

# 1. 端末Aからスコア送信
test_device_id = f"test_device_A_{int(time.time()*1000)}"
test_payload = {
    "type": "SET_SCORE",
    "senderId": test_device_id,
    "timestamp": int(time.time() * 1000),
    "payload": {
        "mode": "4p",
        "roundIdx": 0,
        "seatIdx": 0,
        "score": 35.5
    },
    "fullSnapshot": {
        "mode": "4p",
        "sheets": {
            "4p": [[35.5, -15.5, -10.0, -10.0]],
            "3p": [[None, None, None]]
        }
    }
}

json_bytes = json.dumps(test_payload).encode('utf-8')
req = urllib.request.Request(
    SYNC_ENDPOINT,
    data=json_bytes,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

print("1. 端末Aからスコア (+35.5pt) を送信中...")
try:
    with urllib.request.urlopen(req, timeout=10) as res:
        print(f"   送信ステータス: {res.status} {res.reason}")
        if res.status != 200:
            print("❌ 送信失敗")
            sys.exit(1)
        print("   ✅ 送信成功！")
except Exception as e:
    print(f"❌ 送信エラー: {e}")
    sys.exit(1)

# 2. 端末Bからクラウド最新データ取得
print("2. 端末Bからクラウド最新データを取得中 (Poll)...")
poll_url = f"{SYNC_ENDPOINT}/json?poll=1"
try:
    with urllib.request.urlopen(poll_url, timeout=10) as res:
        content = res.read().decode('utf-8')
        lines = [line.strip() for line in content.strip().split('\n') if line.strip()]
        print(f"   受信メッセージ件数: {len(lines)}")
        
        found = False
        for line in reversed(lines):
            try:
                obj = json.loads(line)
                if 'message' in obj:
                    msg = json.loads(obj['message'])
                    if msg.get('senderId') == test_device_id:
                        print("   ✅ 端末Bが端末Aのスコアを完全受信！")
                        print(f"   受信データ: {json.dumps(msg.get('payload'))}")
                        found = True
                        break
            except Exception:
                pass
        
        if found:
            print("=== 🎉 テスト結果: スコアリアルタイム共有は正常稼働しています！ ===")
        else:
            print("❌ メッセージが見つかりませんでした")
            sys.exit(1)
except Exception as e:
    print(f"❌ 受信エラー: {e}")
    sys.exit(1)
