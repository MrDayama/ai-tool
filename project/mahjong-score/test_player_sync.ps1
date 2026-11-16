# プレイヤー名とスコア同期の再現テスト
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=================================================="
Write-Host "🔍 プレイヤー名とスコアの同期不一致 再現テスト"
Write-Host "=================================================="

# 端末A (スマホ): プレイヤー名をカスタマイズしてスコア入力
$deviceA_seats = @("山田", "佐藤", "田中", "鈴木")
$deviceA_scores = @(-1.0, 1.0, 0.0, 0.0)

Write-Host "▶ 端末A (入力側) の画面表示:"
for ($i = 0; $i -lt 4; $i++) {
    Write-Host "   席 $($i+1): $($deviceA_seats[$i]) = $($deviceA_scores[$i]) pt"
}

# 端末B (PC側): 初期状態のままスコア受信
# 現行 multi.html の handleRemoteSyncEvent('SET_SCORE') のロジック:
# state.sheets[mode][roundIdx][seatIdx] = score; のみ実行され、activeSeats は更新されない
$deviceB_seats = @("東家", "南家", "西家", "北家") # 初期値のまま
$deviceB_scores = @(-1.0, 1.0, 0.0, 0.0)         # sheets は同期される

Write-Host "`n▶ 端末B (現行コードで受信したPC側) の画面表示:"
for ($i = 0; $i -lt 4; $i++) {
    Write-Host "   席 $($i+1): $($deviceB_seats[$i]) = $($deviceB_scores[$i]) pt"
}

Write-Host "`n🚨 不一致の検証:"
$mismatch = $false
for ($i = 0; $i -lt 4; $i++) {
    if ($deviceA_seats[$i] -ne $deviceB_seats[$i]) {
        Write-Host "   ❌ 席 $($i+1) のプレイヤー名が不一致: 端末Aは「$($deviceA_seats[$i])」だが端末Bは「$($deviceB_seats[$i])」" -ForegroundColor Red
        $mismatch = $true
    }
}

if ($mismatch) {
    Write-Host "`n結論: 現行コードではスコア（数値）は届くものの、プレイヤー名が各端末のローカル状態のまま更新されないため、ユーザー様のご指摘通りの不整合が発生しています。" -ForegroundColor Yellow
}
