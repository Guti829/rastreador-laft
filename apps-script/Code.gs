/**
 * Rastreador LA/FT — backend de ranking en Google Sheets.
 * Pega este archivo en Extensiones > Apps Script de una hoja de cálculo nueva,
 * ejecuta `configurar` una vez y despliega como aplicación web
 * (Ejecutar como: yo · Acceso: cualquier persona).
 */

const SALT = 'RASTRO26';
const MAX_SCORE = 8000; // tope de puntaje plausible para una partida
const PROCESOS = ['Comercial', 'Jurídico', 'Gestión Humana', 'Financiero', 'Tesorería', 'Auditoría',
  'TIC', 'Seguridad', 'Colocador independiente', 'Auxiliar asesor'];

function configurar() {
  const ss = SpreadsheetApp.getActive();
  const partidas = ss.getSheetByName('Partidas') || ss.insertSheet('Partidas');
  if (partidas.getLastRow() === 0) {
    partidas.appendRow(['Fecha', 'Nombre', 'Proceso', 'Puntos', 'Señales', 'Controles',
      'Falsos positivos', 'Billetes', 'Reto (de 3)', 'Mitigación %', 'Código', 'Código válido']);
    partidas.setFrozenRows(1);
  }
  const ranking = ss.getSheetByName('Ranking') || ss.insertSheet('Ranking');
  if (ranking.getLastRow() === 0) {
    ranking.appendRow(['Clave', 'Nombre', 'Proceso', 'Mejor puntaje', 'Código', 'Fecha']);
    ranking.setFrozenRows(1);
  }
}

function norm_(s) {
  return String(s || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function hash_(s) {
  let h = 2166136261 >>> 0;
  for (const ch of s) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(7, '0').slice(-5);
}

function makeCode_(nick, proc, score) {
  return 'RLA-' + score + '-' + hash_(norm_(nick) + '|' + norm_(proc) + '|' + score + '|' + SALT);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'top';
  if (action !== 'top') return json_({ ok: false, error: 'acción desconocida' });
  const sh = SpreadsheetApp.getActive().getSheetByName('Ranking');
  if (!sh || sh.getLastRow() < 2) return json_({ ok: true, top: [] });
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues();
  const top = rows
    .map(r => ({ nick: String(r[1]), proc: String(r[2]), score: Number(r[3]) || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  return json_({ ok: true, top: top });
}

function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'datos inválidos' });
  }
  const nick = String(d.nick || '').trim().slice(0, 24);
  const proc = String(d.proc || '').trim();
  const score = Math.round(Number(d.score));
  if (nick.length < 2) return json_({ ok: false, error: 'nombre inválido' });
  if (PROCESOS.indexOf(proc) === -1) return json_({ ok: false, error: 'proceso inválido' });
  if (!isFinite(score) || score < 0 || score > MAX_SCORE) return json_({ ok: false, error: 'puntaje inválido' });

  const code = String(d.code || '');
  const valid = code === makeCode_(nick, proc, score);
  if (!valid) return json_({ ok: false, error: 'código no coincide' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActive();
    const now = new Date();
    ss.getSheetByName('Partidas').appendRow([now, nick, proc, score,
      d.alerts || 0, d.controls || 0, d.fp || 0, d.bills || 0, d.quiz || 0, d.mitigation || 0, code, valid ? 'Sí' : 'No']);

    const rk = ss.getSheetByName('Ranking');
    const key = norm_(nick) + '|' + norm_(proc);
    const n = rk.getLastRow() - 1;
    const keys = n > 0 ? rk.getRange(2, 1, n, 1).getValues().map(r => r[0]) : [];
    const idx = keys.indexOf(key);
    if (idx === -1) {
      rk.appendRow([key, nick, proc, score, code, now]);
      return json_({ ok: true, best: true, bestScore: score });
    }
    const row = idx + 2;
    const prev = Number(rk.getRange(row, 4).getValue()) || 0;
    if (score > prev) {
      rk.getRange(row, 2, 1, 5).setValues([[nick, proc, score, code, now]]);
      return json_({ ok: true, best: true, bestScore: score });
    }
    return json_({ ok: true, best: false, bestScore: prev });
  } finally {
    lock.releaseLock();
  }
}
