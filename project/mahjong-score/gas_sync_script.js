/**
 * ========================================================
 * 🀄 麻雀スコアシート × Googleスプレッドシート 自動同期スクリプト (GAS v2 - 完全CORS回避版)
 * ========================================================
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 1. データ書き込み (action = save)
  if (e && e.parameter && e.parameter.action === "save" && e.parameter.data) {
    try {
      var rawData = e.parameter.data;
      var data = JSON.parse(rawData);

      // A1セルに最新JSONを保存
      sheet.getRange("A1").setValue(rawData);

      // 見やすい表形式を描画
      renderHumanFriendlySheet(sheet, data);

      var output = JSON.stringify({ status: "success", timestamp: new Date().getTime() });
      return ContentService.createTextOutput(e.parameter.callback ? e.parameter.callback + "(" + output + ")" : output)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } catch (err) {
      var errOut = JSON.stringify({ status: "error", message: err.toString() });
      return ContentService.createTextOutput(e.parameter.callback ? e.parameter.callback + "(" + errOut + ")" : errOut)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
  }

  // 2. データ読み込み (action = load またはパラメータなし)
  var jsonCell = sheet.getRange("A1").getValue();
  if (!jsonCell) {
    jsonCell = JSON.stringify({ empty: true });
  }

  // JSONPまたは標準JSONレスポンス
  if (e && e.parameter && e.parameter.callback) {
    return ContentService.createTextOutput(e.parameter.callback + "(" + jsonCell + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(jsonCell)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // doGetへフォールバック
  return doGet(e);
}

// スプレッドシート上に見やすい一覧表を描画
function renderHumanFriendlySheet(sheet, data) {
  var mode = data.mode || "4p";
  var seats = (data.activeSeats && data.activeSeats[mode]) ? data.activeSeats[mode] : ["東家", "南家", "西家", "北家"];
  var rows = (data.sheets && data.sheets[mode]) ? data.sheets[mode] : [];

  sheet.getRange("A3").setValue("【麻雀スコア記録 (" + (mode === "4p" ? "四麻" : "三麻") + ")】").setFontWeight("bold").setFontSize(12);

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

  // 古いデータを一度クリア
  var lastRow = sheet.getLastRow();
  if (lastRow >= 5) {
    sheet.getRange(5, 1, lastRow - 4, headers.length).clearContent();
  }

  if (outputRows.length > 0) {
    sheet.getRange(5, 1, outputRows.length, headers.length).setValues(outputRows);
  }
}
