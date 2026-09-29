/**
 * ========================================================
 * 🀄 麻雀スコアシート × Googleスプレッドシート 自動同期スクリプト (GAS)
 * ========================================================
 * 
 * 【超かんたん 1分セットアップ手順】
 * 
 * 1. Googleドライブ (https://drive.google.com) を開き、
 *    左上の「新規」➜「Googleスプレッドシート」をクリックして1つ作成します。
 * 
 * 2. 上部メニューの「拡張機能」➜「Apps Script」を開きます。
 * 
 * 3. 元から書いてあるコードをすべて消して、このコードをそのまま全選択貼り付けします。
 * 
 * 4. 右上の「デプロイ」➜「新しいデプロイ」をクリックします。
 *    ・ 歯車アイコン ➜「ウェブアプリ」を選択
 *    ・ アクセスできるユーザー: 「全員」に設定
 *    ・「デプロイ」ボタンをクリック！
 * 
 * 5. 発行された「ウェブアプリのURL」をコピーして、
 *    麻雀アプリの「📊スプシ同期」画面に貼り付けて「保存」を押すだけ！
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var jsonCell = sheet.getRange("A1").getValue();
  
  if (!jsonCell) {
    jsonCell = JSON.stringify({ empty: true });
  }

  return ContentService.createTextOutput(jsonCell)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 1. バックアップ＆生データとして A1 に最新のJSON状態を保存
    sheet.getRange("A1").setValue(rawData);

    // 2. スプレッドシートの見た目も綺麗に整形（人間が見やすい表形式で展開）
    renderHumanFriendlySheet(sheet, data);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 初回ワンクリックでシート枠線を自動構築するヘルパー関数
function setupSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange("A3").setValue("【麻雀スコアシート 自動同期連携中】").setFontWeight("bold").setFontSize(14).setFontColor("#10b981");
  sheet.getRange("A4:F4").setValues([["半荘", "東家", "南家", "西家", "北家", "合計0チェック"]]).setBackground("#1b2a24").setFontColor("#ffffff").setFontWeight("bold");
  SpreadsheetApp.getUi().alert("✅ 初期セットアップ完了！右上の「デプロイ」から「ウェブアプリ」として公開してください。");
}

// スプレッドシート上に見やすい一覧表を描画
function renderHumanFriendlySheet(sheet, data) {
  var mode = data.mode || "4p";
  var seats = (data.activeSeats && data.activeSeats[mode]) ? data.activeSeats[mode] : ["東家", "南家", "西家", "北家"];
  var rows = (data.sheets && data.sheets[mode]) ? data.sheets[mode] : [];

  sheet.getRange("A3").setValue("【麻雀スコア記録 (" + (mode === "4p" ? "四麻" : "三麻") + ")】");
  sheet.getRange("A3").setFontWeight("bold").setFontSize(12);

  var headers = ["半荘"];
  for (var i = 0; i < seats.length; i++) {
    headers.push(seats[i]);
  }
  headers.push("合計チェック");

  sheet.getRange(4, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(4, 1, 1, headers.length).setBackground("#1b2a24").setFontColor("#ffffff").setFontWeight("bold");

  var outputRows = [];
  for (var r = 0; r < rows.length; r++) {
    var rowData = ["第" + (r + 1) + "半荘"];
    var sum = 0;
    var filled = true;
    for (var c = 0; c < seats.length; c++) {
      var val = rows[r][c];
      if (val !== null && val !== undefined && val !== "") {
        rowData.push(Number(val));
        sum += Number(val);
      } else {
        rowData.push("");
        filled = false;
      }
    }
    var roundedSum = Math.round(sum * 10) / 10;
    if (filled) {
      rowData.push(Math.abs(roundedSum) < 0.001 ? "OK (0.0)" : "ERROR (" + roundedSum + ")");
    } else {
      rowData.push("入力中");
    }
    outputRows.push(rowData);
  }

  if (outputRows.length > 0) {
    sheet.getRange(5, 1, outputRows.length, headers.length).setValues(outputRows);
  }
}
