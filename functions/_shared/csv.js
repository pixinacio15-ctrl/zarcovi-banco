function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let quote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && quote && next === '"') {
      cur += '"';
      i++;
    } else if (ch === '"') {
      quote = !quote;
    } else if (ch === ',' && !quote) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(v => v.trim());
}

export function parseCsv(text) {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvLine);
}

function numberValue(value) {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value)
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3})/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function textValue(value) {
  return String(value || "").trim();
}

export function sheetRowsToAccounts(rows) {
  const headerIndex = rows.findIndex(row =>
    row.some(v => String(v).toLowerCase() === "vila") &&
    row.some(v => String(v).toLowerCase() === "conta")
  );

  if (headerIndex < 0) {
    throw new Error("Cabeçalho não encontrado. Procure por: Vila, CONTA, Level, Ryos Visível...");
  }

  const header = rows[headerIndex].map(v => String(v).trim().toLowerCase());
  const col = names => {
    for (const name of names) {
      const index = header.indexOf(name.toLowerCase());
      if (index >= 0) return index;
    }
    return -1;
  };

  const indexes = {
    village: col(["vila"]),
    account_code: col(["conta"]),
    level: col(["level"]),
    ryos_visible: col(["ryos visível", "ryos visivel", "ryos"]),
    salary: col(["salário", "salario"]),
    cargo: col(["cargos", "cargo"]),
    fire_will: col(["v. fogo", "fogo"]),
    stone_will: col(["v. pedra", "pedra"]),
    character_name: col(["personagem"]),
    treasure: col(["tesouro"])
  };

  if (indexes.account_code < 0) {
    throw new Error("Coluna CONTA não encontrada.");
  }

  const accounts = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const code = textValue(row[indexes.account_code]).toUpperCase();

    if (!/^[A-Z]{2}\d{4}$/i.test(code)) continue;

    accounts.push({
      account_code: code,
      village: indexes.village >= 0 ? textValue(row[indexes.village]) : null,
      level: indexes.level >= 0 ? Math.trunc(numberValue(row[indexes.level])) || 1 : 1,
      ryos_visible: indexes.ryos_visible >= 0 ? numberValue(row[indexes.ryos_visible]) : 0,
      salary: indexes.salary >= 0 ? numberValue(row[indexes.salary]) : 0,
      cargo: indexes.cargo >= 0 ? textValue(row[indexes.cargo]) || "Sem Cargo" : "Sem Cargo",
      fire_will: indexes.fire_will >= 0 ? numberValue(row[indexes.fire_will]) : 0,
      stone_will: indexes.stone_will >= 0 ? numberValue(row[indexes.stone_will]) : 0,
      character_name: indexes.character_name >= 0 ? textValue(row[indexes.character_name]) : null,
      treasure: indexes.treasure >= 0 ? numberValue(row[indexes.treasure]) : 0,
      source_row: i + 1,
      last_synced_at: new Date().toISOString()
    });
  }

  const unique = new Map();
  for (const account of accounts) unique.set(account.account_code, account);
  return [...unique.values()];
}
