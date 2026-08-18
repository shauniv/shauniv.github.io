/**
 * Minimal .xlsx reader — enough to pull a sheet out as rows of strings.
 *
 * An .xlsx is a ZIP of XML files, and Node ships both the inflate (zlib) and
 * everything else needed, so this stays dependency-free like build-static.mjs.
 * It handles what Excel writes for a plain data sheet: shared strings, inline
 * strings, numbers and booleans. It is not a general xlsx library.
 */

import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

// ── ZIP ──────────────────────────────────────────────────────────────────────

/** Returns Map<filename, Buffer> for every entry in the archive. */
function unzip(buf) {
  // Locate the End Of Central Directory record by scanning back from the end.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65536; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error('not a zip file (no end-of-central-directory record)');

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();

  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory entry');
    const method   = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen  = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen   = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name     = buf.toString('utf8', p + 46, p + 46 + nameLen);

    // The local header repeats the name and extra field with its own lengths.
    const lNameLen  = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compSize);

    files.set(name, method === 0 ? raw : inflateRawSync(raw));
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return files;
}

// ── XML ──────────────────────────────────────────────────────────────────────

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X'
        ? parseInt(e.slice(2), 16)
        : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e] ?? m;
  });
}

/** All <t> text inside a fragment, concatenated (rich text arrives as runs). */
function textOf(fragment) {
  let out = '';
  for (const m of fragment.matchAll(/<t\b[^>]*\/>|<t\b[^>]*>([\s\S]*?)<\/t>/g)) {
    out += decode(m[1] ?? '');
  }
  return out;
}

/** 'AB' → 27 (1-based column number). */
function colNum(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

// ── Public ───────────────────────────────────────────────────────────────────

/**
 * Reads one sheet as a dense array of rows of strings. Blank cells become ''.
 * `sheetName` matches the tab name shown in Excel.
 */
export function readSheet(path, sheetName) {
  const files = unzip(readFileSync(path));

  const get = (name) => {
    const b = files.get(name);
    return b ? b.toString('utf8') : null;
  };

  // workbook.xml maps sheet names to r:id; the rels file maps r:id to a target.
  const workbook = get('xl/workbook.xml');
  if (!workbook) throw new Error('xl/workbook.xml missing — not an xlsx?');
  const rels = get('xl/_rels/workbook.xml.rels') ?? '';

  let target = null;
  for (const m of workbook.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const attrs = m[1];
    const name = decode(/name="([^"]*)"/.exec(attrs)?.[1] ?? '');
    if (name !== sheetName) continue;
    const rid = /r:id="([^"]*)"/.exec(attrs)?.[1];
    // Scan the relationship tags rather than building a regex out of rid --
    // no escaping games, and a stray character in the id cannot break out.
    for (const rm of rels.matchAll(/<Relationship [^>]*>/g)) {
      if (/ Id="([^"]*)"/.exec(rm[0])?.[1] !== rid) continue;
      target = /Target="([^"]*)"/.exec(rm[0])?.[1] ?? null;
      break;
    }
    break;
  }
  if (!target) {
    const names = [...workbook.matchAll(/<sheet\b[^>]*name="([^"]*)"/g)].map((m) => decode(m[1]));
    throw new Error(`sheet "${sheetName}" not found. Sheets present: ${names.join(', ')}`);
  }

  const sheetPath = target.startsWith('/')
    ? target.slice(1)
    : 'xl/' + target.replace(/^\.\//, '');
  const sheet = get(sheetPath);
  if (!sheet) throw new Error(`sheet part ${sheetPath} missing from archive`);

  // Shared strings are referenced by index from cells with t="s".
  const sharedXml = get('xl/sharedStrings.xml') ?? '';
  const shared = [...sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));

  const rows = [];
  for (const rowM of sheet.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNum = parseInt(/r="(\d+)"/.exec(rowM[1])?.[1] ?? String(rows.length + 1), 10);
    const cells = [];
    for (const cm of rowM[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1];
      const inner = cm[2] ?? '';
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1];
      const type = /t="([^"]*)"/.exec(attrs)?.[1] ?? 'n';

      let value = '';
      if (type === 's') {
        const idx = parseInt(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '-1', 10);
        value = shared[idx] ?? '';
      } else if (type === 'inlineStr') {
        value = textOf(inner);
      } else if (type === 'str') {
        value = decode(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '');
      } else if (type === 'b') {
        value = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] === '1' ? 'TRUE' : 'FALSE';
      } else {
        value = decode(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '');
      }

      const at = ref ? colNum(ref) - 1 : cells.length;
      while (cells.length < at) cells.push('');
      cells[at] = value;
    }
    while (rows.length < rowNum - 1) rows.push([]);
    rows[rowNum - 1] = cells;
  }
  return rows;
}
