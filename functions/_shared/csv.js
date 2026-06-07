export function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(value);
      if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
      row = [];
      value = '';
      continue;
    }
    value += char;
  }

  row.push(value);
  if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
  return rows;
}

function cleanKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findHeaderIndex(headers, aliases) {
  const keys = headers.map(cleanKey);
  for (const alias of aliases) {
    const normalized = cleanKey(alias);
    const index = keys.findIndex(k => k === normalized || k.includes(normalized));
    if (index >= 0) return index;
  }
  return -1;
}

export function toNumber(value, fallback = 0) {
  const s = String(value ?? '')
    .replace(/\s/g, '')
    .replace(/B$/i, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeAccountsCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];

  let headerRowIndex = rows.findIndex(row => {
    const joined = row.map(cleanKey).join(' | ');
    return joined.includes('vila') && joined.includes('conta') && joined.includes('level');
  });

  if (headerRowIndex < 0) {
    throw new Error('Cabeçalho não encontrado. O CSV precisa ter: Vila, CONTA, Level, Ryos Visível, Salário, Cargos, V. Fogo, V. Pedra, Personagem, Tesouro.');
  }

  const headers = rows[headerRowIndex];
  const idx = {
    village: findHeaderIndex(headers, ['Vila']),
    account_code: findHeaderIndex(headers, ['CONTA', 'Conta']),
    level: findHeaderIndex(headers, ['Level', 'Lvl']),
    ryos_visible: findHeaderIndex(headers, ['Ryos Visível', 'Ryos Visivel', 'Ryos']),
    salary: findHeaderIndex(headers, ['Salário', 'Salario']),
    cargos: findHeaderIndex(headers, ['Cargos', 'Cargo']),
    will_fire: findHeaderIndex(headers, ['V. Fogo', 'Fogo']),
    will_stone: findHeaderIndex(headers, ['V. Pedra', 'Pedra']),
    character_name: findHeaderIndex(headers, ['Personagem']),
    treasure: findHeaderIndex(headers, ['Tesouro'])
  };

  if (idx.account_code < 0) throw new Error('Coluna CONTA não encontrada no CSV.');

  const accounts = [];
  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    const accountCode = String(row[idx.account_code] || '').trim().toUpperCase();
    if (!/^[A-Z]{2}\d{4}$/.test(accountCode)) continue;

    accounts.push({
      account_code: accountCode,
      village: idx.village >= 0 ? String(row[idx.village] || '').trim() : null,
      level: idx.level >= 0 ? Math.max(0, Math.floor(toNumber(row[idx.level], 1))) : 1,
      ryos_visible: idx.ryos_visible >= 0 ? toNumber(row[idx.ryos_visible], 0) : 0,
      salary: idx.salary >= 0 ? toNumber(row[idx.salary], 0) : 0,
      cargos: idx.cargos >= 0 ? String(row[idx.cargos] || 'Sem Cargo').trim() : 'Sem Cargo',
      will_fire: idx.will_fire >= 0 ? Math.floor(toNumber(row[idx.will_fire], 0)) : 0,
      will_stone: idx.will_stone >= 0 ? Math.floor(toNumber(row[idx.will_stone], 0)) : 0,
      character_name: idx.character_name >= 0 ? String(row[idx.character_name] || '').trim() : null,
      treasure: idx.treasure >= 0 ? toNumber(row[idx.treasure], 0) : 0,
      source_row: r + 1,
      source_hash: hashRow(row)
    });
  }
  return accounts;
}

function hashRow(row) {
  let hash = 0;
  const str = row.join('|');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}
