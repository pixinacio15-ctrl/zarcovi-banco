// Opcional.
// Use se o link CSV direto da planilha não funcionar.
// Apps Script > Implantar > App da Web > Qualquer pessoa com o link.

function doGet() {
  const ss = SpreadsheetApp.openById('1cUVGRl63tyJvxRK-9nlAhnLBdgunEy9OU-sKYNIx83Y');
  const sheet = ss.getSheetByName('Página1') || ss.getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues();
  const csv = values.map(row => row.map(cell => {
    const value = String(cell || '');
    if (/[",\n]/.test(value)) return '"' + value.replace(/"/g, '""') + '"';
    return value;
  }).join(',')).join('\n');

  return ContentService
    .createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV);
}
