/*
Opcional: use isto no Google Apps Script se a planilha não abrir como CSV público.
1. Extensões > Apps Script
2. Cole este código
3. Implantar > Nova implantação > App da Web
4. Acesso: Qualquer pessoa com o link
5. Use a URL gerada em SYNC_SOURCE_URL
*/

function doGet() {
  const spreadsheetId = '1cUVGRl63tyJvxRK-9nlAhnLBdgunEy9OU-sKYNIx83Y';
  const gid = 1529142004;
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheets().find(s => s.getSheetId() === gid) || ss.getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues();
  const csv = values.map(row => row.map(cell => {
    const value = String(cell || '');
    return '"' + value.replace(/"/g, '""') + '"';
  }).join(',')).join('\n');

  return ContentService
    .createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV);
}
