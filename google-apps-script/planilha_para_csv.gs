/**
 * Google Apps Script opcional para transformar a planilha em CSV limpo.
 *
 * Como usar:
 * 1. Abra a planilha.
 * 2. Extensões > Apps Script.
 * 3. Cole este código.
 * 4. Ajuste SHEET_NAME se necessário.
 * 5. Implantar > Nova implantação > App da Web.
 * 6. Acesso: Qualquer pessoa com o link.
 * 7. Use a URL /exec como SYNC_SOURCE_URL no Cloudflare Pages.
 */

const SHEET_NAME = 'Página1';
const HEADER_NAMES = ['Vila', 'CONTA', 'Level', 'Ryos Visível', 'Salário', 'Cargos', 'V. Fogo', 'V. Pedra', 'Personagem', 'Tesouro'];

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const values = sheet.getDataRange().getValues();
  const headerRow = findHeaderRow(values);
  if (headerRow < 0) {
    return ContentService.createTextOutput('Cabeçalho não encontrado').setMimeType(ContentService.MimeType.TEXT);
  }

  const headers = values[headerRow].map(String);
  const idx = HEADER_NAMES.map(name => findColumn(headers, name));
  const out = [HEADER_NAMES];

  for (let r = headerRow + 1; r < values.length; r++) {
    const row = values[r];
    const account = String(row[idx[1]] || '').trim().toUpperCase();
    if (!/^[A-Z]{2}\d{4}$/.test(account)) continue;
    out.push(idx.map(i => i >= 0 ? row[i] : ''));
  }

  return ContentService
    .createTextOutput(toCsv(out))
    .setMimeType(ContentService.MimeType.CSV);
}

function findHeaderRow(values) {
  for (let r = 0; r < values.length; r++) {
    const line = values[r].map(clean).join('|');
    if (line.includes('vila') && line.includes('conta') && line.includes('level')) return r;
  }
  return -1;
}

function findColumn(headers, name) {
  const target = clean(name);
  return headers.findIndex(h => clean(h) === target || clean(h).includes(target));
}

function clean(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function toCsv(rows) {
  return rows.map(row => row.map(cell => {
    const text = String(cell ?? '');
    return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }).join(',')).join('\n');
}
