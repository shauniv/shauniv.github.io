/**
 * Turns Tire Catalog.xlsx into the TIRE_CATALOG array inside the plugin JS.
 *
 *   node tools/build-catalog.mjs
 *
 * Jan maintains the spreadsheet; this makes it the single source of truth so
 * adding 650B and 700C really is "rows, not code". The generated block sits
 * between two markers in tire-pressure-calculator.js and is replaced wholesale
 * — never hand-edit between them.
 *
 * The reader is dependency-free (tools/xlsx-read.mjs), matching build-static.mjs.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSheets } from './xlsx-read.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKBOOK = join(ROOT, 'Tire Catalog.xlsx');
const TARGET = join(ROOT, 'tire-pressure-calculator', 'assets', 'tire-pressure-calculator.js');

const BEGIN = '// ── BEGIN GENERATED CATALOG';
const END = '// ── END GENERATED CATALOG';

// Columns the calculator needs. Anything else on the sheet is Jan's business.
const REQUIRED = [
  'Wheel Size', 'Model Name', 'Nominal Size', 'Design Rim Width',
  'Actual Width Baseline (mm)', 'Tread Pattern',
  'Extralight', 'Standard', 'Endurance', 'Endurance Plus',
  'Tubeless Compatible', 'In Production',
];

const CASINGS = ['Extralight', 'Standard', 'Endurance', 'Endurance Plus'];
const TREADS = ['Smooth All-Road', 'Semi-Slick', 'Dual-Purpose Knobby'];

const problems = [];
const warnings = [];
const fail = (row, msg) => problems.push(`row ${row}: ${msg}`);

// ── Read ─────────────────────────────────────────────────────────────────────

// Find the catalog by its headers, not by its tab name: Excel truncates long
// sheet names to 31 characters and a "Save As" can rename the tab outright, and
// the data is what matters. First sheet whose header row has the columns wins.
const sheets = readAllSheets(WORKBOOK);
const headerOf = (rows) => (rows[0] ?? []).map((h) => String(h).trim());
const scored = sheets.map((s) => {
  const header = headerOf(s.rows);
  return { ...s, header, missing: REQUIRED.filter((h) => !header.includes(h)) };
});
const picked = scored.find((s) => s.missing.length === 0);

if (!picked) {
  const best = scored.slice().sort((a, b) => a.missing.length - b.missing.length)[0];
  throw new Error(
    `No sheet in Tire Catalog.xlsx has the required columns.\n` +
    `Sheets: ${sheets.map((s) => `"${s.name}"`).join(', ')}\n` +
    `Closest is "${best.name}", missing: ${best.missing.join(', ')}\n` +
    `Columns it has: ${best.header.filter(Boolean).join(', ')}`
  );
}

const rows = picked.rows;
const header = picked.header;
const col = {};
header.forEach((h, i) => { if (h) col[h] = i; });
if (sheets.length > 1 || picked.name !== 'Tire Catalog') {
  console.log(`sheet  "${picked.name}"`);
}

const cell = (r, name) => String(r[col[name]] ?? '').trim();

/** Y/N, case-insensitive, blank not allowed. */
function yesNo(r, rowNum, name) {
  const v = cell(r, name).toUpperCase();
  if (v === 'Y' || v === 'YES' || v === 'TRUE') return true;
  if (v === 'N' || v === 'NO' || v === 'FALSE') return false;
  fail(rowNum, `${name} should be Y or N, found ${JSON.stringify(cell(r, name))}`);
  return false;
}

function number(r, rowNum, name, { required = true } = {}) {
  const raw = cell(r, name);
  if (!raw) {
    if (required) fail(rowNum, `${name} is blank`);
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    fail(rowNum, `${name} should be a number, found ${JSON.stringify(raw)}`);
    return null;
  }
  return n;
}

// ── Parse ────────────────────────────────────────────────────────────────────

const tires = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const rowNum = i + 1;

  // A real tire row fills most of its columns. Blank rows and the trailing
  // provenance note -- prose sitting alone in column A -- are skipped in
  // silence, so Jan can annotate the sheet without tripping the validator.
  const filled = r.filter((v) => String(v ?? '').trim()).length;
  if (filled <= 1) continue;

  const size = cell(r, 'Wheel Size');
  const model = cell(r, 'Model Name');
  if (!size || !model) {
    fail(rowNum, 'has a Wheel Size or a Model Name but not both');
    continue;
  }

  const tread = cell(r, 'Tread Pattern');
  if (!TREADS.includes(tread)) {
    fail(rowNum, `Tread Pattern ${JSON.stringify(tread)} is not one of: ${TREADS.join(', ')}`);
  }

  const nominal = cell(r, 'Nominal Size');
  if (!nominal) fail(rowNum, 'Nominal Size is blank');

  // Optional. Whatever Jan puts here becomes the parenthetical in the tire's
  // name, verbatim and fixed -- '42 mm' for Naches Pass, '29" x 2.2"' for the
  // wide 700C tires. Blank means no parenthetical at all.
  const nominal2 = 'Nominal Size 2' in col ? cell(r, 'Nominal Size 2') : '';

  const baseline = number(r, rowNum, 'Actual Width Baseline (mm)');
  const designRim = number(r, rowNum, 'Design Rim Width');
  if (baseline !== null && (baseline < 15 || baseline > 120)) {
    fail(rowNum, `Actual Width Baseline of ${baseline} mm looks wrong (expected 15–120)`);
  }

  const casings = CASINGS.filter((c) => yesNo(r, rowNum, c));
  if (!casings.length) fail(rowNum, `${model} is marked N for every casing, so it can never be recommended`);

  const priority = number(r, rowNum, 'Priority', { required: false });

  tires.push({
    size,
    model,
    nominal,
    nominal2,
    designRim: designRim ?? 0,
    baseline: baseline ?? 0,
    tread,
    casings,
    tubeless: yesNo(r, rowNum, 'Tubeless Compatible'),
    inProduction: yesNo(r, rowNum, 'In Production'),
    priority: priority ?? 1,
    rowNum,
  });
}

