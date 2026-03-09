/**
 * App Script for appending rows to the current spreadsheet in response to
 * a POST request.
 * Select Extensions -> Apps Script and paste this in, then deploy it.
 * @param {object} data json-encoded object
 * @param {string?} data.spreadsheetID optional spreadsheet ID, defaults
 * to the spreadsheet that the appscript is associated with.
 * @param {string?} data.sheetName optional sheet name, defaults
 * to the first sheet in the spreadsheet.
 * @param {object[][]} data.rows the rows to add to the sheet
 * @return {number[]} JSON-encoded array of the first column of rows
 */
/* global SpreadsheetApp, ContentService */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  function report(data) {
    return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  }

  let spreadsheet;
  if (data.spreadsheetID) {
    spreadsheet = SpreadsheetApp.openById(data.spreadsheetID);
    if (!spreadsheet)
      return report({
        error: `Could not open spreadsheet ${data.spreadsheetID}`
      });
  } else {
    // AppScript must be associated with a sheet
    spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet)
      return report({
        error: "No active spreadsheet"
      });
  }

  let sheet;
  if (data.sheetName) {
    sheet = spreadsheet.getSheetByName(data.sheetName);
    if (!sheet)
      return report({
        error: `No such sheet ${data.sheetName}`
    });
  } else
    // Default to the first sheet
    sheet = spreadsheet.getSheets()[0];
    
  sheet.getRange(
      sheet.getLastRow() + 1,
      1,
      data.rows.length,
      data.rows[0].length
    ).setValues(data.rows);

  return ContentService
    .createTextOutput(JSON.stringify(data.rows.map(r => r[0])))
  .setMimeType(ContentService.MimeType.JSON); 
}
