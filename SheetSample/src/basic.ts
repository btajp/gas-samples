// Activeなシートを取得して変数に格納（汎用性が無いので、シートIDを指定して取得する方が良い）
// const ss = SpreadsheetApp.getActiveSheet();

// スプレッドシートのIDとシート名を指定してシートを取得

const ssID = '1GOM9ZPLyASRGgsSXxphG6VK_1egcjW5sk8cSx5MCFjY'
const sheetName = 'cities'
const ss = SpreadsheetApp.openById(spreadsheetID)
const sheet = ss.getSheetByName(sheetName)


// シートの最終行を取得
function main() {
  const lastRow = sheet.getLastRow();
  Logger.log(lastRow);
}