if (!tires.length) problems.push('no tire rows found');

// One row per tire per tread: the same model and tread twice in a size is a
// duplicate, and would make the pick order depend on sheet order.
const seen = new Map();
for (const t of tires) {
  const key = `${t.size}|${t.model}|${t.tread}`;
  if (seen.has(key)) {
    fail(t.rowNum, `duplicates row ${seen.get(key)} (same wheel size, model and tread)`);
  } else {
    seen.set(key, t.rowNum);
  }
}

// A parenthetical that repeats the nominal size prints the same number twice.
for (const t of tires) {
  if (t.nominal2 && t.nominal2 === t.nominal) {
    warnings.push(
      `row ${t.rowNum}: Nominal Size 2 repeats Nominal Size (${JSON.stringify(t.nominal)}), ` +
      `so the name would print it twice -- leave it blank instead`
    );
  }
}

// The wheel size doubles as the dropdown label, so near-misses become two menu
// entries. Flag sizes that look like one another written two ways.
const sizeKeys = [...new Set(tires.map((t) => t.size))];
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
for (let i = 0; i < sizeKeys.length; i++) {
  for (let j = i + 1; j < sizeKeys.length; j++) {
    const a = norm(sizeKeys[i]);
    const b = norm(sizeKeys[j]);
    if (a.startsWith(b) || b.startsWith(a)) {
      warnings.push(
        `Wheel Size ${JSON.stringify(sizeKeys[i])} and ${JSON.stringify(sizeKeys[j])} look like ` +
        `one size written two ways -- they will appear as separate menu entries`
      );
    }
  }
}

const live = tires.filter((t) => t.inProduction);
if (tires.length && !live.length) problems.push('every tire is marked In Production = N');

if (problems.length) {
  console.error(`\n${problems.length} problem(s) in Tire Catalog.xlsx:\n`);
  problems.forEach((p) => console.error(`  ✗ ${p}`));
  console.error('\nNothing written. Fix the spreadsheet and run again.\n');
  process.exit(1);
}

// ── Emit ─────────────────────────────────────────────────────────────────────

/** Single-quoted JS string literal. */
const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));

const w = {
  size: Math.max(...tires.map((t) => q(t.size).length)),
  nominal2: Math.max(...tires.map((t) => q(t.nominal2).length)),
  model: Math.max(...tires.map((t) => q(t.model).length)),
  nominal: Math.max(...tires.map((t) => q(t.nominal).length)),
  tread: Math.max(...tires.map((t) => q(t.tread).length)),
};

const body = tires.map((t) =>
  `    { size:${pad(q(t.size) + ',', w.size + 1)} model:${pad(q(t.model) + ',', w.model + 1)} ` +
  `nominal:${pad(q(t.nominal) + ',', w.nominal + 1)} nominal2:${pad(q(t.nominal2) + ',', w.nominal2 + 1)}\n` +
  `      designRim:${t.designRim}, baseline:${t.baseline},\n` +
  `      tread:${pad(q(t.tread) + ',', w.tread + 1)} casings:[${t.casings.map(q).join(',')}],\n` +
  `      tubeless:${pad(t.tubeless + ',', 7)} inProduction:${pad(t.inProduction + ',', 7)} priority:${t.priority} },`
).join('\n').replace(/[ \t]+$/gm, '');   // padding can leave line-end spaces

const sizes = [...new Set(tires.map((t) => t.size))];

const block = `${BEGIN} — do not edit by hand ──────────────────────
  // Generated from Tire Catalog.xlsx by tools/build-catalog.mjs. Jan maintains
  // the spreadsheet; run \`node tools/build-catalog.mjs\` after he sends a new one.
  //
  // One row per tire per tread pattern. \`baseline\` is the measured width on the
  // design rim, tubed, in a casing other than Extralight — every width the
  // finder shows is derived from it, see tireActualWidth().
  //
  // ${tires.length} tire${tires.length === 1 ? '' : 's'} across ${sizes.length} wheel size${sizes.length === 1 ? '' : 's'}: ${sizes.join(', ')}
  var TIRE_CATALOG = [
${body}
  ];
  ${END} ────────────────────────────────────────────`;

const src = readFileSync(TARGET, 'utf8');
const from = src.indexOf(BEGIN);
const to = src.indexOf(END);
if (from === -1 || to === -1) {
  throw new Error(`markers not found in ${TARGET} — expected ${BEGIN} … ${END}`);
}
const lineStart = src.lastIndexOf('\n', from) + 1;
const lineEnd = src.indexOf('\n', to);

const out = src.slice(0, lineStart) + '  ' + block + src.slice(lineEnd);
writeFileSync(TARGET, out);

console.log(`read  ${tires.length} tires from Tire Catalog.xlsx`);
console.log(`sizes ${sizes.join(', ')}`);
if (live.length !== tires.length) {
  console.log(`note  ${tires.length - live.length} not in production (kept, never recommended)`);
}
warnings.forEach((warn) => console.log(`warn  ${warn}`));
console.log(`wrote TIRE_CATALOG into tire-pressure-calculator.js`);
