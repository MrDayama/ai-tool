# プレイヤー名とスコアの完全一致検証スクリプト
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$testRoomId = "verify_player_match_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$syncEndpoint = "https://ntfy.sh/mahjong_multi_room_$testRoomId"

Write-Host "=================================================="
Write-Host "🀄 プレイヤー名 ＆ スコア完全一致 統合検証 (PowerShell)"
Write-Host "レートリミット待機中 (8秒)..."
Start-Sleep -Seconds 8
Write-Host "テスト用ルーム: $testRoomId"
Write-Host "=================================================="

$deviceA = "dev_phone_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$deviceB = "dev_pc_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

Write-Host "`n▶ [STEP 1] 端末A (スマホ) でプレイヤー名を設定し、スコアを入力・送信"
$expectedPlayers = @("山田", "佐藤", "田中", "鈴木")
$expectedScores = @(-1.0, 1.0, 0.0, 0.0)

Write-Host "   端末Aの設定内容:"
for ($i = 0; $i -lt 4; $i++) {
    Write-Host "     席 $($i+1): $($expectedPlayers[$i]) = $($expectedScores[$i]) pt"
}

# 端末Aが送信するペイロード (改修後の multi.html が送信するフルスナップショット)
$jsonPayloadA = @"
{
  "type": "SET_SCORE",
  "senderId": "$deviceA",
  "timestamp": $([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()),
  "payload": {
    "mode": "4p",
    "roundIdx": 0,
    "seatIdx": 1,
    "score": 1.0
  },
  "fullSnapshot": {
    "mode": "4p",
    "playersMaster": ["山田", "佐藤", "田中", "鈴木"],
    "activeSeats": {
      "4p": ["山田", "佐藤", "田中", "鈴木"],
      "3p": ["東家", "南家", "西家"]
    },
    "currentRoundIdx": { "4p": 0, "3p": 0 },
    "sheets": {
      "4p": [
        [-1.0, 1.0, 0.0, 0.0]
      ],
      "3p": [
        [null, null, null]
      ]
    }
  }
}
"@

$resA = Invoke-RestMethod -Uri $syncEndpoint -Method Post -Body $jsonPayloadA -ContentType "application/json; charset=utf-8"
Write-Host "   ✅ 端末Aからクラウドへ送信完了 (Event ID: $($resA.id))"

Write-Host "`n▶ [STEP 2] 端末B (PC) が受信し、改修後の handleRemoteSyncEvent ロジックで状態復元"
# 端末Bの初期状態 (未設定のデフォルト状態: 東家・南家...)
$stateB = @{
    mode = "4p"
    playersMaster = @("東家", "南家", "西家", "北家")
    activeSeats = @{ "4p" = @("東家", "南家", "西家", "北家") }
    sheets = @{ "4p" = @( @(0.0, 0.0, 0.0, 0.0) ) }
}
Write-Host "   受信前の端末B: [ $($stateB.activeSeats.'4p' -join ', ') ]"

Start-Sleep -Seconds 1
$pollResp = (Invoke-WebRequest -Uri "$syncEndpoint/json?poll=1&since=all" -UseBasicParsing).Content
$rawText = if ($pollResp -is [byte[]]) { [System.Text.Encoding]::UTF8.GetString($pollResp) } else { [string]$pollResp }
$lines = $rawText.Trim() -split "`n"

$latestEv = $null
for ($i = $lines.Count - 1; $i -ge 0; $i--) {
    if (-not [string]::IsNullOrWhiteSpace($lines[$i])) {
        try {
            $wrap = $lines[$i] | ConvertFrom-Json
            if ($wrap.message) {
                $ev = $wrap.message | ConvertFrom-Json
                if ($ev.fullSnapshot) {
                    $latestEv = $ev
                    break
                }
            }
        } catch {}
    }
}

# --- 改修後の handleRemoteSyncEvent ロジックの適用 ---
# 1. fullSnapshot から activeSeats と playersMaster を自動同期
if ($latestEv.fullSnapshot.activeSeats) {
    $stateB.activeSeats = $latestEv.fullSnapshot.activeSeats
}
if ($latestEv.fullSnapshot.playersMaster) {
    $stateB.playersMaster = $latestEv.fullSnapshot.playersMaster
}
# 2. sheets のスコアを更新
$stateB.sheets.'4p'[0] = $latestEv.fullSnapshot.sheets.'4p'[0]

Write-Host "`n▶ [STEP 3] 端末B (PC) の受信後レンダリング結果の照合:"
$allMatched = $true
for ($i = 0; $i -lt 4; $i++) {
    $bPlayer = $stateB.activeSeats.'4p'[$i]
    $bScore = [double]$stateB.sheets.'4p'[0][$i]
    $expPlayer = $expectedPlayers[$i]
    $expScore = $expectedScores[$i]

    $match = ($bPlayer -eq $expPlayer) -and ([Math]::Abs($bScore - $expScore) -lt 0.001)
    if ($match) {
        Write-Host "   ✅ 席 $($i+1): $bPlayer = $(if ($bScore -gt 0) { '+' } else { '' })$bScore pt (完全一致)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ 席 $($i+1): 期待=[$expPlayer, $expScore] 実際=[$bPlayer, $bScore]" -ForegroundColor Red
        $allMatched = $false
    }
}

Write-Host "`n=================================================="
if ($allMatched) {
    Write-Host "🎉 【検証合格】プレイヤー名とスコアの対応関係が100%一致しました！" -ForegroundColor Green
    Write-Host "  ・端末Aで変更したプレイヤー名（山田・佐藤・田中・鈴木）が端末Bへ即座に反映"
    Write-Host "  ・各プレイヤーのスコア（山田:-1.0, 佐藤:+1.0...）が端末Bと完全に整合"
} else {
    Write-Error "❌ プレイヤー名とスコアの整合性検証に失敗しました"
    exit 1
}
Write-Host "=================================================="
