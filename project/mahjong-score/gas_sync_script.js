/**
 * ========================================================
 * 🀄 麻雀スコアシート × Googleスプレッドシート 自動同期スクリプト (GAS)
 * ========================================================
 * 
 * 【設定手順】
 * 1. Googleスプレッドシートを新規作成します。
 * 2. 画面上のメニュー「拡張機能」➜「Apps Script」をクリックします。
 * 3. 元からあるコードをすべて消して、このコードをそのまま貼り付けます。
 * 4. 右上の「デプロイ」➜「新しいデプロイ」をクリックします。
 * 5. 種類の選択で「ウェブアプリ」を選びます。
 * 6. アクセスできるユーザーを「全員 (Anyone)」に設定して「デプロイ」を押します。
 * 7. 表示された「ウェブアプリのURL」をコピーして、麻雀アプリに貼り付ければ完了です！
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

// スプレッドシート上に見やすい一覧表を描画
function renderHumanFriendlySheet(sheet, data) {
  var mode = data.mode || "4p";
  var seats = (data.activeSeats && data.activeSeats[mode]) ? data.activeSeats[mode] : ["東家", "南家", "西家", "北家"];
  var rows = (data.sheets && data.sheets[mode]) ? data.sheets[mode] : [];

  // 3行目から表を描画
  sheet.getRange("A3").setValue("【麻雀スコア記録 (" + (mode === "4p" ? "四麻" : "三麻") + ")】");
  sheet.getRange("A3").setFontWeight("bold");

  // ヘッダー (半荘番号 + プレイヤー名 + 合計)
  var headers = ["半荘"];
  for (var i = 0; i < seats.length; i++) {
    headers.push(seats[i]);
  }
  headers.push("合計チェック");

  sheet.getRange(4, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(4, 1, 1, headers.length).setBackground("#1b2a24").setFontColor("#ffffff").setFontWeight("bold");

  // 各半荘のスコア行
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
